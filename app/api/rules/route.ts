import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api-helpers";
import { createRuleSchema } from "@/lib/validations/rule";

/**
 * GET /api/rules
 * Get all auto-categorization rules for the user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const { data, error } = await supabaseAdmin
      .from("auto_categorize_rules")
      .select("*, categories(id, name, color, icon)")
      .eq("user_id", userId)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to fetch rules",
        500,
        error
      );
    }

    return createSuccessResponse({
      rules: data,
      count: data.length,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error fetching rules:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}

/**
 * POST /api/rules
 * Create a new auto-categorization rule
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const body = await request.json();
    const validation = createRuleSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid rule data",
        400,
        validation.error.errors
      );
    }

    // Verify category exists and user has access to it
    const { data: category } = await supabaseAdmin
      .from("categories")
      .select("id")
      .eq("id", validation.data.category_id)
      .or(`user_id.eq.${userId},is_default.eq.true`)
      .single();

    if (!category) {
      return createErrorResponse(
        "NOT_FOUND",
        "Category not found or access denied",
        404
      );
    }

    // Validate regex pattern
    try {
      new RegExp(validation.data.pattern);
    } catch (e) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid regex pattern",
        400,
        { pattern: validation.data.pattern }
      );
    }

    const ruleData = {
      ...validation.data,
      user_id: userId,
    };

    const { data, error } = await supabaseAdmin
      .from("auto_categorize_rules")
      .insert(ruleData)
      .select("*, categories(id, name, color, icon)")
      .single();

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to create rule",
        500,
        error
      );
    }

    return createSuccessResponse(data, 201);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error creating rule:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}
