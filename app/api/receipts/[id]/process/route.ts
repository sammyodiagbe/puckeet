import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api-helpers";
import {
  processReceiptWithGPT4,
  isOpenAIConfigured,
  matchCategory,
} from "@/lib/ocr-gpt4";

/**
 * POST /api/receipts/[id]/process
 * Process receipt with GPT-4 Vision OCR
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);
    const { id } = await params;

    // Check if OpenAI is configured
    if (!isOpenAIConfigured()) {
      return createErrorResponse(
        "OCR_NOT_CONFIGURED",
        "OpenAI API key is not configured. OCR is not available.",
        500
      );
    }

    // Get receipt from database
    const { data: receipt, error: receiptError } = await supabaseAdmin
      .from("receipts")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (receiptError || !receipt) {
      return createErrorResponse(
        "NOT_FOUND",
        "Receipt not found or access denied",
        404
      );
    }

    // Check if already processed
    if (receipt.ocr_status === "completed") {
      return createSuccessResponse({
        message: "Receipt already processed",
        ocr_data: receipt.ocr_data,
      });
    }

    // Update status to processing
    await supabaseAdmin
      .from("receipts")
      .update({ ocr_status: "processing" })
      .eq("id", id);

    try {
      // Generate signed URL for the image (valid for 1 hour)
      const { data: signedUrlData, error: urlError } = await supabaseAdmin.storage
        .from("receipts")
        .createSignedUrl(receipt.storage_path, 3600);

      if (urlError || !signedUrlData?.signedUrl) {
        throw new Error("Failed to generate signed URL for receipt image");
      }

      // Process with GPT-4 Vision
      const ocrData = await processReceiptWithGPT4(signedUrlData.signedUrl);

      // Get all categories to match suggested category
      const { data: categories } = await supabaseAdmin
        .from("categories")
        .select("id, name")
        .or(`user_id.eq.${userId},is_default.eq.true`);

      const suggestedCategoryId = matchCategory(
        ocrData.categoryName || "",
        categories || []
      );

      // Update receipt with OCR data
      const { data: updatedReceipt, error: updateError } = await supabaseAdmin
        .from("receipts")
        .update({
          ocr_status: "completed",
          ocr_data: ocrData,
          ocr_processed_at: new Date().toISOString(),
          suggested_category_id: suggestedCategoryId,
          ocr_error: null,
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        throw new Error("Failed to save OCR results");
      }

      return createSuccessResponse({
        message: "Receipt processed successfully",
        receipt: updatedReceipt,
        ocr_data: ocrData,
        suggested_category_id: suggestedCategoryId,
      });
    } catch (ocrError: any) {
      console.error("OCR processing error:", ocrError);

      // Update receipt with error
      await supabaseAdmin
        .from("receipts")
        .update({
          ocr_status: "failed",
          ocr_error: ocrError.message || "OCR processing failed",
        })
        .eq("id", id);

      return createErrorResponse(
        "OCR_FAILED",
        `Failed to process receipt: ${ocrError.message}`,
        500,
        { originalError: ocrError.message }
      );
    }
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error processing receipt:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}
