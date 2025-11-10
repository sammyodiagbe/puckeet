import { create } from "zustand";
import { User } from "../types";
import { persist } from "../storage";

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>(
  persist(
    (set) => ({
      user: {
        id: "1",
        email: "user@example.com",
        name: "John Doe",
        subscriptionTier: "premium",
      },
      isAuthenticated: true,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: "user-store", version: 1 }
  )
);
