import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api-helpers";

/**
 * GET /api/user/stats
 * Get user statistics
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    // Get transaction count
    const { count: transactionCount } = await supabaseAdmin
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    // Get receipt count
    const { count: receiptCount } = await supabaseAdmin
      .from("receipts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    // Get bank connection count
    const { count: bankConnectionCount } = await supabaseAdmin
      .from("bank_connections")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "connected");

    // Get custom category count
    const { count: customCategoryCount } = await supabaseAdmin
      .from("categories")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    // Get total spending (sum of positive amounts)
    const { data: spendingData } = await supabaseAdmin
      .from("transactions")
      .select("amount")
      .eq("user_id", userId)
      .gt("amount", 0);

    const totalSpending = spendingData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    // Get deductible transaction count
    const { count: deductibleCount } = await supabaseAdmin
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_deductible", true);

    // Get uncategorized transaction count
    const { count: uncategorizedCount } = await supabaseAdmin
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("category_id", null);

    // Get unlinked receipt count
    const { count: unlinkedReceiptCount } = await supabaseAdmin
      .from("receipts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("transaction_id", null);

    return createSuccessResponse({
      transaction_count: transactionCount || 0,
      receipt_count: receiptCount || 0,
      bank_connection_count: bankConnectionCount || 0,
      custom_category_count: customCategoryCount || 0,
      total_spending: totalSpending,
      deductible_count: deductibleCount || 0,
      uncategorized_count: uncategorizedCount || 0,
      unlinked_receipt_count: unlinkedReceiptCount || 0,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error fetching user stats:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}
