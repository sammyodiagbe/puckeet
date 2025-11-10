/**
 * Mock data generators for development and testing
 */

import {
  Transaction,
  Receipt,
  Tag,
  TransactionInput,
  ReceiptInput,
} from "./types";

// Sample data arrays
const DESCRIPTIONS = [
  "Office supplies from Staples",
  "Laptop charger replacement",
  "Coffee with client",
  "Team lunch at restaurant",
  "Software subscription renewal",
  "Domain registration",
  "AWS hosting services",
  "Business cards printing",
  "Conference ticket",
  "Hotel accommodation",
  "Taxi to airport",
  "Internet service",
  "Phone bill",
  "Printer ink cartridges",
  "Desk chair",
  "Monitor stand",
  "Webcam for meetings",
  "Marketing campaign",
  "Social media ads",
  "Freelance design work",
  "Legal consultation",
  "Accounting services",
  "Cloud storage subscription",
  "Project management tool",
  "Email marketing service",
  "Stock photos license",
  "Video editing software",
  "Coworking space membership",
  "Parking fees",
  "Train ticket",
];

const MERCHANTS = [
  "Staples",
  "Amazon",
  "Best Buy",
  "Starbucks",
  "The Local Cafe",
  "Restaurant XYZ",
  "Uber",
  "Lyft",
  "AWS",
  "Google Cloud",
  "Microsoft",
  "Adobe",
  "Canva",
  "Vistaprint",
  "FedEx",
  "UPS",
  "WeWork",
  "Regus",
  "Marriott",
  "Hilton",
  "Delta Airlines",
  "United Airlines",
  "AT&T",
  "Verizon",
  "Comcast",
  "Zoom",
  "Slack",
  "Dropbox",
  "GitHub",
  "Stripe",
];

const TAG_NAMES = [
  "urgent",
  "recurring",
  "client-billable",
  "tax-prep",
  "q1-2024",
  "q2-2024",
  "project-alpha",
  "project-beta",
  "remote-work",
  "office",
  "travel",
  "equipment",
  "training",
  "marketing",
  "operations",
];

const TAG_COLORS = [
  "#EF4444",
  "#F97316",
  "#F59E0B",
  "#84CC16",
  "#10B981",
  "#14B8A6",
  "#06B6D4",
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#A855F7",
  "#D946EF",
  "#EC4899",
  "#F43F5E",
];

const CATEGORY_IDS = [
  "office-supplies",
  "travel",
  "meals-entertainment",
  "software-subscriptions",
  "marketing",
  "equipment",
  "professional-services",
  "other",
];

/**
 * Generate a random date within the last N days
 */
function randomDate(daysBack: number = 90): Date {
  const now = new Date();
  const past = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  const randomTime =
    past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(randomTime);
}

/**
 * Generate a random amount between min and max
 */
function randomAmount(min: number = 10, max: number = 500): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

/**
 * Get random items from an array
 */
function randomItems<T>(array: T[], count: number = 1): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Get random item from an array
 */
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate a single mock transaction
 */
export function generateMockTransaction(
  options: {
    categoryId?: string;
    hasReceipt?: boolean;
    isDeductible?: boolean;
  } = {}
): TransactionInput {
  const date = randomDate(90);
  const description = randomItem(DESCRIPTIONS);
  const merchant = randomItem(MERCHANTS);
  const category = options.categoryId || randomItem(CATEGORY_IDS);
  const tags =
    Math.random() > 0.5
      ? randomItems(TAG_NAMES, 1 + Math.floor(Math.random() * 2))
      : [];
  const amount = randomAmount(10, 500);
  const isDeductible = options.isDeductible ?? Math.random() > 0.3;
  const statuses: Array<"pending" | "categorized" | "reviewed"> = [
    "pending",
    "categorized",
    "reviewed",
  ];
  const status = randomItem(statuses);

  return {
    date,
    amount,
    description,
    merchant,
    category,
    tags,
    receiptIds: [],
    isDeductible,
    status,
    notes: Math.random() > 0.7 ? "Generated mock transaction" : undefined,
  };
}

/**
 * Generate multiple mock transactions
 */
export function generateMockTransactions(
  count: number = 50
): TransactionInput[] {
  return Array.from({ length: count }, () => generateMockTransaction());
}

/**
 * Generate a single mock receipt
 */
