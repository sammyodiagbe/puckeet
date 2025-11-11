import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth, createErrorResponse } from "@/lib/api-helpers";

/**
 * GET /api/reports/export
 * Export transactions as CSV
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const from_date = searchParams.get("from_date");
    const to_date = searchParams.get("to_date");
    const format = searchParams.get("format") || "csv"; // csv, json

    // Build query with date filters
    let query = supabaseAdmin
      .from("transactions")
      .select("*, categories(name)")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (from_date) {
      query = query.gte("date", from_date);
    }
    if (to_date) {
      query = query.lte("date", to_date);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to export transactions",
        500,
        error
      );
    }

    if (format === "json") {
      return NextResponse.json(transactions, {
        headers: {
          "Content-Disposition": `attachment; filename="transactions-${Date.now()}.json"`,
          "Content-Type": "application/json",
        },
      });
    }

    // Generate CSV
    const headers = [
      "Date",
      "Description",
      "Merchant",
      "Amount",
      "Category",
      "Tags",
      "Notes",
      "Deductible",
      "Status",
    ];

    const rows = transactions.map((t) => [
      t.date,
      `"${(t.description || "").replace(/"/g, '""')}"`,
      `"${(t.merchant || "").replace(/"/g, '""')}"`,
      t.amount,
      `"${(t.categories?.name || "Uncategorized").replace(/"/g, '""')}"`,
      `"${(t.tags || []).join(", ")}"`,
      `"${(t.notes || "").replace(/"/g, '""')}"`,
      t.is_deductible ? "Yes" : "No",
      t.status,
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Disposition": `attachment; filename="transactions-${Date.now()}.csv"`,
        "Content-Type": "text/csv",
      },
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error exporting transactions:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}
