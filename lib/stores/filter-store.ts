import { create } from "zustand";
import { FilterState, Transaction } from "../types";

interface FilterStore {
  filters: FilterState;

  // Filter setters
  setSearchQuery: (query: string) => void;
  setDateRange: (from: Date | null, to: Date | null) => void;
  setCategories: (categories: string[]) => void;
  setTags: (tags: string[]) => void;
  setIsDeductible: (isDeductible: boolean | null) => void;
  setHasReceipts: (hasReceipts: boolean | null) => void;
  setStatus: (status: Transaction["status"][]) => void;

  // Bulk operations
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;

  // Utility
  hasActiveFilters: () => boolean;
}

const DEFAULT_FILTERS: FilterState = {
  searchQuery: "",
  dateRange: {
    from: null,
    to: null,
  },
  categories: [],
  tags: [],
  isDeductible: null,
  hasReceipts: null,
  status: [],
};

export const useFilterStore = create<FilterStore>((set, get) => ({
  filters: DEFAULT_FILTERS,

  setSearchQuery: (query) =>
    set((state) => ({
      filters: { ...state.filters, searchQuery: query },
    })),

  setDateRange: (from, to) =>
    set((state) => ({
      filters: {
        ...state.filters,
        dateRange: { from, to },
      },
    })),

  setCategories: (categories) =>
    set((state) => ({
      filters: { ...state.filters, categories },
    })),

  setTags: (tags) =>
    set((state) => ({
      filters: { ...state.filters, tags },
    })),

  setIsDeductible: (isDeductible) =>
    set((state) => ({
      filters: { ...state.filters, isDeductible },
    })),

  setHasReceipts: (hasReceipts) =>
    set((state) => ({
      filters: { ...state.filters, hasReceipts },
    })),

  setStatus: (status) =>
    set((state) => ({
      filters: { ...state.filters, status },
    })),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  hasActiveFilters: () => {
    const { filters } = get();
    return (
      filters.searchQuery !== "" ||
      filters.dateRange.from !== null ||
      filters.dateRange.to !== null ||
      filters.categories.length > 0 ||
      filters.tags.length > 0 ||
      filters.isDeductible !== null ||
      filters.hasReceipts !== null ||
      filters.status.length > 0
    );
  },
}));

// Helper function to apply filters to transactions
export function applyFilters(
  transactions: Transaction[],
  filters: FilterState
): Transaction[] {
  let filtered = [...transactions];

  // Search query filter
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.description.toLowerCase().includes(query) ||
        t.notes?.toLowerCase().includes(query) ||
        t.merchant?.toLowerCase().includes(query)
    );
  }

  // Date range filter
  if (filters.dateRange.from) {
    filtered = filtered.filter((t) => t.date >= filters.dateRange.from!);
  }
  if (filters.dateRange.to) {
    filtered = filtered.filter((t) => t.date <= filters.dateRange.to!);
  }

  // Category filter
  if (filters.categories.length > 0) {
    filtered = filtered.filter((t) => filters.categories.includes(t.category));
  }

  // Tags filter
  if (filters.tags.length > 0) {
    filtered = filtered.filter((t) =>
      filters.tags.some((tag) => t.tags.includes(tag))
    );
  }

  // Deductible filter
  if (filters.isDeductible !== null) {
    filtered = filtered.filter((t) => t.isDeductible === filters.isDeductible);
  }

  // Has receipts filter
  if (filters.hasReceipts !== null) {
    filtered = filtered.filter((t) =>
      filters.hasReceipts
        ? t.receiptIds.length > 0
        : t.receiptIds.length === 0
    );
  }

  // Status filter
  if (filters.status.length > 0) {
    filtered = filtered.filter((t) => filters.status.includes(t.status));
  }

  return filtered;
}
