import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
  ensureUserExists,
} from "@/lib/api-helpers";
import { currentUser } from "@clerk/nextjs/server";

/**
 * POST /api/upload-sessions
 * Create a new upload session for QR code receipt uploads
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);
    const user = await currentUser();

    if (!user) {
      return createErrorResponse("UNAUTHORIZED", "User not found", 401);
    }

    // Ensure user exists in database
    await ensureUserExists(
      userId,
      user.emailAddresses[0]?.emailAddress || "",
      supabaseAdmin
    );

    // Generate unique session token
    const sessionToken = randomUUID();

    // Set expiry to 15 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Create session
    const { data: session, error } = await supabaseAdmin
      .from("upload_sessions")
      .insert({
        user_id: userId,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        is_active: true,
        receipt_count: 0,
        max_receipts: 10,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to create upload session",
        500,
        error
      );
    }

    // Generate upload URL
    const uploadUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/mobile-upload/${sessionToken}`;

    return createSuccessResponse(
      {
        session_id: session.id,
        session_token: sessionToken,
        upload_url: uploadUrl,
        expires_at: session.expires_at,
        expires_in_minutes: 15,
        max_receipts: session.max_receipts,
      },
      201
    );
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error creating upload session:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}

/**
 * GET /api/upload-sessions/:id/receipts
 * Get receipts uploaded during this session (for polling)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Session ID is required",
        400
      );
    }

    // Verify session belongs to user
    const { data: session } = await supabaseAdmin
      .from("upload_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (!session) {
      return createErrorResponse(
        "NOT_FOUND",
        "Session not found or access denied",
        404
      );
    }

    // Get receipts uploaded in this session
    const { data: receipts, error } = await supabaseAdmin
      .from("receipts")
      .select("*")
      .eq("upload_session_id", sessionId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to fetch receipts",
        500,
        error
      );
    }

    return createSuccessResponse({
      session_id: sessionId,
      receipt_count: session.receipt_count,
      max_receipts: session.max_receipts,
      is_active: session.is_active,
      expires_at: session.expires_at,
      receipts: receipts || [],
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error fetching session receipts:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}

/**
 * DELETE /api/upload-sessions?session_id=xxx
 * Deactivate/cancel an upload session
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Session ID is required",
        400
      );
    }

    // Verify session belongs to user
    const { data: session } = await supabaseAdmin
      .from("upload_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (!session) {
      return createErrorResponse(
        "NOT_FOUND",
        "Session not found or access denied",
        404
      );
    }

    // Deactivate session
    const { error } = await supabaseAdmin
      .from("upload_sessions")
      .update({ is_active: false })
      .eq("id", sessionId);

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to deactivate session",
        500,
        error
      );
    }

    return createSuccessResponse({
      message: "Session deactivated successfully",
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error deactivating session:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}
