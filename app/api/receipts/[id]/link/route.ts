import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api-helpers";
import { linkReceiptSchema } from "@/lib/validations/receipt";

/**
 * POST /api/receipts/[id]/link
 * Link receipt to transaction
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);
    const { id } = await params;

    const body = await request.json();
    const validation = linkReceiptSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid link data",
        400,
        validation.error.errors
      );
    }

    const { transaction_id } = validation.data;

    // Verify receipt belongs to user
    const { data: receipt } = await supabaseAdmin
      .from("receipts")
      .select("id")
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

    // Verify transaction belongs to user
    const { data: transaction } = await supabaseAdmin
      .from("transactions")
      .select("id")
      .eq("id", transaction_id)
      .eq("user_id", userId)
      .single();

    if (!transaction) {
      return createErrorResponse(
        "NOT_FOUND",
        "Transaction not found or access denied",
        404
      );
    }

    // Create link in junction table
    const { error: linkError } = await supabaseAdmin
      .from("transaction_receipts")
      .insert({
        transaction_id,
        receipt_id: id,
      });

    if (linkError) {
      // Check if link already exists
      if (linkError.code === "23505") {
        return createErrorResponse(
          "DUPLICATE_LINK",
          "Receipt is already linked to this transaction",
          409
        );
      }
      console.error("Database error:", linkError);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to link receipt",
        500,
        linkError
      );
    }

    // Also update the receipt's transaction_id for backward compatibility
    await supabaseAdmin
      .from("receipts")
      .update({ transaction_id })
      .eq("id", id);

    return createSuccessResponse({
      receipt_id: id,
      transaction_id,
      linked: true,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error linking receipt:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}
