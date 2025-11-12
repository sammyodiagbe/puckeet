import { create } from "zustand";
import { Category, CategoryInput, Tag, TagInput } from "../types";
import { persist } from "../storage";
import { generateUUID } from "../utils/uuid";

interface CategoryStore {
  categories: Category[];
  tags: Tag[];
  isLoading: boolean;

  // Category operations
  setCategories: (categories: Category[]) => void;
  addCategory: (category: CategoryInput) => void;
  updateCategory: (id: string, updates: Partial<CategoryInput>) => void;
  deleteCategory: (id: string) => void;
  getCategory: (id: string) => Category | undefined;
  getCategoryByName: (name: string) => Category | undefined;

  // Tag operations
  setTags: (tags: Tag[]) => void;
  addTag: (tag: TagInput) => void;
  updateTag: (id: string, updates: Partial<TagInput>) => void;
  deleteTag: (id: string) => void;
  getTag: (id: string) => Tag | undefined;
  getTagByName: (name: string) => Tag | undefined;
  incrementTagUsage: (tagName: string) => void;
  decrementTagUsage: (tagName: string) => void;

  // Utility
  setLoading: (isLoading: boolean) => void;
  initializeDefaultCategories: () => void;
}

const DEFAULT_CATEGORIES: CategoryInput[] = [
  {
    name: "Office Supplies",
    color: "#3B82F6",
    icon: "briefcase",
    description: "Office supplies and equipment",
  },
  {
    name: "Travel",
    color: "#10B981",
    icon: "plane",
    description: "Travel expenses and accommodations",
  },
  {
    name: "Meals & Entertainment",
    color: "#F59E0B",
    icon: "utensils",
    description: "Meals and entertainment expenses",
  },
  {
    name: "Software & Subscriptions",
    color: "#8B5CF6",
    icon: "code",
    description: "Software licenses and subscriptions",
  },
  {
    name: "Marketing",
    color: "#EC4899",
    icon: "megaphone",
    description: "Marketing and advertising expenses",
  },
  {
    name: "Equipment",
    color: "#6366F1",
    icon: "laptop",
    description: "Computer and office equipment",
  },
  {
    name: "Professional Services",
    color: "#14B8A6",
    icon: "briefcase",
    description: "Legal, accounting, and consulting services",
  },
  {
    name: "Other",
    color: "#6B7280",
    icon: "folder",
    description: "Other miscellaneous expenses",
    isDefault: true,
  },
];

export const useCategoryStore = create<CategoryStore>(
  persist(
    (set, get) => ({
      categories: [],
      tags: [],
      isLoading: false,

      // Category operations
      setCategories: (categories) => set({ categories }),

      addCategory: (categoryInput) => {
        const now = new Date();
        const category: Category = {
          ...categoryInput,
          id: generateUUID(),
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          categories: [...state.categories, category],
        }));
      },

      updateCategory: (id, updates) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
          ),
        })),

      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        })),

      getCategory: (id) => {
        return get().categories.find((c) => c.id === id);
      },

      getCategoryByName: (name) => {
        return get().categories.find(
          (c) => c.name.toLowerCase() === name.toLowerCase()
        );
      },

      // Tag operations
      setTags: (tags) => set({ tags }),

      addTag: (tagInput) => {
        const now = new Date();
        const tag: Tag = {
          ...tagInput,
          id: generateUUID(),
          usageCount: 0,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          tags: [...state.tags, tag],
        }));
      },

      updateTag: (id, updates) =>
        set((state) => ({
          tags: state.tags.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
          ),
        })),

      deleteTag: (id) =>
        set((state) => ({
          tags: state.tags.filter((t) => t.id !== id),
        })),

      getTag: (id) => {
        return get().tags.find((t) => t.id === id);
      },

      getTagByName: (name) => {
        return get().tags.find(
          (t) => t.name.toLowerCase() === name.toLowerCase()
        );
      },

      incrementTagUsage: (tagName) =>
        set((state) => ({
          tags: state.tags.map((t) =>
            t.name.toLowerCase() === tagName.toLowerCase()
              ? { ...t, usageCount: t.usageCount + 1, updatedAt: new Date() }
              : t
          ),
        })),

      decrementTagUsage: (tagName) =>
        set((state) => ({
          tags: state.tags.map((t) =>
            t.name.toLowerCase() === tagName.toLowerCase()
              ? {
                  ...t,
                  usageCount: Math.max(0, t.usageCount - 1),
                  updatedAt: new Date(),
                }
              : t
          ),
        })),

      setLoading: (isLoading) => set({ isLoading }),

      initializeDefaultCategories: () => {
        const { categories } = get();
        if (categories.length === 0) {
          const now = new Date();
          const defaultCategories = DEFAULT_CATEGORIES.map((cat) => ({
            ...cat,
            id: generateUUID(),
            createdAt: now,
            updatedAt: now,
          }));
          set({ categories: defaultCategories });
        }
      },
    }),
    { name: "categories-store", version: 1 }
  )
);
