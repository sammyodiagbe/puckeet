import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api-helpers";
import { createCategorySchema } from "@/lib/validations/category";

/**
 * GET /api/categories
 * Get all categories (default + user custom)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    // Fetch both default categories and user's custom categories
    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("*")
      .or(`user_id.eq.${userId},is_default.eq.true`)
      .order("is_default", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to fetch categories",
        500,
        error
      );
    }

    return createSuccessResponse({
      categories: data,
      default_count: data.filter((c) => c.is_default).length,
      custom_count: data.filter((c) => !c.is_default).length,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error fetching categories:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}

/**
 * POST /api/categories
 * Create a custom category
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const body = await request.json();
    const validation = createCategorySchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid category data",
        400,
        validation.error.errors
      );
    }

    // Check if category name already exists for this user
    const { data: existing } = await supabaseAdmin
      .from("categories")
      .select("id")
      .eq("user_id", userId)
      .eq("name", validation.data.name)
      .single();

    if (existing) {
      return createErrorResponse(
        "DUPLICATE_CATEGORY",
        "A category with this name already exists",
        409
      );
    }

    const categoryData = {
      ...validation.data,
      user_id: userId,
      is_default: false,
    };

    const { data, error } = await supabaseAdmin
      .from("categories")
      .insert(categoryData)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to create category",
        500,
        error
      );
    }

    return createSuccessResponse(data, 201);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error creating category:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}
