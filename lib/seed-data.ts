/**
 * Data seeding utilities for development
 * Use this to populate stores with mock data
 */

import { useTransactionStore } from "./stores/transaction-store";
import { useReceiptStore } from "./stores/receipt-store";
import { useCategoryStore } from "./stores/category-store";
import { generateMockDataset, getMockDataStats } from "./mock-data";

/**
 * Initialize default categories if they don't exist
 */
export function initializeDefaultCategories() {
  const { categories, initializeDefaultCategories } = useCategoryStore.getState();

  if (categories.length === 0) {
    initializeDefaultCategories();
    console.log("✅ Default categories initialized");
  } else {
    console.log("ℹ️  Categories already exist, skipping initialization");
  }
}

/**
 * Seed the stores with mock data
 */
export function seedMockData(options: {
  transactionCount?: number;
  receiptCount?: number;
  linkReceiptsToTransactions?: boolean;
  clearExisting?: boolean;
} = {}) {
  const {
    transactionCount = 50,
    receiptCount = 20,
    linkReceiptsToTransactions = true,
    clearExisting = false,
  } = options;

  const transactionStore = useTransactionStore.getState();
  const receiptStore = useReceiptStore.getState();
  const categoryStore = useCategoryStore.getState();

  // Clear existing data if requested
  if (clearExisting) {
    transactionStore.setTransactions([]);
    receiptStore.setReceipts([]);
    console.log("🗑️  Cleared existing data");
  }

  // Initialize default categories
  if (categoryStore.categories.length === 0) {
    categoryStore.initializeDefaultCategories();
    console.log("✅ Default categories initialized");
  }

  // Generate mock dataset
  console.log("🌱 Generating mock data...");
  const mockData = generateMockDataset({
    transactionCount,
    receiptCount,
    linkReceiptsToTransactions,
  });

  // Seed transactions
  transactionStore.setTransactions(mockData.transactions);
  console.log(`✅ Seeded ${mockData.transactions.length} transactions`);

  // Seed receipts
  receiptStore.setReceipts(mockData.receipts);
  console.log(`✅ Seeded ${mockData.receipts.length} receipts`);

  // Seed tags
  categoryStore.setTags(mockData.tags);
  console.log(`✅ Seeded ${mockData.tags.length} tags`);

  // Display statistics
  const stats = getMockDataStats(mockData);
  console.log("\n📊 Mock Data Statistics:");
  console.log(`   Total Transactions: ${stats.totalTransactions}`);
  console.log(`   Total Expenses: $${stats.totalExpenses}`);
  console.log(`   Deductible Expenses: $${stats.deductibleExpenses}`);
  console.log(`   Total Receipts: ${stats.totalReceipts}`);
  console.log(`   Linked Receipts: ${stats.linkedReceipts}`);
  console.log(`   Unlinked Receipts: ${stats.unlinkedReceipts}`);
  console.log(`   Status Breakdown:`, stats.statusBreakdown);

  return stats;
}

/**
 * Clear all data from stores
 */
export function clearAllStoreData() {
  const transactionStore = useTransactionStore.getState();
  const receiptStore = useReceiptStore.getState();
  const categoryStore = useCategoryStore.getState();

  transactionStore.setTransactions([]);
  receiptStore.setReceipts([]);
  categoryStore.setCategories([]);
  categoryStore.setTags([]);

  console.log("🗑️  All store data cleared");
}

/**
 * Check if stores have data
 */
export function hasData() {
  const transactionStore = useTransactionStore.getState();
  const receiptStore = useReceiptStore.getState();
  const categoryStore = useCategoryStore.getState();

  return {
    hasTransactions: transactionStore.transactions.length > 0,
    hasReceipts: receiptStore.receipts.length > 0,
    hasCategories: categoryStore.categories.length > 0,
    hasTags: categoryStore.tags.length > 0,
  };
}

// Make seeding functions available in browser console for development
if (typeof window !== "undefined") {
  (window as any).__puckeet = {
    seedMockData,
    clearAllStoreData,
    initializeDefaultCategories,
    hasData,
  };
}
