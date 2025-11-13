import { create } from "zustand";
import { User } from "../types";
import { persist } from "../storage";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  syncWithSupabase: (supabaseUser: SupabaseUser | null) => void;
}

export const useUserStore = create<UserStore>(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),
      syncWithSupabase: (supabaseUser) => {
        if (!supabaseUser) {
          set({ user: null, isAuthenticated: false });
          return;
        }

        // Get name from metadata, or construct from first/last name, or use email
        const firstName = supabaseUser.user_metadata?.first_name;
        const lastName = supabaseUser.user_metadata?.last_name;
        const metadataName = supabaseUser.user_metadata?.name;

        let displayName = metadataName;
        if (!displayName && firstName && lastName) {
          displayName = `${firstName} ${lastName}`.trim();
        } else if (!displayName && firstName) {
          displayName = firstName;
        } else if (!displayName) {
          displayName = supabaseUser.email?.split('@')[0] || "User";
        }

        const user: User = {
          id: supabaseUser.id,
          email: supabaseUser.email || "",
          name: displayName,
          subscriptionTier: "free", // Default to free, can be updated based on your subscription logic
          createdAt: new Date(supabaseUser.created_at),
          updatedAt: new Date(supabaseUser.updated_at || supabaseUser.created_at),
        };

        set({ user, isAuthenticated: true });
      },
    }),
    { name: "user-store", version: 4 }
  )
);
