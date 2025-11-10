import { create } from "zustand";
import { Transaction, TransactionInput } from "../types";
import { persist } from "../storage";

interface TransactionStore {
  transactions: Transaction[];
  isLoading: boolean;

  // CRUD operations
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: TransactionInput) => void;
  updateTransaction: (id: string, updates: Partial<TransactionInput>) => void;
  deleteTransaction: (id: string) => void;
  deleteTransactions: (ids: string[]) => void;
  getTransaction: (id: string) => Transaction | undefined;

  // Bulk operations
  bulkUpdateCategory: (ids: string[], category: string) => void;
  bulkUpdateTags: (ids: string[], tags: string[]) => void;
  bulkMarkAsDeductible: (ids: string[], isDeductible: boolean) => void;

  // Utility
  setLoading: (isLoading: boolean) => void;
}

export const useTransactionStore = create<TransactionStore>(
  persist(
    (set, get) => ({
      transactions: [],
      isLoading: false,

      setTransactions: (transactions) => set({ transactions }),

      addTransaction: (transactionInput) => {
        const now = new Date();
        const transaction: Transaction = {
          ...transactionInput,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          transactions: [...state.transactions, transaction],
        }));
      },

      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
          ),
        })),

      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),

      deleteTransactions: (ids) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => !ids.includes(t.id)),
        })),

      getTransaction: (id) => {
        return get().transactions.find((t) => t.id === id);
      },

      bulkUpdateCategory: (ids, category) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            ids.includes(t.id)
              ? { ...t, category, updatedAt: new Date() }
              : t
          ),
        })),

      bulkUpdateTags: (ids, tags) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            ids.includes(t.id) ? { ...t, tags, updatedAt: new Date() } : t
          ),
        })),

      bulkMarkAsDeductible: (ids, isDeductible) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            ids.includes(t.id)
              ? { ...t, isDeductible, updatedAt: new Date() }
              : t
          ),
        })),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    { name: "transactions-store", version: 2 }
  )
);
