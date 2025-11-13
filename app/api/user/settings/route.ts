import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
  ensureUserExists,
} from "@/lib/api-helpers";
import { updateUserSettingsSchema } from "@/lib/validations/user";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/user/settings
 * Get user settings
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return createErrorResponse("UNAUTHORIZED", "User not found", 401);
    }

    // Ensure user exists in database
    await ensureUserExists(userId, user.email || "", supabaseAdmin);

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to fetch user settings",
        500,
        error
      );
    }

    return createSuccessResponse(data);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error fetching user settings:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}

/**
 * PATCH /api/user/settings
 * Update user settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const body = await request.json();
    const validation = updateUserSettingsSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid settings data",
        400,
        validation.error.errors
      );
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .update(validation.data)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to update user settings",
        500,
        error
      );
    }

    return createSuccessResponse(data);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error updating user settings:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}
