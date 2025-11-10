export interface Transaction {
  id: string;
  date: Date;
  amount: number;
  description: string;
  merchant?: string;
  category: string;
  tags: string[];
  receiptIds: string[];
  notes?: string;
  isDeductible: boolean;
  status: "pending" | "categorized" | "reviewed";
  createdAt: Date;
  updatedAt: Date;
}

export interface Receipt {
  id: string;
  transactionId?: string;
  imageUrl: string; // base64 or blob URL
  fileName: string;
  uploadDate: Date;
  notes?: string;
  fileSize: number;
  fileType: string;
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  description?: string;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutoCategorizeRule {
  id: string;
  name: string;
  pattern: string; // regex pattern
  categoryId: string;
  enabled: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  displayName: string;
  taxYearType: "calendar" | "fiscal";
  fiscalYearStartMonth?: number; // 1-12
  currency: string;
  dateFormat: string;
  defaultView: "dashboard" | "transactions" | "receipts";
  hasCompletedOnboarding: boolean;
  theme: "light" | "dark" | "system";
  createdAt: Date;
  updatedAt: Date;
}

export interface FilterState {
  searchQuery: string;
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  categories: string[];
  tags: string[];
  isDeductible: boolean | null;
  hasReceipts: boolean | null;
  status: Transaction["status"][];
}

export interface UIState {
  isAddTransactionModalOpen: boolean;
  isEditTransactionModalOpen: boolean;
  editingTransactionId: string | null;
  isUploadReceiptModalOpen: boolean;
  isSettingsOpen: boolean;
  isSidebarCollapsed: boolean;
  selectedReceiptId: string | null;
  isReceiptViewerOpen: boolean;
  activeToast: ToastMessage | null;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
  duration?: number;
}

// Utility types for API/storage operations
export type TransactionInput = Omit<
  Transaction,
  "id" | "createdAt" | "updatedAt"
>;
export type ReceiptInput = Omit<Receipt, "id" | "createdAt" | "updatedAt">;
export type CategoryInput = Omit<Category, "id" | "createdAt" | "updatedAt">;
export type TagInput = Omit<
  Tag,
  "id" | "createdAt" | "updatedAt" | "usageCount"
>;

// Export types
export type ExportFormat = "csv" | "json" | "pdf";

export interface ExportOptions {
  format: ExportFormat;
  dateRange: {
    from: Date;
    to: Date;
  };
  includeReceipts: boolean;
  includeNotes: boolean;
  onlyDeductible: boolean;
  categories?: string[];
}
