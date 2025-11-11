import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api-helpers";
import { bulkCategorizeTransactionsSchema } from "@/lib/validations/transaction";

/**
 * PATCH /api/transactions/bulk/categorize
 * Bulk categorize transactions
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const body = await request.json();
    const validation = bulkCategorizeTransactionsSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid categorization data",
        400,
        validation.error.errors
      );
    }

    const { transaction_ids, category_id } = validation.data;

    // Verify category exists and user has access to it
    const { data: category } = await supabaseAdmin
      .from("categories")
      .select("id")
      .eq("id", category_id)
      .or(`user_id.eq.${userId},is_default.eq.true`)
      .single();

    if (!category) {
      return createErrorResponse(
        "NOT_FOUND",
        "Category not found or access denied",
        404
      );
    }

    // Update transactions
    const { data, error } = await supabaseAdmin
      .from("transactions")
      .update({
        category_id,
        status: "categorized",
      })
      .in("id", transaction_ids)
      .eq("user_id", userId)
      .select("*, categories(id, name, color, icon)");

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to categorize transactions",
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
    console.error("Error categorizing transactions:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}
