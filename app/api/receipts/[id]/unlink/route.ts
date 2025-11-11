import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api-helpers";

/**
 * DELETE /api/receipts/[id]/unlink
 * Unlink receipt from transaction
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);
    const { id } = await params;

    // Optional: specific transaction_id from query params
    const { searchParams } = new URL(request.url);
    const transaction_id = searchParams.get("transaction_id");

    // Verify receipt belongs to user
    const { data: receipt } = await supabaseAdmin
      .from("receipts")
      .select("id, transaction_id")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (!receipt) {
      return createErrorResponse(
        "NOT_FOUND",
        "Receipt not found or access denied",
        404
      );
    }

    // Remove link from junction table
    let deleteQuery = supabaseAdmin
      .from("transaction_receipts")
      .delete()
      .eq("receipt_id", id);

    if (transaction_id) {
      deleteQuery = deleteQuery.eq("transaction_id", transaction_id);
    }

    const { error: unlinkError } = await deleteQuery;

    if (unlinkError) {
      console.error("Database error:", unlinkError);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to unlink receipt",
        500,
        unlinkError
      );
    }

    // Also clear the receipt's transaction_id for backward compatibility
    await supabaseAdmin
      .from("receipts")
      .update({ transaction_id: null })
      .eq("id", id);

    return createSuccessResponse({
      receipt_id: id,
      unlinked: true,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error unlinking receipt:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}
