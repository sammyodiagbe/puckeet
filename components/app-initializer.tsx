"use client";

import { useEffect } from "react";
import { useCategoryStore } from "@/lib/stores/category-store";
import { useUserStore } from "@/lib/stores/user-store";
import { createClient } from "@/utils/supabase/client";

/**
 * Component that initializes app data on mount
 * - Syncs Supabase user with local user store
 * - Initializes default categories if they don't exist
 * - Can be extended to perform other initialization tasks
 */
export function AppInitializer() {
  const { syncWithSupabase } = useUserStore();

  useEffect(() => {
    const supabase = createClient();

    // Sync Supabase user with local store
    supabase.auth.getUser().then(({ data: { user } }) => {
      syncWithSupabase(user);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncWithSupabase(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [syncWithSupabase]);

  useEffect(() => {
    // Initialize default categories on first load
    const { categories, initializeDefaultCategories } =
      useCategoryStore.getState();

    if (categories.length === 0) {
      initializeDefaultCategories();
      console.log("✅ Default categories initialized");
    }

    // For development: Make seeding functions available in console
    if (process.env.NODE_ENV === "development") {
      import("@/lib/seed-data").then((module) => {
        (window as any).__puckeet = {
          seedMockData: module.seedMockData,
          clearAllStoreData: module.clearAllStoreData,
          initializeDefaultCategories: module.initializeDefaultCategories,
          hasData: module.hasData,
        };
        console.log("🛠️  Dev tools available: window.__puckeet");
      });
    }
  }, []);

  return null;
}
