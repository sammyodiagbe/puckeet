import { create } from "zustand";
import { Transaction, TransactionInput } from "../types";
import { persist } from "../storage";
import { useUserStore } from "./user-store";
import { generateUUID } from "../utils/uuid";

interface TransactionStore {
  transactions: Transaction[];
  isLoading: boolean;

  // CRUD operations
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: TransactionInput, userId: string) => Transaction;
  updateTransaction: (id: string, updates: Partial<TransactionInput>) => void;
  deleteTransaction: (id: string) => void;
  deleteTransactions: (ids: string[]) => void;
  getTransaction: (id: string) => Transaction | undefined;
  getUserTransactions: (userId: string) => Transaction[];

  // Bulk operations
  bulkUpdateCategory: (ids: string[], category: string) => void;
  bulkUpdateTags: (ids: string[], tags: string[]) => void;
  bulkMarkAsDeductible: (ids: string[], isDeductible: boolean) => void;

  // Utility
  setLoading: (isLoading: boolean) => void;
  loadTransactions: () => Promise<void>;
}

export const useTransactionStore = create<TransactionStore>(
  persist(
    (set, get) => ({
      transactions: [],
      isLoading: false,

      setTransactions: (transactions) => set({ transactions }),

      addTransaction: (transactionInput, userId) => {
        const now = new Date();
        const transaction: Transaction = {
          ...transactionInput,
          id: generateUUID(),
          userId,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          transactions: [...state.transactions, transaction],
        }));

        return transaction;
      },

      getUserTransactions: (userId) => {
        return get().transactions.filter((t) => t.userId === userId);
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

      loadTransactions: async () => {
        try {
          set({ isLoading: true });

          const response = await fetch("/api/transactions");

          if (!response.ok) {
            throw new Error("Failed to fetch transactions");
          }

          const data = await response.json();

          if (data.success && data.data?.transactions) {
            // Map API response to store format
            const transactions: Transaction[] = data.data.transactions.map((tx: any) => ({
              id: tx.id,
              userId: tx.user_id,
              date: new Date(tx.date),
              amount: parseFloat(tx.amount),
              description: tx.description || "",
              merchant: tx.merchant || "",
              category: tx.category_id || "",
              tags: tx.tags || [],
              receiptIds: [],
              notes: tx.notes || "",
              isDeductible: tx.is_deductible ?? true,
              status: tx.status || "pending",
              createdAt: new Date(tx.created_at),
              updatedAt: new Date(tx.updated_at),
            }));

            set({ transactions, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error("Error loading transactions:", error);
          set({ isLoading: false });
        }
      },
    }),
    { name: "transactions-store", version: 2 }
  )
);
