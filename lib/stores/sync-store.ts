import { create } from "zustand";
import { BankConnection, BankConnectionInput } from "../types";
import { persist } from "../storage";
import { generateUUID } from "../utils/uuid";

interface SyncStore {
  bankConnections: BankConnection[];
  isSyncing: boolean;
  lastSyncDate: Date | null;
  syncingAccountIds: string[];
  addBankConnection: (connection: BankConnectionInput) => void;
  addMultipleBankConnections: (connections: BankConnectionInput[]) => void;
  updateBankConnection: (id: string, updates: Partial<BankConnection>) => void;
  removeBankConnection: (id: string) => void;
  getBankConnection: (id: string) => BankConnection | undefined;
  getBankConnectionsByInstitution: (institutionId: string) => BankConnection[];
  startSync: (bankId: string) => void;
  finishSync: (
    bankId: string,
    success: boolean,
    cursor?: string,
    errorMessage?: string
  ) => void;
  updateCursor: (bankId: string, cursor: string) => void;
}

export const useSyncStore = create<SyncStore>(
  persist(
    (set, get) => ({
      bankConnections: [],
      isSyncing: false,
      lastSyncDate: null,
      syncingAccountIds: [],

      addBankConnection: (connectionInput) => {
        const connection: BankConnection = {
          ...connectionInput,
          id: generateUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          bankConnections: [...state.bankConnections, connection],
        }));
      },

      addMultipleBankConnections: (connectionsInput) => {
        const connections: BankConnection[] = connectionsInput.map((input) => ({
          ...input,
          id: generateUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        set((state) => ({
          bankConnections: [...state.bankConnections, ...connections],
        }));
      },

      updateBankConnection: (id, updates) =>
        set((state) => ({
          bankConnections: state.bankConnections.map((conn) =>
            conn.id === id
              ? { ...conn, ...updates, updatedAt: new Date() }
              : conn
          ),
        })),

      removeBankConnection: (id) =>
        set((state) => ({
          bankConnections: state.bankConnections.filter(
            (conn) => conn.id !== id
          ),
        })),

      getBankConnection: (id) => {
        return get().bankConnections.find((conn) => conn.id === id);
      },

      getBankConnectionsByInstitution: (institutionId) => {
        return get().bankConnections.filter(
          (conn) => conn.institutionId === institutionId
        );
      },

      startSync: (bankId) =>
        set((state) => ({
          isSyncing: true,
          syncingAccountIds: [...state.syncingAccountIds, bankId],
          bankConnections: state.bankConnections.map((conn) =>
            conn.id === bankId
              ? { ...conn, status: "syncing" as const, updatedAt: new Date() }
              : conn
          ),
        })),

      finishSync: (bankId, success, cursor, errorMessage) =>
        set((state) => ({
          isSyncing: state.syncingAccountIds.length > 1,
          syncingAccountIds: state.syncingAccountIds.filter(
            (id) => id !== bankId
          ),
          lastSyncDate: success ? new Date() : state.lastSyncDate,
          bankConnections: state.bankConnections.map((conn) =>
            conn.id === bankId
              ? {
                  ...conn,
                  status: success ? ("connected" as const) : ("error" as const),
                  lastSyncDate: success ? new Date() : conn.lastSyncDate,
                  cursor: cursor || conn.cursor,
                  errorMessage: errorMessage || undefined,
                  updatedAt: new Date(),
                }
              : conn
          ),
        })),

      updateCursor: (bankId, cursor) =>
        set((state) => ({
          bankConnections: state.bankConnections.map((conn) =>
            conn.id === bankId
              ? { ...conn, cursor, updatedAt: new Date() }
              : conn
          ),
        })),
    }),
    { name: "sync-store", version: 2 }
  )
);
