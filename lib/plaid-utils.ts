import { PlaidTransactionData, Transaction, TransactionInput } from "./types";

/**
 * Maps Plaid transaction data to our app's Transaction model
 */
export function mapPlaidTransactionToTransaction(
  plaidTransaction: PlaidTransactionData,
  bankConnectionId: string,
  defaultCategory: string = "Other"
): TransactionInput {
  // Plaid amounts are positive for money out, negative for money in
  // We'll store all amounts as positive and use category to determine type
  const amount = Math.abs(plaidTransaction.amount);

  // Map Plaid categories to our app's categories
  const category = mapPlaidCategoryToAppCategory(
    plaidTransaction.category,
    defaultCategory
  );

  // Create transaction input
  const transaction: TransactionInput = {
    date: new Date(plaidTransaction.date),
    amount,
    description: plaidTransaction.name,
    merchant: plaidTransaction.merchant_name || plaidTransaction.name,
    category,
    tags: [
      "bank-import",
      plaidTransaction.pending ? "pending" : "completed",
      plaidTransaction.payment_channel,
    ].filter(Boolean),
    receiptIds: [],
    notes: `Imported from bank account. Transaction ID: ${plaidTransaction.transaction_id}`,
    isDeductible: false, // User can manually mark as deductible
    status: plaidTransaction.pending ? "pending" : "categorized",
  };

  return transaction;
}

/**
 * Maps Plaid category array to our app's category name
 */
function mapPlaidCategoryToAppCategory(
  plaidCategories?: string[],
  defaultCategory: string = "Other"
): string {
  if (!plaidCategories || plaidCategories.length === 0) {
    return defaultCategory;
  }

  const primaryCategory = plaidCategories[0].toLowerCase();

  // Map common Plaid categories to our app categories
  const categoryMap: Record<string, string> = {
    // Office & Supplies
    "shops": "Office Supplies",
    "shopping": "Office Supplies",
    "computers and electronics": "Office Supplies",

    // Travel
    "travel": "Travel",
    "airlines and aviation services": "Travel",
    "car service": "Travel",
    "taxi": "Travel",
    "lodging": "Travel",

    // Meals & Entertainment
    "food and drink": "Meals & Entertainment",
    "restaurants": "Meals & Entertainment",
    "bar": "Meals & Entertainment",
    "coffee shop": "Meals & Entertainment",

    // Software & Subscriptions
    "service": "Software & Subscriptions",
    "subscription": "Software & Subscriptions",

    // Marketing
    "advertising": "Marketing",
    "marketing": "Marketing",

    // Equipment
    "automotive": "Equipment",
    "home improvement": "Equipment",

    // Professional Services
    "professional services": "Professional Services",
    "legal": "Professional Services",
    "accounting": "Professional Services",
    "consulting": "Professional Services",
  };

  // Check if any Plaid category matches our mapping
  for (const plaidCat of plaidCategories) {
    const normalizedCat = plaidCat.toLowerCase();
    for (const [key, value] of Object.entries(categoryMap)) {
      if (normalizedCat.includes(key)) {
        return value;
      }
    }
  }

  return defaultCategory;
}

/**
 * Batch maps multiple Plaid transactions
 */
export function mapPlaidTransactions(
  plaidTransactions: PlaidTransactionData[],
  bankConnectionId: string,
  defaultCategory: string = "Other"
): TransactionInput[] {
  return plaidTransactions.map((txn) =>
    mapPlaidTransactionToTransaction(txn, bankConnectionId, defaultCategory)
  );
}

/**
 * Filters out duplicate transactions based on transaction_id
 */
export function filterDuplicateTransactions(
  existingTransactions: Transaction[],
  newTransactions: TransactionInput[]
): TransactionInput[] {
  // Extract transaction IDs from notes field
  const existingIds = new Set(
    existingTransactions
      .map((txn) => {
        const match = txn.notes?.match(/Transaction ID: (.+)/);
        return match ? match[1] : null;
      })
      .filter(Boolean)
  );

  // Filter out duplicates
  return newTransactions.filter((txn) => {
    const match = txn.notes?.match(/Transaction ID: (.+)/);
    const txnId = match ? match[1] : null;
    return txnId ? !existingIds.has(txnId) : true;
  });
}
