import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api-helpers";
import { applyRulesSchema } from "@/lib/validations/rule";

/**
 * POST /api/rules/apply
 * Apply auto-categorization rules to transactions
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const body = await request.json();
    const validation = applyRulesSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid request data",
        400,
        validation.error.errors
      );
    }

    const { transaction_ids } = validation.data;

    // Get all enabled rules for the user, ordered by priority
    const { data: rules, error: rulesError } = await supabaseAdmin
      .from("auto_categorize_rules")
      .select("*")
      .eq("user_id", userId)
      .eq("enabled", true)
      .order("priority", { ascending: false });

    if (rulesError) {
      console.error("Database error:", rulesError);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to fetch rules",
        500,
        rulesError
      );
    }

    if (!rules || rules.length === 0) {
      return createSuccessResponse({
        message: "No enabled rules found",
        categorized_count: 0,
      });
    }

    // Get transactions to categorize
    let transactionsQuery = supabaseAdmin
      .from("transactions")
      .select("id, description, merchant")
      .eq("user_id", userId);

    if (transaction_ids && transaction_ids.length > 0) {
      transactionsQuery = transactionsQuery.in("id", transaction_ids);
    } else {
      // Only apply to uncategorized transactions
      transactionsQuery = transactionsQuery.is("category_id", null);
    }

    const { data: transactions, error: transactionsError } = await transactionsQuery;

    if (transactionsError) {
      console.error("Database error:", transactionsError);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to fetch transactions",
        500,
        transactionsError
      );
    }

    if (!transactions || transactions.length === 0) {
      return createSuccessResponse({
        message: "No transactions to categorize",
        categorized_count: 0,
      });
    }

    // Apply rules to transactions
    const updates: { transaction_id: string; category_id: string; rule_name: string }[] = [];

    for (const transaction of transactions) {
      const searchText = `${transaction.description} ${transaction.merchant || ""}`.toLowerCase();

      // Find first matching rule (highest priority)
      for (const rule of rules) {
        try {
          const regex = new RegExp(rule.pattern, "i");
          if (regex.test(searchText)) {
            updates.push({
              transaction_id: transaction.id,
              category_id: rule.category_id,
              rule_name: rule.name,
            });
            break; // Stop at first match
          }
        } catch (e) {
          console.warn(`Invalid regex pattern in rule ${rule.id}:`, e);
        }
      }
    }

    // Apply updates
    let categorizedCount = 0;
    for (const update of updates) {
      const { error: updateError } = await supabaseAdmin
        .from("transactions")
        .update({
          category_id: update.category_id,
          status: "categorized",
        })
        .eq("id", update.transaction_id)
        .eq("user_id", userId);

      if (!updateError) {
        categorizedCount++;
      }
    }

    return createSuccessResponse({
      categorized_count: categorizedCount,
      total_processed: transactions.length,
      details: updates,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error applying rules:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}
