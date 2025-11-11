import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api-helpers";

/**
 * GET /api/reports/analytics
 * Get spending analytics and trends
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const from_date = searchParams.get("from_date");
    const to_date = searchParams.get("to_date");
    const groupBy = searchParams.get("group_by") || "month"; // day, week, month, year

    // Build query with date filters
    let query = supabaseAdmin
      .from("transactions")
      .select("date, amount, category_id, categories(name, color)")
      .eq("user_id", userId)
      .order("date", { ascending: true });

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
        "Failed to generate analytics",
        500,
        error
      );
    }

    // Group transactions by period
    const groupedByPeriod: Record<string, { income: number; expenses: number; net: number }> = {};

    transactions.forEach((t) => {
      const date = new Date(t.date);
      let periodKey: string;

      switch (groupBy) {
        case "day":
          periodKey = t.date;
          break;
        case "week":
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = weekStart.toISOString().split("T")[0];
          break;
        case "year":
          periodKey = date.getFullYear().toString();
          break;
        case "month":
        default:
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          break;
      }

      if (!groupedByPeriod[periodKey]) {
        groupedByPeriod[periodKey] = { income: 0, expenses: 0, net: 0 };
      }

      const amount = Number(t.amount);
      if (amount < 0) {
        groupedByPeriod[periodKey].income += Math.abs(amount);
      } else {
        groupedByPeriod[periodKey].expenses += amount;
      }
      groupedByPeriod[periodKey].net = groupedByPeriod[periodKey].income - groupedByPeriod[periodKey].expenses;
    });

    // Convert to array and sort
    const timeline = Object.entries(groupedByPeriod)
      .map(([period, data]) => ({ period, ...data }))
      .sort((a, b) => a.period.localeCompare(b.period));

    // Top spending categories
    const categoryTotals: Record<string, { name: string; color: string; total: number }> = {};

    transactions.forEach((t) => {
      if (Number(t.amount) <= 0) return; // Only expenses

      const categoryId = t.category_id || "uncategorized";
      const categoryName = t.categories?.name || "Uncategorized";
      const categoryColor = t.categories?.color || "#9CA3AF";

      if (!categoryTotals[categoryId]) {
        categoryTotals[categoryId] = {
          name: categoryName,
          color: categoryColor,
          total: 0,
        };
      }

      categoryTotals[categoryId].total += Number(t.amount);
    });

    const topCategories = Object.entries(categoryTotals)
      .map(([id, data]) => ({ category_id: id, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Calculate average daily spending
    const uniqueDays = new Set(transactions.map((t) => t.date)).size;
    const totalExpenses = transactions
      .filter((t) => Number(t.amount) > 0)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const avgDailySpending = uniqueDays > 0 ? totalExpenses / uniqueDays : 0;

    return createSuccessResponse({
      period: {
        from: from_date || "all time",
        to: to_date || "all time",
        group_by: groupBy,
      },
      timeline,
      top_categories: topCategories,
      metrics: {
        avg_daily_spending: avgDailySpending,
        total_days: uniqueDays,
        total_transactions: transactions.length,
      },
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error generating analytics:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}
