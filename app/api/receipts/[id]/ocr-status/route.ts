import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api-helpers";

/**
 * GET /api/receipts/[id]/ocr-status
 * Check OCR processing status for a receipt
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);
    const { id } = await params;

    // Get receipt with OCR data
    const { data: receipt, error } = await supabaseAdmin
      .from("receipts")
      .select("id, ocr_status, ocr_data, ocr_processed_at, ocr_error, suggested_category_id")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error || !receipt) {
      return createErrorResponse(
        "NOT_FOUND",
        "Receipt not found or access denied",
        404
      );
    }

    return createSuccessResponse({
      receipt_id: receipt.id,
      status: receipt.ocr_status || "pending",
      ocr_data: receipt.ocr_data,
      processed_at: receipt.ocr_processed_at,
      error: receipt.ocr_error,
      suggested_category_id: receipt.suggested_category_id,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error checking OCR status:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}
