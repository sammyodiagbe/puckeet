import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api-helpers";

/**
 * DELETE /api/bank-connections/[id]
 * Disconnect a bank account
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);
    const { id } = await params;

    // Check if connection exists and belongs to user
    const { data: connection } = await supabaseAdmin
      .from("bank_connections")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (!connection) {
      return createErrorResponse(
        "NOT_FOUND",
        "Bank connection not found or access denied",
        404
      );
    }

    // Update status to disconnected instead of deleting
    // This preserves transaction history
    const { error } = await supabaseAdmin
      .from("bank_connections")
      .update({
        status: "disconnected",
      })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to disconnect bank account",
        500,
        error
      );
    }

    return createSuccessResponse({
      id,
      disconnected: true,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error disconnecting bank account:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}

/**
 * PATCH /api/bank-connections/[id]
 * Update bank connection settings
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);
    const { id } = await params;

    const body = await request.json();
    const { account_name } = body;

    // Check if connection exists and belongs to user
    const { data: connection } = await supabaseAdmin
      .from("bank_connections")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (!connection) {
      return createErrorResponse(
        "NOT_FOUND",
        "Bank connection not found or access denied",
        404
      );
    }

    // Update connection
    const updates: any = {};
    if (account_name !== undefined) {
      updates.account_name = account_name;
    }

    const { data, error } = await supabaseAdmin
      .from("bank_connections")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to update bank connection",
        500,
        error
      );
    }

    return createSuccessResponse({
      ...data,
      plaid_access_token: "***",
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error updating bank connection:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}
