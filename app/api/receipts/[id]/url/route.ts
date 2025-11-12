import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api-helpers";

/**
 * GET /api/receipts/[id]/url
 * Get signed URL for a receipt image
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);
    const { id } = await params;

    // Get receipt from database
    const { data: receipt, error } = await supabaseAdmin
      .from("receipts")
      .select("*")
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

    // Generate signed URL
    const { data: signedUrlData, error: urlError } = await supabaseAdmin.storage
      .from("receipts")
      .createSignedUrl(receipt.storage_path, 3600); // 1 hour expiry

    if (urlError || !signedUrlData?.signedUrl) {
      console.error("Error generating signed URL:", urlError);
      return createErrorResponse(
        "STORAGE_ERROR",
        "Failed to generate signed URL",
        500
      );
    }

    return createSuccessResponse({
      url: signedUrlData.signedUrl,
      expires_in: 3600,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error getting receipt URL:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}
