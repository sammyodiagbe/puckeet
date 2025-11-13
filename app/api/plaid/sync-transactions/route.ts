import { NextRequest, NextResponse } from "next/server";
import { plaidClient, isPlaidConfigured } from "@/lib/plaid-client";
import { PlaidTransactionData } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Plaid is configured
    if (!isPlaidConfigured()) {
      return NextResponse.json(
        {
          error:
            "Plaid is not configured. Please add PLAID_CLIENT_ID, PLAID_SECRET, and PLAID_ENV to your .env.local file.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { accessToken, cursor, accountId, bankConnectionId } = body;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token is required" },
        { status: 400 }
      );
    }

    // Use transactions sync endpoint for incremental updates
    const syncResponse = await plaidClient.transactionsSync({
      access_token: accessToken,
      cursor: cursor || undefined,
    });

    // Filter transactions by account if specified
    let transactions = syncResponse.data.added;
    if (accountId) {
      transactions = transactions.filter(
        (txn) => txn.account_id === accountId
      );
    }

    // Map Plaid transactions to our format
    const mappedTransactions: PlaidTransactionData[] = transactions.map(
      (txn) => ({
        transaction_id: txn.transaction_id,
        account_id: txn.account_id,
        amount: txn.amount,
        date: txn.date,
        name: txn.name,
        merchant_name: txn.merchant_name || undefined,
        category: txn.category || undefined,
        pending: txn.pending,
        payment_channel: txn.payment_channel,
      })
    );

    // Save transactions to database
    let savedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const plaidTxn of mappedTransactions) {
      try {
        // Check if transaction already exists
        const { data: existing } = await supabase
          .from("transactions")
          .select("id")
          .eq("plaid_transaction_id", plaidTxn.transaction_id)
          .eq("user_id", user.id)
          .single();

        if (existing) {
          skippedCount++;
          continue; // Skip if already exists
        }

        // Get default "Uncategorized" category
        const { data: category } = await supabase
          .from("categories")
          .select("id")
          .eq("name", "Uncategorized")
          .eq("is_default", true)
          .single();

        // Insert new transaction
        const { error: insertError } = await supabase
          .from("transactions")
          .insert({
            user_id: user.id,
            date: plaidTxn.date,
            amount: Math.abs(plaidTxn.amount), // Plaid uses negative for debits
            description: plaidTxn.name,
            merchant: plaidTxn.merchant_name || plaidTxn.name,
            category_id: category?.id || null,
            is_deductible: true, // Default to true, user can change later
            status: "pending",
            plaid_transaction_id: plaidTxn.transaction_id,
            plaid_account_id: plaidTxn.account_id,
            bank_connection_id: bankConnectionId || null,
            tags: plaidTxn.category || [],
            notes: plaidTxn.payment_channel
              ? `Imported from bank via ${plaidTxn.payment_channel}`
              : "Imported from bank",
          });

        if (insertError) {
          console.error("Error inserting transaction:", insertError);
          errors.push(`Failed to save transaction ${plaidTxn.transaction_id}`);
        } else {
          savedCount++;
        }
      } catch (err) {
        console.error("Error processing transaction:", err);
        errors.push(`Error processing transaction ${plaidTxn.transaction_id}`);
      }
    }

    // Update bank connection cursor for incremental sync
    if (bankConnectionId && syncResponse.data.next_cursor) {
      await supabase
        .from("bank_connections")
        .update({
          cursor: syncResponse.data.next_cursor,
          last_sync_date: new Date().toISOString(),
          status: "connected",
          error_code: null,
          error_message: null,
        })
        .eq("id", bankConnectionId)
        .eq("user_id", user.id);
    }

    return NextResponse.json({
      success: true,
      savedCount,
      skippedCount,
      totalFetched: mappedTransactions.length,
      cursor: syncResponse.data.next_cursor,
      hasMore: syncResponse.data.has_more,
      added: syncResponse.data.added.length,
      modified: syncResponse.data.modified.length,
      removed: syncResponse.data.removed.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Error syncing transactions:", error);
    return NextResponse.json(
      {
        error: "Failed to sync transactions",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
