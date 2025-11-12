import { create } from "zustand";
import { UIState, ToastMessage } from "../types";
import { generateUUID } from "../utils/uuid";

interface UIStore extends UIState {
  // Modal operations
  openAddTransactionModal: () => void;
  closeAddTransactionModal: () => void;
  openEditTransactionModal: (transactionId: string) => void;
  closeEditTransactionModal: () => void;
  openUploadReceiptModal: () => void;
  closeUploadReceiptModal: () => void;
  openSettings: () => void;
  closeSettings: () => void;

  // Receipt viewer operations
  openReceiptViewer: (receiptId: string) => void;
  closeReceiptViewer: () => void;

  // Sidebar operations
  toggleSidebar: () => void;
  collapseSidebar: () => void;
  expandSidebar: () => void;

  // Toast operations
  showToast: (toast: Omit<ToastMessage, "id">) => void;
  hideToast: () => void;

  // Utility
  closeAllModals: () => void;
}

const DEFAULT_UI_STATE: UIState = {
  isAddTransactionModalOpen: false,
  isEditTransactionModalOpen: false,
  editingTransactionId: null,
  isUploadReceiptModalOpen: false,
  isSettingsOpen: false,
  isSidebarCollapsed: false,
  selectedReceiptId: null,
  isReceiptViewerOpen: false,
  activeToast: null,
};

export const useUIStore = create<UIStore>((set) => ({
  ...DEFAULT_UI_STATE,

  // Modal operations
  openAddTransactionModal: () =>
    set({
      isAddTransactionModalOpen: true,
      isEditTransactionModalOpen: false,
      editingTransactionId: null,
    }),

  closeAddTransactionModal: () =>
    set({ isAddTransactionModalOpen: false }),

  openEditTransactionModal: (transactionId) =>
    set({
      isEditTransactionModalOpen: true,
      editingTransactionId: transactionId,
      isAddTransactionModalOpen: false,
    }),

  closeEditTransactionModal: () =>
    set({
      isEditTransactionModalOpen: false,
      editingTransactionId: null,
    }),

  openUploadReceiptModal: () =>
    set({ isUploadReceiptModalOpen: true }),

  closeUploadReceiptModal: () =>
    set({ isUploadReceiptModalOpen: false }),

  openSettings: () => set({ isSettingsOpen: true }),

  closeSettings: () => set({ isSettingsOpen: false }),

  // Receipt viewer operations
  openReceiptViewer: (receiptId) =>
    set({
      isReceiptViewerOpen: true,
      selectedReceiptId: receiptId,
    }),

  closeReceiptViewer: () =>
    set({
      isReceiptViewerOpen: false,
      selectedReceiptId: null,
    }),

  // Sidebar operations
  toggleSidebar: () =>
    set((state) => ({
      isSidebarCollapsed: !state.isSidebarCollapsed,
    })),

  collapseSidebar: () => set({ isSidebarCollapsed: true }),

  expandSidebar: () => set({ isSidebarCollapsed: false }),

  // Toast operations
  showToast: (toast) => {
    const toastMessage: ToastMessage = {
      ...toast,
      id: generateUUID(),
      duration: toast.duration || 3000,
    };

    set({ activeToast: toastMessage });

    // Auto-hide toast after duration
    if (toastMessage.duration) {
      setTimeout(() => {
        set((state) =>
          state.activeToast?.id === toastMessage.id
            ? { activeToast: null }
            : state
        );
      }, toastMessage.duration);
    }
  },

  hideToast: () => set({ activeToast: null }),

  // Utility
  closeAllModals: () =>
    set({
      isAddTransactionModalOpen: false,
      isEditTransactionModalOpen: false,
      editingTransactionId: null,
      isUploadReceiptModalOpen: false,
      isSettingsOpen: false,
      isReceiptViewerOpen: false,
      selectedReceiptId: null,
    }),
}));
