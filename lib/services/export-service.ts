import { format } from "date-fns";

// Type definitions for export
export interface ExportTransaction {
  id: string;
  date: Date;
  craLineNumber: string;
  craCategory: string;
  merchant: string;
  description: string;
  amount: number;
  gstHst: number;
  totalAmount: number;
  isDeductible: boolean;
  deductiblePercentage: number;
  deductibleAmount: number;
  hasReceipt: boolean;
  receiptFilename?: string;
  notes?: string;
  paymentMethod?: string;
  tags?: string[];
}

export interface CategorySummary {
  craLineNumber: string;
  craCategory: string;
  transactionCount: number;
  totalAmount: number;
  gstHstTotal: number;
  deductibleAmount: number;
  receiptCount: number;
  notes?: string;
}

export interface ExportOptions {
  taxYear: number;
  startDate?: string;
  endDate?: string;
  includeNonDeductible?: boolean;
  requireReceipts?: boolean;
  applyMealsDeduction?: boolean;
  includeGSTBreakdown?: boolean;
}

export interface ExportSummary {
  totalTransactions: number;
  totalAmount: number;
  totalGstHst: number;
  deductibleAmount: number;
  nonDeductibleAmount: number;
  categoryBreakdown: CategorySummary[];
  warnings: string[];
}

/**
 * Escape CSV special characters
 */
