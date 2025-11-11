import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api-helpers";
import {
  bulkCreateTransactionsSchema,
  bulkUpdateTransactionsSchema,
  bulkDeleteTransactionsSchema,
} from "@/lib/validations/transaction";

/**
 * POST /api/transactions/bulk
 * Bulk create transactions
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const body = await request.json();
    const validation = bulkCreateTransactionsSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid transaction data",
        400,
        validation.error.errors
      );
    }

    const transactionsData = validation.data.transactions.map((t) => ({
      ...t,
      user_id: userId,
    }));

    const { data, error } = await supabaseAdmin
      .from("transactions")
      .insert(transactionsData)
      .select("*, categories(id, name, color, icon)");

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to create transactions",
        500,
        error
      );
    }

    return createSuccessResponse(
      {
        transactions: data,
        count: data.length,
      },
      201
    );
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error creating transactions:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}

/**
 * PATCH /api/transactions/bulk
 * Bulk update transactions
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const body = await request.json();
    const validation = bulkUpdateTransactionsSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid update data",
        400,
        validation.error.errors
      );
    }

    const { transaction_ids, updates } = validation.data;

    const { data, error } = await supabaseAdmin
      .from("transactions")
      .update(updates)
      .in("id", transaction_ids)
      .eq("user_id", userId)
      .select("*, categories(id, name, color, icon)");

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to update transactions",
        500,
        error
      );
    }

    return createSuccessResponse({
      transactions: data,
      count: data.length,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error updating transactions:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}

/**
 * DELETE /api/transactions/bulk
 * Bulk delete transactions
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const body = await request.json();
    const validation = bulkDeleteTransactionsSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid delete data",
        400,
        validation.error.errors
      );
    }

    const { transaction_ids } = validation.data;

    const { data, error } = await supabaseAdmin
      .from("transactions")
      .delete()
      .in("id", transaction_ids)
      .eq("user_id", userId)
      .select("id");

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to delete transactions",
        500,
        error
      );
    }

    return createSuccessResponse({
      deleted_ids: data.map((t) => t.id),
      count: data.length,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error deleting transactions:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}
