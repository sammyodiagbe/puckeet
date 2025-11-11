import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api-helpers";
import { updateTransactionSchema } from "@/lib/validations/transaction";

/**
 * GET /api/transactions/[id]
 * Get a single transaction by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from("transactions")
      .select("*, categories(id, name, color, icon)")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return createErrorResponse("NOT_FOUND", "Transaction not found", 404);
    }

    return createSuccessResponse(data);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error fetching transaction:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}

/**
 * PATCH /api/transactions/[id]
 * Update a transaction
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);
    const { id } = await params;

    const body = await request.json();
    const validation = updateTransactionSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid transaction data",
        400,
        validation.error.errors
      );
    }

    // First check if transaction exists and belongs to user
    const { data: existing } = await supabaseAdmin
      .from("transactions")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (!existing) {
      return createErrorResponse(
        "NOT_FOUND",
        "Transaction not found or access denied",
        404
      );
    }

    // Update the transaction
    const { data, error } = await supabaseAdmin
      .from("transactions")
      .update(validation.data)
      .eq("id", id)
      .eq("user_id", userId)
      .select("*, categories(id, name, color, icon)")
      .single();

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to update transaction",
        500,
        error
      );
    }

    return createSuccessResponse(data);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error updating transaction:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}

/**
 * DELETE /api/transactions/[id]
 * Delete a transaction
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select("id")
      .single();

    if (error || !data) {
      return createErrorResponse(
        "NOT_FOUND",
        "Transaction not found or access denied",
        404
      );
    }

    return createSuccessResponse({ id: data.id, deleted: true });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error deleting transaction:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}
