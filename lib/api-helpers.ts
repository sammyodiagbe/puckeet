import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * Get the authenticated user ID from Supabase
 */
export async function getAuthUserId(request: NextRequest): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Create a standardized API error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  status: number = 500,
  details?: any
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Create a standardized API success response
 */
export function createSuccessResponse(data: any, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Verify that the user is authenticated
 */
export async function requireAuth(request: NextRequest) {
  const userId = await getAuthUserId(request);

  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }

  return userId;
}

/**
 * Ensure user exists in database, create if not
 */
export async function ensureUserExists(userId: string, email: string, supabase: any) {
  const { data: existingUser } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (!existingUser) {
    const { error } = await supabase
      .from("users")
      .insert({
        id: userId,
        email: email,
        subscription_tier: "free",
        settings: {},
      });

    if (error && error.code !== "23505") {
      // 23505 is duplicate key error, which is fine
      throw error;
    }
  }
}
