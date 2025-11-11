import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api-helpers";
import { updateRuleSchema } from "@/lib/validations/rule";

/**
 * PATCH /api/rules/[id]
 * Update an auto-categorization rule
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);
    const { id } = await params;

    const body = await request.json();
    const validation = updateRuleSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid rule data",
        400,
        validation.error.errors
      );
    }

    // Check if rule exists and belongs to user
    const { data: existing } = await supabaseAdmin
      .from("auto_categorize_rules")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (!existing) {
      return createErrorResponse(
        "NOT_FOUND",
        "Rule not found or access denied",
        404
      );
    }

    // If category_id is being updated, verify it exists
    if (validation.data.category_id) {
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
    }

    // If pattern is being updated, validate regex
    if (validation.data.pattern) {
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
    }

    // Update the rule
    const { data, error } = await supabaseAdmin
      .from("auto_categorize_rules")
      .update(validation.data)
      .eq("id", id)
      .eq("user_id", userId)
      .select("*, categories(id, name, color, icon)")
      .single();

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to update rule",
        500,
        error
      );
    }

    return createSuccessResponse(data);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error updating rule:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}

/**
 * DELETE /api/rules/[id]
 * Delete an auto-categorization rule
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from("auto_categorize_rules")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select("id")
      .single();

    if (error || !data) {
      return createErrorResponse(
        "NOT_FOUND",
        "Rule not found or access denied",
        404
      );
    }

    return createSuccessResponse({ id: data.id, deleted: true });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error deleting rule:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}
