import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api-helpers";

/**
 * GET /api/reports/summary
 * Get financial summary for the user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const from_date = searchParams.get("from_date");
    const to_date = searchParams.get("to_date");

    // Build query with date filters
    let query = supabaseAdmin
      .from("transactions")
      .select("amount, is_deductible, category_id, categories(name, color)")
      .eq("user_id", userId);

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
        "Failed to generate summary",
        500,
        error
      );
    }

    // Calculate totals
    const totalIncome = transactions
      .filter((t) => Number(t.amount) < 0)
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    const totalExpenses = transactions
      .filter((t) => Number(t.amount) > 0)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const deductibleExpenses = transactions
      .filter((t) => t.is_deductible && Number(t.amount) > 0)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netIncome = totalIncome - totalExpenses;

    // Group by category
    const byCategory: Record<string, { name: string; color: string; total: number; count: number }> = {};

    transactions.forEach((t) => {
      const categoryId = t.category_id || "uncategorized";
      const categoryName = t.categories?.name || "Uncategorized";
      const categoryColor = t.categories?.color || "#9CA3AF";
      const amount = Number(t.amount);

      if (!byCategory[categoryId]) {
        byCategory[categoryId] = {
          name: categoryName,
          color: categoryColor,
          total: 0,
          count: 0,
        };
      }

      byCategory[categoryId].total += Math.abs(amount);
      byCategory[categoryId].count += 1;
    });

    // Convert to array and sort by total
    const categoryBreakdown = Object.entries(byCategory)
      .map(([id, data]) => ({ category_id: id, ...data }))
      .sort((a, b) => b.total - a.total);

    return createSuccessResponse({
      period: {
        from: from_date || "all time",
        to: to_date || "all time",
      },
      summary: {
        total_income: totalIncome,
        total_expenses: totalExpenses,
        net_income: netIncome,
        deductible_expenses: deductibleExpenses,
        transaction_count: transactions.length,
      },
      category_breakdown: categoryBreakdown,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error generating summary:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}
