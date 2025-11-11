import { create } from "zustand";
import { User } from "../types";
import { persist } from "../storage";

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  syncWithClerk: (clerkUser: any) => void;
}

export const useUserStore = create<UserStore>(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),
      syncWithClerk: (clerkUser) => {
        if (!clerkUser) {
          set({ user: null, isAuthenticated: false });
          return;
        }

        const user: User = {
          id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress || "",
          name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "User",
          subscriptionTier: "free", // Default to free, can be updated based on your subscription logic
          createdAt: new Date(clerkUser.createdAt),
          updatedAt: new Date(clerkUser.updatedAt),
        };

        set({ user, isAuthenticated: true });
      },
    }),
    { name: "user-store", version: 3 }
  )
);
