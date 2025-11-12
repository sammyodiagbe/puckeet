import { create } from "zustand";
import { Receipt, ReceiptInput } from "../types";
import { persist } from "../storage";
import { generateUUID } from "../utils/uuid";

interface ReceiptStore {
  receipts: Receipt[];
  isUploading: boolean;

  // CRUD operations
  setReceipts: (receipts: Receipt[]) => void;
  addReceipt: (receipt: ReceiptInput, userId: string) => void;
  updateReceipt: (id: string, updates: Partial<ReceiptInput>) => void;
  deleteReceipt: (id: string) => void;
  deleteReceipts: (ids: string[]) => void;
  getReceipt: (id: string) => Receipt | undefined;
  getUserReceipts: (userId: string) => Receipt[];

  // Linking operations
  linkReceiptToTransaction: (receiptId: string, transactionId: string) => void;
  unlinkReceiptFromTransaction: (receiptId: string) => void;
  bulkLinkReceipts: (receiptIds: string[], transactionId: string) => void;

  // Query operations
  getReceiptsByTransactionId: (transactionId: string) => Receipt[];
  getUnlinkedReceipts: (userId: string) => Receipt[];

  // Utility
  setUploading: (isUploading: boolean) => void;
}

export const useReceiptStore = create<ReceiptStore>(
  persist(
    (set, get) => ({
      receipts: [],
      isUploading: false,

      setReceipts: (receipts) => set({ receipts }),

      addReceipt: (receiptInput, userId) => {
        const now = new Date();
        const receipt: Receipt = {
          ...receiptInput,
          id: generateUUID(),
          userId,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          receipts: [...state.receipts, receipt],
        }));
      },

      getUserReceipts: (userId) => {
        return get().receipts.filter((r) => r.userId === userId);
      },

      updateReceipt: (id, updates) =>
        set((state) => ({
          receipts: state.receipts.map((r) =>
            r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r
          ),
        })),

      deleteReceipt: (id) =>
        set((state) => ({
          receipts: state.receipts.filter((r) => r.id !== id),
        })),

      deleteReceipts: (ids) =>
        set((state) => ({
          receipts: state.receipts.filter((r) => !ids.includes(r.id)),
        })),

      getReceipt: (id) => {
        return get().receipts.find((r) => r.id === id);
      },

      linkReceiptToTransaction: (receiptId, transactionId) =>
        set((state) => ({
          receipts: state.receipts.map((r) =>
            r.id === receiptId
              ? { ...r, transactionId, updatedAt: new Date() }
              : r
          ),
        })),

      unlinkReceiptFromTransaction: (receiptId) =>
        set((state) => ({
          receipts: state.receipts.map((r) =>
            r.id === receiptId
              ? { ...r, transactionId: undefined, updatedAt: new Date() }
              : r
          ),
        })),

      bulkLinkReceipts: (receiptIds, transactionId) =>
        set((state) => ({
          receipts: state.receipts.map((r) =>
            receiptIds.includes(r.id)
              ? { ...r, transactionId, updatedAt: new Date() }
              : r
          ),
        })),

      getReceiptsByTransactionId: (transactionId) => {
        const { receipts } = get();
        return receipts.filter((r) => r.transactionId === transactionId);
      },

      getUnlinkedReceipts: (userId) => {
        const { receipts } = get();
        return receipts.filter((r) => r.userId === userId && !r.transactionId);
      },

      setUploading: (isUploading) => set({ isUploading }),
    }),
    { name: "receipts-store", version: 2 }
  )
);
