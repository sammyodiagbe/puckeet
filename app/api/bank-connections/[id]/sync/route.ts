import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { plaidClient, isPlaidConfigured } from "@/lib/plaid-client";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api-helpers";

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

    if (connection.status !== "connected") {
      return createErrorResponse(
        "CONNECTION_INACTIVE",
        "Bank connection is not active",
        400
      );
    }

    // Update status to syncing
    await supabaseAdmin
      .from("bank_connections")
      .update({ status: "syncing" })
      .eq("id", id);

    try {
      // Sync transactions from Plaid
      const syncResponse = await plaidClient.transactionsSync({
        access_token: connection.plaid_access_token,
        cursor: connection.cursor || undefined,
      });

      // Filter transactions for this account
      const relevantTransactions = syncResponse.data.added.filter(
        (txn) => txn.account_id === connection.plaid_account_id
      );

      // Insert new transactions
      let insertedCount = 0;
      for (const txn of relevantTransactions) {
        // Check if transaction already exists
        const { data: existing } = await supabaseAdmin
          .from("transactions")
          .select("id")
          .eq("plaid_transaction_id", txn.transaction_id)
          .single();

        if (!existing) {
          const { error: insertError } = await supabaseAdmin
            .from("transactions")
            .insert({
              user_id: userId,
              date: txn.date,
              amount: txn.amount,
              description: txn.name,
              merchant: txn.merchant_name || null,
              plaid_transaction_id: txn.transaction_id,
              plaid_account_id: txn.account_id,
              bank_connection_id: connection.id,
              status: "pending",
            });

          if (!insertError) {
            insertedCount++;
          }
        }
      }

      // Handle modified transactions
      let modifiedCount = 0;
      for (const txn of syncResponse.data.modified) {
        if (txn.account_id !== connection.plaid_account_id) continue;

        const { error: updateError } = await supabaseAdmin
          .from("transactions")
          .update({
            amount: txn.amount,
            description: txn.name,
            merchant: txn.merchant_name || null,
            date: txn.date,
          })
          .eq("plaid_transaction_id", txn.transaction_id)
          .eq("user_id", userId);

        if (!updateError) {
          modifiedCount++;
        }
      }

      // Handle removed transactions
      let removedCount = 0;
      for (const txnId of syncResponse.data.removed) {
        // Soft delete by marking as removed
        const { error: deleteError } = await supabaseAdmin
          .from("transactions")
          .delete()
          .eq("plaid_transaction_id", txnId.transaction_id)
          .eq("user_id", userId);

        if (!deleteError) {
          removedCount++;
        }
      }

      // Update connection with new cursor and last sync date
      await supabaseAdmin
        .from("bank_connections")
        .update({
          status: "connected",
          last_sync_date: new Date().toISOString(),
          cursor: syncResponse.data.next_cursor,
          error_code: null,
          error_message: null,
        })
        .eq("id", id);

      return createSuccessResponse({
        sync_completed: true,
        added: insertedCount,
        modified: modifiedCount,
        removed: removedCount,
        has_more: syncResponse.data.has_more,
      });
    } catch (plaidError: any) {
      // Update connection with error status
      await supabaseAdmin
        .from("bank_connections")
        .update({
          status: "error",
          error_code: plaidError.error_code || "UNKNOWN",
          error_message: plaidError.error_message || plaidError.message,
        })
        .eq("id", id);

      console.error("Plaid sync error:", plaidError);
      return createErrorResponse(
        "PLAID_ERROR",
        `Failed to sync transactions: ${plaidError.message}`,
        500,
        plaidError
      );
    }
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error syncing transactions:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}
