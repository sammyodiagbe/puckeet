import { create } from "zustand";
import { BankConnection } from "../types";
import { persist } from "../storage";

interface SyncStore {
  bankConnections: BankConnection[];
  isSyncing: boolean;
  lastSyncDate: Date | null;
  addBankConnection: (connection: BankConnection) => void;
  updateBankConnection: (id: string, updates: Partial<BankConnection>) => void;
  removeBankConnection: (id: string) => void;
  startSync: (bankId: string) => void;
  finishSync: (bankId: string, success: boolean) => void;
}

export const useSyncStore = create<SyncStore>(
  persist(
    (set) => ({
      bankConnections: [],
      isSyncing: false,
      lastSyncDate: null,

      addBankConnection: (connection) =>
        set((state) => ({
          bankConnections: [...state.bankConnections, connection],
        })),

      updateBankConnection: (id, updates) =>
        set((state) => ({
          bankConnections: state.bankConnections.map((conn) =>
            conn.id === id ? { ...conn, ...updates } : conn
          ),
        })),

      removeBankConnection: (id) =>
        set((state) => ({
          bankConnections: state.bankConnections.filter((conn) => conn.id !== id),
        })),

      startSync: (bankId) =>
        set((state) => ({
          isSyncing: true,
          bankConnections: state.bankConnections.map((conn) =>
            conn.id === bankId ? { ...conn, status: "syncing" as const } : conn
          ),
        })),

      finishSync: (bankId, success) =>
        set((state) => ({
          isSyncing: false,
          lastSyncDate: new Date(),
          bankConnections: state.bankConnections.map((conn) =>
            conn.id === bankId
              ? {
                  ...conn,
                  status: success ? ("connected" as const) : ("error" as const),
                  lastSyncDate: success ? new Date() : conn.lastSyncDate,
                }
              : conn
          ),
        })),
    }),
    { name: "sync-store", version: 1 }
  )
);