function escapeCSV(value: string | null | undefined): string {
  if (!value) return "";
  const stringValue = String(value);
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Generate detailed CSV export with all transaction data
 */
export function generateDetailedCSV(
  transactions: ExportTransaction[]
): string {
  const headers = [
    "transaction_id",
    "date",
    "cra_line_number",
    "cra_category",
    "merchant",
    "description",
    "amount",
    "gst_hst",
    "total_amount",
    "is_deductible",
    "deductible_percentage",
    "deductible_amount",
    "has_receipt",
    "receipt_filename",
    "notes",
    "payment_method",
    "tags",
  ];

  const rows = transactions.map((tx) => [
    tx.id,
    format(tx.date, "yyyy-MM-dd"),
    tx.craLineNumber,
    escapeCSV(tx.craCategory),
    escapeCSV(tx.merchant),
    escapeCSV(tx.description),
    tx.amount.toFixed(2),
    tx.gstHst.toFixed(2),
    tx.totalAmount.toFixed(2),
    tx.isDeductible ? "TRUE" : "FALSE",
    tx.deductiblePercentage.toString(),
    tx.deductibleAmount.toFixed(2),
    tx.hasReceipt ? "TRUE" : "FALSE",
    escapeCSV(tx.receiptFilename || ""),
    escapeCSV(tx.notes || ""),
    escapeCSV(tx.paymentMethod || ""),
    escapeCSV(tx.tags?.join("|") || ""),
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

/**
 * Generate summary CSV export grouped by CRA category
 */
export function generateSummaryCSV(summary: CategorySummary[]): string {
  const headers = [
    "cra_line_number",
    "cra_category",
    "transaction_count",
    "total_amount",
    "gst_hst_total",
    "deductible_amount",
    "receipt_count",
    "notes",
  ];

  const rows = summary.map((cat) => [
    cat.craLineNumber,
    escapeCSV(cat.craCategory),
    cat.transactionCount.toString(),
    cat.totalAmount.toFixed(2),
    cat.gstHstTotal.toFixed(2),
    cat.deductibleAmount.toFixed(2),
    cat.receiptCount.toString(),
    escapeCSV(cat.notes || ""),
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

/**
 * Calculate category summaries from transactions
 */
export function calculateCategorySummary(
  transactions: ExportTransaction[]
): CategorySummary[] {
  // Group transactions by CRA category
  const categoryMap = new Map<string, ExportTransaction[]>();

  transactions.forEach((tx) => {
    const key = `${tx.craLineNumber}|${tx.craCategory}`;
    if (!categoryMap.has(key)) {
      categoryMap.set(key, []);
    }
    categoryMap.get(key)!.push(tx);
  });

  // Calculate summaries for each category
  const summaries: CategorySummary[] = [];

  categoryMap.forEach((txs, key) => {
    const [lineNumber, categoryName] = key.split("|");

    const summary: CategorySummary = {
      craLineNumber: lineNumber,
      craCategory: categoryName,
      transactionCount: txs.length,
      totalAmount: txs.reduce((sum, tx) => sum + tx.amount, 0),
      gstHstTotal: txs.reduce((sum, tx) => sum + tx.gstHst, 0),
      deductibleAmount: txs.reduce((sum, tx) => sum + tx.deductibleAmount, 0),
      receiptCount: txs.filter((tx) => tx.hasReceipt).length,
    };

    summaries.push(summary);
  });

  // Sort by CRA line number
  return summaries.sort((a, b) =>
    a.craLineNumber.localeCompare(b.craLineNumber)
  );
}

/**
 * Generate export summary statistics
 */
export function generateExportSummary(
  transactions: ExportTransaction[]
): ExportSummary {
  const warnings: string[] = [];

  // Calculate totals
  const totalAmount = transactions.reduce((sum, tx) => sum + tx.totalAmount, 0);
  const totalGstHst = transactions.reduce((sum, tx) => sum + tx.gstHst, 0);
  const deductibleAmount = transactions.reduce(
    (sum, tx) => sum + tx.deductibleAmount,
    0
  );
  const nonDeductibleAmount = transactions
    .filter((tx) => !tx.isDeductible)
    .reduce((sum, tx) => sum + tx.totalAmount, 0);

  // Check for missing receipts
  const missingReceipts = transactions.filter((tx) => !tx.hasReceipt);
  if (missingReceipts.length > 0) {
    warnings.push(
      `${missingReceipts.length} transaction(s) missing receipt attachments`
    );
  }

  // Check for transactions without merchant
  const missingMerchant = transactions.filter(
    (tx) => !tx.merchant || tx.merchant.trim() === ""
  );
  if (missingMerchant.length > 0) {
    warnings.push(
      `${missingMerchant.length} transaction(s) missing merchant information`
    );
  }

  // Check for uncategorized transactions
  const uncategorized = transactions.filter(
    (tx) => tx.craLineNumber === "9270" && tx.craCategory === "Other Expenses"
  );
  if (uncategorized.length > 0) {
    warnings.push(
      `${uncategorized.length} transaction(s) categorized as "Other Expenses" - consider specific categorization`
    );
  }

  return {
    totalTransactions: transactions.length,
    totalAmount,
    totalGstHst,
    deductibleAmount,
    nonDeductibleAmount,
    categoryBreakdown: calculateCategorySummary(transactions),
    warnings,
  };
}

/**
 * Validate export options
 */
export function validateExportOptions(
  options: ExportOptions
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate tax year
  const currentYear = new Date().getFullYear();
  if (options.taxYear < 2000 || options.taxYear > currentYear + 1) {
    errors.push(`Invalid tax year: ${options.taxYear}`);
  }

  // Validate date range if provided
  if (options.startDate && options.endDate) {
    const start = new Date(options.startDate);
    const end = new Date(options.endDate);

    if (isNaN(start.getTime())) {
      errors.push(`Invalid start date: ${options.startDate}`);
    }

    if (isNaN(end.getTime())) {
      errors.push(`Invalid end date: ${options.endDate}`);
    }

    if (start > end) {
      errors.push("Start date must be before end date");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate file name for export
 */
export function generateExportFileName(
  options: ExportOptions,
  format: "csv" | "csv-summary" | "xlsx" | "pdf"
): string {
  const timestamp = format === "csv" || format === "csv-summary"
    ? ""
    : `_${Date.now()}`;

  switch (format) {
    case "csv":
      return `expenses_export_${options.taxYear}${timestamp}.csv`;
    case "csv-summary":
      return `expenses_summary_${options.taxYear}${timestamp}.csv`;
    case "xlsx":
      return `expenses_export_${options.taxYear}${timestamp}.xlsx`;
    case "pdf":
      return `expenses_report_${options.taxYear}${timestamp}.pdf`;
    default:
      return `expenses_export_${options.taxYear}${timestamp}.csv`;
  }
}