export function generateMockReceipt(transactionId?: string): ReceiptInput {
  const uploadDate = randomDate(90);
  const fileTypes = ["image/jpeg", "image/png", "application/pdf"];
  const fileType = randomItem(fileTypes);
  const extension = fileType.split("/")[1];
  const fileName = `receipt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${extension}`;

  return {
    transactionId,
    imageUrl: `data:${fileType};base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`, // 1x1 transparent pixel
    fileName,
    uploadDate,
    fileSize: Math.floor(Math.random() * 500000) + 50000, // 50KB - 550KB
    fileType,
    notes: Math.random() > 0.8 ? "Mock receipt for testing" : undefined,
  };
}

/**
 * Generate multiple mock receipts
 */
export function generateMockReceipts(count: number = 20): ReceiptInput[] {
  return Array.from({ length: count }, () => generateMockReceipt());
}

/**
 * Generate mock tags
 */
export function generateMockTags(): Tag[] {
  const now = new Date();
  return TAG_NAMES.map((name, index) => ({
    id: crypto.randomUUID(),
    name,
    color: TAG_COLORS[index % TAG_COLORS.length],
    usageCount: Math.floor(Math.random() * 20),
    createdAt: now,
    updatedAt: now,
  }));
}

/**
 * Generate a complete dataset for development
 */
export function generateMockDataset(
  options: {
    transactionCount?: number;
    receiptCount?: number;
    linkReceiptsToTransactions?: boolean;
  } = {}
) {
  const {
    transactionCount = 50,
    receiptCount = 20,
    linkReceiptsToTransactions = true,
  } = options;

  const transactionInputs = generateMockTransactions(transactionCount);
  const receiptInputs = generateMockReceipts(receiptCount);

  // Generate full transactions with IDs and timestamps
  const now = new Date();
  const transactions: Transaction[] = transactionInputs.map((input) => ({
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }));

  // Generate full receipts
  const receipts: Receipt[] = receiptInputs.map((input, index) => {
    let transactionId: string | undefined = undefined;

    // Link some receipts to transactions if requested
    if (
      linkReceiptsToTransactions &&
      index < transactions.length &&
      Math.random() > 0.3
    ) {
      transactionId = transactions[index].id;
      // Add receipt ID to the transaction
      const receiptId = crypto.randomUUID();
      transactions[index].receiptIds.push(receiptId);

      return {
        ...input,
        transactionId,
        id: receiptId,
        createdAt: now,
        updatedAt: now,
      };
    }

    return {
      ...input,
      transactionId,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
  });

  const tags = generateMockTags();

  return {
    transactions,
    receipts,
    tags,
  };
}

/**
 * Get statistics from mock data
 */
export function getMockDataStats(
  data: ReturnType<typeof generateMockDataset>
) {
  const { transactions, receipts } = data;

  const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0);
  const deductibleExpenses = transactions
    .filter((t) => t.isDeductible)
    .reduce((sum, t) => sum + t.amount, 0);

  const categoryBreakdown = transactions.reduce(
    (acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  const linkedReceipts = receipts.filter((r) => r.transactionId).length;
  const unlinkedReceipts = receipts.length - linkedReceipts;

  return {
    totalTransactions: transactions.length,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    deductibleExpenses: Math.round(deductibleExpenses * 100) / 100,
    totalReceipts: receipts.length,
    linkedReceipts,
    unlinkedReceipts,
    categoryBreakdown,
    statusBreakdown: {
      pending: transactions.filter((t) => t.status === "pending").length,
      categorized: transactions.filter((t) => t.status === "categorized")
        .length,
      reviewed: transactions.filter((t) => t.status === "reviewed").length,
    },
  };
}

// Static exports for backward compatibility with existing pages
const _mockDataset = generateMockDataset({ transactionCount: 20, receiptCount: 10 });

/**
 * Pre-generated mock transactions (for backward compatibility)
 * @deprecated Use generateMockTransactions() or generateMockDataset() instead
 */
export const mockTransactions: Transaction[] = _mockDataset.transactions;

/**
 * Pre-generated mock receipts (for backward compatibility)
 * @deprecated Use generateMockReceipts() or generateMockDataset() instead
 */
export const mockReceipts: Receipt[] = _mockDataset.receipts;

/**
 * Mock bank connections (for backward compatibility)
 * @deprecated This is a placeholder for future bank connection feature
 */
export const mockBankConnections: any[] = [];
