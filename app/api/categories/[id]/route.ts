import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api-helpers";
import { updateCategorySchema } from "@/lib/validations/category";

/**
 * PATCH /api/categories/[id]
 * Update a custom category (cannot update default categories)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);
    const { id } = await params;

    const body = await request.json();
    const validation = updateCategorySchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid category data",
        400,
        validation.error.errors
      );
    }

    // Check if category exists, belongs to user, and is not a default category
    const { data: existing } = await supabaseAdmin
      .from("categories")
      .select("id, is_default")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (!existing) {
      return createErrorResponse(
        "NOT_FOUND",
        "Category not found or access denied",
        404
      );
    }

    if (existing.is_default) {
      return createErrorResponse(
        "FORBIDDEN",
        "Cannot modify default categories",
        403
      );
    }

    // Update the category
    const { data, error } = await supabaseAdmin
      .from("categories")
      .update(validation.data)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to update category",
        500,
        error
      );
    }

    return createSuccessResponse(data);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error updating category:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}

/**
 * DELETE /api/categories/[id]
 * Delete a custom category (cannot delete default categories)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);
    const { id } = await params;

    // Check if category exists, belongs to user, and is not a default category
    const { data: existing } = await supabaseAdmin
      .from("categories")
      .select("id, is_default")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (!existing) {
      return createErrorResponse(
        "NOT_FOUND",
        "Category not found or access denied",
        404
      );
    }

    if (existing.is_default) {
      return createErrorResponse(
        "FORBIDDEN",
        "Cannot delete default categories",
        403
      );
    }

    // Check if category is being used by any transactions
    const { count } = await supabaseAdmin
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id)
      .eq("user_id", userId);

    if (count && count > 0) {
      return createErrorResponse(
        "CATEGORY_IN_USE",
        `Cannot delete category that is assigned to ${count} transaction(s). Please reassign those transactions first.`,
        409
      );
    }

    const { error } = await supabaseAdmin
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to delete category",
        500,
        error
      );
    }

    return createSuccessResponse({ id, deleted: true });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error deleting category:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}
