import { NextRequest, NextResponse } from "next/server";
import { plaidClient, isPlaidConfigured } from "@/lib/plaid-client";
import { PlaidTransactionData } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
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
    const { accessToken, cursor, accountId } = body;

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

    return NextResponse.json({
      success: true,
      transactions: mappedTransactions,
      cursor: syncResponse.data.next_cursor,
      hasMore: syncResponse.data.has_more,
      added: syncResponse.data.added.length,
      modified: syncResponse.data.modified.length,
      removed: syncResponse.data.removed.length,
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
