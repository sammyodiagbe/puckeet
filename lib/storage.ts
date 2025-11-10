import { StateCreator, StoreMutatorIdentifier } from "zustand";

type PersistOptions<T> = {
  name: string;
  version?: number;
  migrate?: (persistedState: any, version: number) => T;
};

type Persist = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  config: StateCreator<T, Mps, Mcs>,
  options: PersistOptions<T>
) => StateCreator<T, Mps, Mcs>;

/**
 * Custom persist middleware for Zustand that handles Date serialization
 */
export const persist: Persist =
  (config, { name, version = 1, migrate }) =>
  (set, get, api) => {
    const storage = {
      getItem: (key: string): any => {
        const str = localStorage.getItem(key);
        if (!str) return null;

        try {
          const { state, version: storedVersion } = JSON.parse(str, (key, value) => {
            // Revive Date objects
            if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
              return new Date(value);
            }
            return value;
          });

          // Handle version migration
          if (migrate && storedVersion !== version) {
            return migrate(state, storedVersion);
          }

          return state;
        } catch (error) {
          console.error(`Error parsing stored state for ${key}:`, error);
          return null;
        }
      },
      setItem: (key: string, value: any): void => {
        try {
          const str = JSON.stringify(
            {
              state: value,
              version,
            },
            (key, value) => {
              // Serialize Date objects as ISO strings
              if (value instanceof Date) {
                return value.toISOString();
              }
              return value;
            }
          );
          localStorage.setItem(key, str);
        } catch (error) {
          console.error(`Error storing state for ${key}:`, error);
        }
      },
      removeItem: (key: string): void => {
        localStorage.removeItem(key);
      },
    };

    // Load persisted state
    const persistedState = storage.getItem(name);

    // Create the store
    const store = config(
      (args) => {
        set(args);
        // Save to storage after every state change
        storage.setItem(name, get());
      },
      get,
      api
    );

    // Merge persisted state with initial state
    if (persistedState) {
      Object.assign(store, persistedState);
    }

    return store;
  };

/**
 * Clear all app data from localStorage
 */
export function clearAllData() {
  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (
      key.startsWith("puckeet-") ||
      key === "transactions-store" ||
      key === "receipts-store" ||
      key === "categories-store" ||
      key === "user-store"
    ) {
      localStorage.removeItem(key);
    }
  });
}

/**
 * Export all data as JSON
 */
export function exportData() {
  const data: Record<string, any> = {};
  const keys = Object.keys(localStorage);

  keys.forEach((key) => {
    if (
      key.startsWith("puckeet-") ||
      key === "transactions-store" ||
      key === "receipts-store" ||
      key === "categories-store" ||
      key === "user-store"
    ) {
      try {
        data[key] = JSON.parse(localStorage.getItem(key) || "");
      } catch (error) {
        console.error(`Error exporting ${key}:`, error);
      }
    }
  });

  return data;
}

/**
 * Import data from JSON backup
 */
export function importData(data: Record<string, any>) {
  Object.entries(data).forEach(([key, value]) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error importing ${key}:`, error);
    }
  });
}

/**
 * Get storage statistics
 */
export function getStorageStats() {
  let totalSize = 0;
  const keys = Object.keys(localStorage);

  keys.forEach((key) => {
    const item = localStorage.getItem(key);
    if (item) {
      totalSize += item.length + key.length;
    }
  });

  // Approximate size in bytes (UTF-16, so multiply by 2)
  const sizeInBytes = totalSize * 2;
  const sizeInKB = sizeInBytes / 1024;
  const sizeInMB = sizeInKB / 1024;

  return {
    totalSize: sizeInBytes,
    sizeInKB: Math.round(sizeInKB * 100) / 100,
    sizeInMB: Math.round(sizeInMB * 100) / 100,
    itemCount: keys.length,
  };
}
