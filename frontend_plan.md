# **Puckeet App: Frontend Blueprint (Next.js, TypeScript, Shadcn)**

This plan outlines the core pages, components, and structure needed to build the professional expense tracking application's frontend using Next.js, TypeScript, Tailwind CSS, and Shadcn UI components.

## **1\. Core Technology Stack**

* **Framework:** Next.js 14+ (App Router)  
* **Language:** TypeScripta  
* **Styling:** Tailwind CSS  
* **UI Library:** Shadcn/ui (highly recommended for professional, accessible components)  
* **Icons:** Lucide-React (or similar package integrated with Shadcn)

## **2\. Page & Routing Structure**

| Path | Description | Key Components Used | Notes |
| :---- | :---- | :---- | :---- |
| /dashboard | Main summary of current expenses, filing status, and quick actions. | DashboardHeader, StatCard, RecentTransactionsTable, QuickActionButton | Should be the primary landing page post-login. |
| /transactions | Detailed list and management of all purchases. | DataTable (from Shadcn), FilterBar, CategorySelect, Pagination | Allows for filtering by date, category, status (e.g., "uncategorized"). |
| /receipts | Management of uploaded and synced receipt images. | ReceiptGallery, ReceiptUploadForm, ImageModal | Focus on responsive display of scanned documents. |
| /reports | Tax preparation and data export interface. | ReportConfigForm, ExportButton, DateRangePicker, ConfirmationDialog | Contains the "Export Data" button logic. |
| /settings/bank-sync | Interface for connecting and managing bank/financial APIs. | PlaidConnectButton (or mock), SyncStatusList, Alert | Handles API connection setup and status display. |
| /settings/profile | User profile and account management. | ProfileForm, UserAvatar, SubscriptionInfo | Standard user settings page. |

## **3\. Essential Shadcn/ui Components**

We will heavily rely on Shadcn/ui components for a polished, professional look:

* **Data Display:** DataTable, Card, Badge, Alert  
* **Input & Forms:** Input, Select, Button, Calendar (for date ranges), Form (for complex logic)  
* **Navigation:** Sheet (for mobile sidebar), DropdownMenu (for user profile), Tabs  
* **Feedback:** Toast, Progress (for sync/export status)  
* **Layout:** Separator, ResizablePanel (if needed for flexible transaction view)

## **4\. Key Frontend Component Breakdown**

| Component Name | Parent Page | Description | State/Props |
| :---- | :---- | :---- | :---- |
| **AppLayout** | All | Wraps the entire application, includes persistent Navbar/Sidebar. | user, isMobile |
| **TransactionItem** | /transactions | A single row in the transaction table. | transactionData |
| **CategorizationPanel** | /transactions (Modal or Drawer) | UI for manually reviewing and assigning category, tax relevance, and attaching a receipt. | currentTransaction, onUpdate |
| **ReceiptUploader** | /receipts | Component for drag-and-drop or file selection for receipts. | onUpload, isLoading |
| **ExportButton** | /reports | Main button that triggers the data collection and format conversion (e.g., CSV/JSON). | reportParams, onClickExport |
| **BankConnectionCard** | /settings/bank-sync | Displays status for a single connected bank. | bankName, status, lastSyncDate |

## **5\. Frontend State Management**

While Next.js allows simple state management via React hooks (useState, useReducer), for an application of this complexity, we should consider a global state manager for transaction lists, user session, and sync status.

* **Recommendation:** Use **Zustand** or **React Context** for lightweight, performant global state.  
  * **Global Stores:** useUserStore (Auth status, profile), useTransactionStore (Filtered/raw data, status), useSyncStore (Bank connection tokens, ongoing sync process).

## **6\. Development Priorities**

1. **Setup:** Next.js project initialization, Tailwind/Shadcn setup, basic AppLayout and Auth structure.  
2. **Transactions View:** Implement the DataTable with mock data, filtering, and the CategorizationPanel.  
3. **Receipt Handling:** Build the ReceiptUploader and ensure receipts link visually to transactions.  
4. **Reports:** Implement the ReportConfigForm and the final ExportButton UI/UX.