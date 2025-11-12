import { plaidClient } from "./plaid-client";
import { supabaseAdmin } from "./supabase";

interface SyncResult {
  success: boolean;
  added: number;
  modified: number;
  removed: number;
  has_more: boolean;
  error?: string;
}

/**
 * Sync transactions from Plaid for a specific bank connection
 * This function can be called both during initial connection and for subsequent syncs
 */
export async function syncTransactionsFromPlaid(
  connectionId: string,
  userId: string
): Promise<SyncResult> {
  try {
    // Get bank connection
    const { data: connection, error: connError } = await supabaseAdmin
      .from("bank_connections")
      .select("*")
      .eq("id", connectionId)
      .eq("user_id", userId)
      .single();

    if (connError || !connection) {
      return {
        success: false,
        added: 0,
        modified: 0,
        removed: 0,
        has_more: false,
        error: "Bank connection not found",
      };
    }

    // Update status to syncing
    await supabaseAdmin
      .from("bank_connections")
      .update({ status: "syncing" })
      .eq("id", connectionId);

    // Sync transactions from Plaid
    const syncResponse = await plaidClient.transactionsSync({
      access_token: connection.plaid_access_token,
      cursor: connection.cursor || undefined,
    });

    // Filter transactions for this account
    const relevantTransactions = syncResponse.data.added.filter(
      (txn) => txn.account_id === connection.plaid_account_id
    );

    // Insert new transactions with duplicate checking
    let insertedCount = 0;
    for (const txn of relevantTransactions) {
      // Check if transaction already exists by plaid_transaction_id
      const { data: existingById } = await supabaseAdmin
        .from("transactions")
        .select("id")
        .eq("plaid_transaction_id", txn.transaction_id)
        .eq("user_id", userId)
        .single();

      if (existingById) {
        continue; // Skip if already exists
      }

      // Additional duplicate check: same date, amount, and description
      const { data: existingByDetails } = await supabaseAdmin
        .from("transactions")
        .select("id")
        .eq("user_id", userId)
        .eq("date", txn.date)
        .eq("amount", txn.amount)
        .eq("description", txn.name)
        .eq("bank_connection_id", connectionId)
        .single();

      if (existingByDetails) {
        // Update the existing transaction with plaid_transaction_id if missing
        await supabaseAdmin
          .from("transactions")
          .update({
            plaid_transaction_id: txn.transaction_id,
            plaid_account_id: txn.account_id,
          })
          .eq("id", existingByDetails.id);
        continue;
      }

      // Insert new transaction
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
          bank_connection_id: connectionId,
          status: "pending",
        });

      if (!insertError) {
        insertedCount++;
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
    for (const removed of syncResponse.data.removed) {
      // Soft delete by removing the transaction
      const { error: deleteError } = await supabaseAdmin
        .from("transactions")
        .delete()
        .eq("plaid_transaction_id", removed.transaction_id)
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
      .eq("id", connectionId);

    return {
      success: true,
      added: insertedCount,
      modified: modifiedCount,
      removed: removedCount,
      has_more: syncResponse.data.has_more,
    };
  } catch (error: any) {
    console.error("Plaid sync error:", error);

    // Update connection with error status
    await supabaseAdmin
      .from("bank_connections")
      .update({
        status: "error",
        error_code: error.error_code || "UNKNOWN",
        error_message: error.error_message || error.message,
      })
      .eq("id", connectionId);

    return {
      success: false,
      added: 0,
      modified: 0,
      removed: 0,
      has_more: false,
      error: error.message,
    };
  }
}
