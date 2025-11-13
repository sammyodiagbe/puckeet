import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  generateDetailedCSV,
  generateSummaryCSV,
  generateExportSummary,
  validateExportOptions,
  generateExportFileName,
  type ExportTransaction,
  type ExportOptions,
} from "@/lib/services/export-service";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const {
      taxYear,
      startDate,
      endDate,
      format = "csv",
      includeNonDeductible = false,
      requireReceipts = false,
      options = {},
    } = body;

    // Create export options
    const exportOptions: ExportOptions = {
      taxYear: taxYear || new Date().getFullYear(),
      startDate: startDate || `${taxYear}-01-01`,
      endDate: endDate || `${taxYear}-12-31`,
      includeNonDeductible,
      requireReceipts,
      applyMealsDeduction: options.applyMealsDeduction ?? true,
      includeGSTBreakdown: options.includeGSTBreakdown ?? true,
    };

    // Validate options
    const validation = validateExportOptions(exportOptions);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Invalid export options", details: validation.errors },
        { status: 400 }
      );
    }

    // Build query for transactions
    let query = supabase
      .from("transactions")
      .select(
        `
        *,
        category:categories(
          id,
          name,
          cra_line_number,
          cra_category_name,
          deductible_percentage,
          requires_special_handling,
          handling_notes
        ),
        receipts!receipts_transaction_id_fkey(
          id,
          file_name,
          storage_path,
          ocr_data
        )
      `
      )
      .eq("user_id", user.id)
      .gte("date", exportOptions.startDate)
      .lte("date", exportOptions.endDate)
      .order("date", { ascending: true });

    // Apply deductible filter if needed
    if (!includeNonDeductible) {
      query = query.eq("is_deductible", true);
    }

    // Apply receipt filter if needed
    if (requireReceipts) {
      query = query.not("receipts", "is", null);
    }

    const { data: transactions, error: txError } = await query;

    if (txError) {
      console.error("Error fetching transactions:", txError);
      return NextResponse.json(
        { error: "Failed to fetch transactions" },
        { status: 500 }
      );
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json(
        {
          error: "No transactions found for the specified criteria",
          summary: {
            totalTransactions: 0,
            totalAmount: 0,
            deductibleAmount: 0,
          },
        },
        { status: 404 }
      );
    }

    // Transform transactions for export
    const exportData: ExportTransaction[] = transactions.map((tx: any) => {
      // Extract GST/HST from OCR data if available
      const gstHst =
        tx.receipts?.[0]?.ocr_data?.tax ||
        tx.receipts?.[0]?.ocr_data?.gst ||
        0;

      // Get category info with fallback to "Other Expenses"
      const craLineNumber = tx.category?.cra_line_number || "9270";
      const craCategory = tx.category?.cra_category_name || "Other Expenses";
      const deductiblePercentage = tx.category?.deductible_percentage || 100;

      // Calculate amounts
      const amount = parseFloat(tx.amount);
      const totalAmount = amount + gstHst;
      const deductibleAmount = tx.is_deductible
        ? amount * (deductiblePercentage / 100)
        : 0;

      return {
        id: tx.id,
        date: new Date(tx.date),
        craLineNumber,
        craCategory,
        merchant: tx.merchant || "Unknown",
        description: tx.description || "",
        amount,
        gstHst,
        totalAmount,
        isDeductible: tx.is_deductible,
        deductiblePercentage,
        deductibleAmount,
        hasReceipt: tx.receipts && tx.receipts.length > 0,
        receiptFilename: tx.receipts?.[0]?.file_name,
        notes: tx.notes,
        paymentMethod: tx.receipts?.[0]?.ocr_data?.paymentMethod,
        tags: tx.tags || [],
      };
    });

    // Generate export summary
    const summary = generateExportSummary(exportData);

    // Generate appropriate export format
    let fileContent: string;
    let contentType: string;
    let fileName: string;

    switch (format) {
      case "csv":
        fileContent = generateDetailedCSV(exportData);
        contentType = "text/csv";
        fileName = generateExportFileName(exportOptions, "csv");
        break;

      case "csv-summary":
        fileContent = generateSummaryCSV(summary.categoryBreakdown);
        contentType = "text/csv";
        fileName = generateExportFileName(exportOptions, "csv-summary");
        break;

      default:
        fileContent = generateDetailedCSV(exportData);
        contentType = "text/csv";
        fileName = generateExportFileName(exportOptions, "csv");
    }

    // Upload to Supabase Storage
    const storagePath = `${user.id}/exports/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("exports")
      .upload(storagePath, fileContent, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      // If storage fails, return the file directly as download
      return new NextResponse(fileContent, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      });
    }

    // Get signed URL (24 hour expiry)
    const { data: urlData } = await supabase.storage
      .from("exports")
      .createSignedUrl(storagePath, 86400);

    // Return success response with download URL and summary
    return NextResponse.json({
      success: true,
      exportId: uploadData.id,
      fileName,
      fileUrl: urlData?.signedUrl,
      expiresAt: new Date(Date.now() + 86400000).toISOString(), // 24 hours
      summary: {
        totalTransactions: summary.totalTransactions,
        totalAmount: summary.totalAmount,
        totalGstHst: summary.totalGstHst,
        deductibleAmount: summary.deductibleAmount,
        nonDeductibleAmount: summary.nonDeductibleAmount,
        categoryBreakdown: summary.categoryBreakdown.map((cat) => ({
          lineNumber: cat.craLineNumber,
          categoryName: cat.craCategory,
          amount: cat.deductibleAmount,
          transactionCount: cat.transactionCount,
        })),
        warnings: summary.warnings,
      },
    });
  } catch (error) {
    console.error("Export generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate export",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve export options/preview
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const taxYear = parseInt(searchParams.get("taxYear") || String(new Date().getFullYear()));

    // Get transaction counts by month and category
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select(
        `
        id,
        date,
        amount,
        is_deductible,
        category:categories(cra_line_number, cra_category_name)
      `
      )
      .eq("user_id", user.id)
      .gte("date", `${taxYear}-01-01`)
      .lte("date", `${taxYear}-12-31`);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch preview data" },
        { status: 500 }
      );
    }

    // Calculate preview statistics
    const stats = {
      totalTransactions: transactions?.length || 0,
      deductibleTransactions:
        transactions?.filter((tx: any) => tx.is_deductible).length || 0,
      totalAmount:
        transactions?.reduce(
          (sum: number, tx: any) => sum + parseFloat(tx.amount),
          0
        ) || 0,
      deductibleAmount:
        transactions
          ?.filter((tx: any) => tx.is_deductible)
          .reduce((sum: number, tx: any) => sum + parseFloat(tx.amount), 0) ||
        0,
    };

    return NextResponse.json({
      success: true,
      taxYear,
      statistics: stats,
    });
  } catch (error) {
    console.error("Preview generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate preview" },
      { status: 500 }
    );
  }
}
