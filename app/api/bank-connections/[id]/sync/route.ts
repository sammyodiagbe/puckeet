import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isPlaidConfigured } from "@/lib/plaid-client";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api-helpers";
import { syncTransactionsFromPlaid } from "@/lib/plaid-sync";

/**
 * POST /api/bank-connections/[id]/sync
 * Sync transactions from Plaid
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isPlaidConfigured()) {
      return createErrorResponse(
        "PLAID_NOT_CONFIGURED",
        "Plaid is not configured",
        500
      );
    }

    const userId = await requireAuth(request);
    const { id } = await params;

    // Get bank connection
    const { data: connection, error: connError } = await supabaseAdmin
      .from("bank_connections")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (connError || !connection) {
      return createErrorResponse(
        "NOT_FOUND",
        "Bank connection not found or access denied",
        404
      );
    }

    if (connection.status !== "connected" && connection.status !== "syncing") {
      return createErrorResponse(
        "CONNECTION_INACTIVE",
        "Bank connection is not active",
        400
      );
    }

    // Use the centralized sync function
    const syncResult = await syncTransactionsFromPlaid(id, userId);

    if (!syncResult.success) {
      return createErrorResponse(
        "PLAID_ERROR",
        syncResult.error || "Failed to sync transactions",
        500
      );
    }

    return createSuccessResponse({
      sync_completed: true,
      added: syncResult.added,
      modified: syncResult.modified,
      removed: syncResult.removed,
      has_more: syncResult.has_more,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error syncing transactions:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}
