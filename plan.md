# Puckeet Frontend Implementation Plan

**Goal**: Build a fully functional expense tracking application with local data persistence (no backend initially)

---

## Phase 1: Data Layer & Architecture (Foundation)

### 1.1 Local Storage Strategy
- [ ] Implement data models/types for:
  - Transactions
  - Receipts
  - Categories
  - Tags
  - User settings
- [ ] Create mock data generators for development
- [ ] Implement data migration strategy (version tracking)
- [ ] Add data export/import functionality (JSON backup)

### 1.2 State Management
- [ ] Choose approach: Zustand, Jotai, or React Context
- [ ] Create stores for:
  - Transactions store
  - Receipts store
  - Categories store
  - Filters/search store
  - UI state (modals, sidebars)
- [ ] Implement persistence middleware

### 1.3 Core Data Models
```typescript
// Transaction model
interface Transaction {
  id: string
  date: Date
  amount: number
  description: string
  category: string
  tags: string[]
  receiptIds: string[]
  notes?: string
  isDeductible: boolean
  status: 'pending' | 'categorized' | 'reviewed'
}

// Receipt model
interface Receipt {
  id: string
  transactionId?: string
  imageUrl: string // base64 or blob URL
  fileName: string
  uploadDate: Date
  notes?: string
}
```

---

## Phase 2: Dashboard Page

### 2.1 Layout
- [ ] Create dashboard layout with sidebar navigation
- [ ] Implement responsive grid for stat cards
- [ ] Add date range picker for filtering

### 2.2 Statistics Cards
- [ ] Total expenses card (with month-over-month comparison)
- [ ] Deductible expenses card
- [ ] Pending categorization count
- [ ] Number of receipts uploaded

### 2.3 Charts & Visualizations
- [ ] Install chart library (Recharts or Chart.js)
- [ ] Monthly spending trend line chart
- [ ] Category breakdown pie/donut chart
- [ ] Recent transactions list (last 10)
- [ ] Quick actions section

### 2.4 Quick Actions
- [ ] "Add Transaction" button
- [ ] "Upload Receipt" button
- [ ] "Generate Report" button
- [ ] "View All Transactions" link

---

## Phase 3: Transactions Page

### 3.1 Transaction List View
- [ ] Create responsive table/list component
- [ ] Implement columns:
  - Date
  - Description
  - Category (with badge)
  - Amount (color-coded: positive/negative)
  - Tags
  - Receipt indicator
  - Actions (edit, delete, attach receipt)

### 3.2 Filtering & Search
- [ ] Search by description/notes
- [ ] Filter by date range
- [ ] Filter by category
- [ ] Filter by tags (multi-select)
- [ ] Filter by deductible status
- [ ] Filter by receipt attachment status
- [ ] Save filter presets

### 3.3 Bulk Actions
- [ ] Select multiple transactions
- [ ] Bulk categorize
- [ ] Bulk tag
- [ ] Bulk delete (with confirmation)
- [ ] Bulk mark as deductible

### 3.4 Add/Edit Transaction Modal
- [ ] Form with validation (react-hook-form + zod)
- [ ] Fields:
  - Date picker
  - Amount input (with currency formatting)
  - Description
  - Category dropdown (with create new)
  - Tags input (with autocomplete)
  - Notes textarea
  - Deductible toggle
  - Receipt attachment option
- [ ] Quick add mode (minimal fields)
- [ ] Duplicate transaction action

### 3.5 Transaction Detail View
- [ ] Slide-over panel or modal
- [ ] Display all transaction details
- [ ] Show attached receipts (thumbnails)
- [ ] Edit inline functionality
- [ ] Add notes section
- [ ] Activity/history log (if editing)

---

## Phase 4: Receipts Page

### 4.1 Receipt Gallery View
- [ ] Grid layout with thumbnails
- [ ] Card view with metadata
- [ ] Filter by:
  - Date uploaded
  - Linked/unlinked to transactions
  - Search by filename/notes

### 4.2 Receipt Upload
- [ ] Drag-and-drop upload area
- [ ] Multi-file upload support
- [ ] Image preview before upload
- [ ] Store as base64 in localStorage (or IndexedDB for larger files)
- [ ] File size validation and compression
- [ ] Supported formats: JPG, PNG, PDF

### 4.3 Receipt Management
- [ ] View full-size image in modal/lightbox
- [ ] Link receipt to transaction (search/select)
- [ ] Unlink receipt from transaction
- [ ] Add notes to receipt
- [ ] Delete receipt (with confirmation)
- [ ] Download receipt
- [ ] Rotate image functionality

### 4.4 Receipt Linking
- [ ] Smart suggestions (match by date/amount)
- [ ] Manual link with transaction search
- [ ] Visual indicator of linked/unlinked status
- [ ] Bulk linking interface

---

## Phase 5: Categories & Tags System

### 5.1 Category Management
- [ ] Create predefined categories:
  - Office Supplies
  - Travel
  - Meals & Entertainment
  - Software & Subscriptions
  - Marketing
  - Equipment
  - Professional Services
  - Other
- [ ] Add custom categories
- [ ] Edit category (name, color, icon)
- [ ] Delete category (with reassignment prompt)
- [ ] Category settings page
- [ ] Set default category

### 5.2 Tags System
- [ ] Create tags with autocomplete
- [ ] Tag management page
- [ ] Color-code tags
- [ ] Delete unused tags
- [ ] Tag suggestions based on description

### 5.3 Smart Categorization
- [ ] Rule-based auto-categorization
  - If description contains "X", set category to "Y"
- [ ] Learn from user patterns
- [ ] Suggest categories for new transactions

---

## Phase 6: Reports & Export

### 6.1 Report Types
- [ ] Summary report
  - Total expenses by category
  - Deductible vs non-deductible
  - Monthly breakdown
- [ ] Detailed transaction report
- [ ] Tax-ready report
  - Only deductible expenses
  - Grouped by category
  - Include receipt references

### 6.2 Date Range Selection
- [ ] Preset ranges (This Month, Last Month, Quarter, Year, Tax Year)
- [ ] Custom date range picker
- [ ] Compare periods

### 6.3 Export Formats
- [ ] CSV export
  - Configurable columns
  - Include/exclude receipts info
- [ ] JSON export (full data backup)
- [ ] PDF report generation (react-pdf or similar)
  - Professional formatting
  - Include summary charts
  - Optional receipt attachments

### 6.4 Print View
- [ ] Print-optimized report layout
- [ ] Include company/user info header
- [ ] Page breaks and formatting

---

## Phase 7: Settings Page

### 7.1 User Preferences
- [ ] Display name
- [ ] Tax year settings (calendar vs fiscal)
- [ ] Currency settings
- [ ] Date format preferences
- [ ] Theme selection (already implemented)

### 7.2 Category & Tag Management
- [ ] Interface to manage categories
- [ ] Interface to manage tags
- [ ] Category ordering/priority

### 7.3 Auto-Categorization Rules
- [ ] Add/edit rules
- [ ] Enable/disable rules
- [ ] Rule priority ordering
- [ ] Test rules against existing transactions

### 7.4 Data Management
- [ ] Export all data (JSON)
- [ ] Import data from backup
- [ ] Clear all data (with confirmation)
- [ ] Data statistics (storage used, transaction count, etc.)

### 7.5 App Settings
- [ ] Default view preferences
- [ ] Notification preferences (future)
- [ ] About page (version, credits)

---

## Phase 8: UI/UX Enhancements

### 8.1 Loading States
- [ ] Skeleton loaders for all views
- [ ] Loading spinners for actions
- [ ] Optimistic updates

### 8.2 Empty States
- [ ] No transactions placeholder
- [ ] No receipts placeholder
- [ ] No search results
- [ ] Empty category states
- [ ] Helpful CTAs in empty states

### 8.3 Error Handling
- [ ] Form validation errors
- [ ] Storage quota errors
- [ ] File upload errors
- [ ] Toast notifications for errors
- [ ] Error boundaries for crashes

### 8.4 Animations & Micro-interactions
- [ ] Page transitions (Framer Motion)
- [ ] Card hover effects (already in design system)
- [ ] Button feedback (already implemented)
- [ ] List item animations (enter/exit)
- [ ] Smooth scrolling

### 8.5 Keyboard Shortcuts
- [ ] `/` to focus search
- [ ] `n` to add new transaction
- [ ] `u` to upload receipt
- [ ] `r` to open reports
- [ ] `?` to show shortcuts help modal

### 8.6 Tour/Onboarding
- [ ] First-time user tour (Shepherd.js or similar)
- [ ] Highlight key features
- [ ] Skip option
- [ ] Mark as completed in settings

---

## Phase 9: Advanced Features

### 9.1 Recurring Transactions
- [ ] Mark transaction as recurring
- [ ] Set recurrence pattern (daily, weekly, monthly, yearly)
- [ ] Auto-generate upcoming transactions
- [ ] Edit/skip upcoming occurrences

### 9.2 Budget Tracking
- [ ] Set monthly/yearly budgets by category
- [ ] Visual budget progress bars
- [ ] Warning when approaching limit
- [ ] Budget vs actual comparison chart

### 9.3 Search & Intelligence
- [ ] Full-text search across all fields
- [ ] Search history
- [ ] Recent searches suggestions
- [ ] Advanced search with operators

### 9.4 Multi-currency Support (Future)
- [ ] Add currency field to transactions
- [ ] Currency conversion rates (static for now)
- [ ] Display in home currency

### 9.5 Insights & Analytics
- [ ] Spending trends over time
- [ ] Category distribution insights
- [ ] Month-over-month comparisons
- [ ] Anomaly detection (unusually high expenses)
- [ ] Insights dashboard widget

---

## Phase 10: Mobile Responsiveness

### 10.1 Mobile Layout
- [ ] Responsive navigation (hamburger menu)
- [ ] Touch-optimized buttons (44px minimum)
- [ ] Mobile-friendly forms
- [ ] Swipeable card actions
- [ ] Bottom sheet modals for mobile

### 10.2 Mobile-Specific Features
- [ ] Pull-to-refresh
- [ ] Mobile camera integration for receipt photos
- [ ] Share functionality (native share API)
- [ ] Install as PWA prompt

### 10.3 PWA Implementation
- [ ] Service worker setup
- [ ] Offline functionality
- [ ] Add to home screen
- [ ] App manifest
- [ ] Caching strategy

---

## Phase 11: Testing & Quality

### 11.1 Unit Tests
- [ ] Test utility functions
- [ ] Test data models/transformations
- [ ] Test custom hooks

### 11.2 Component Tests
- [ ] Test UI components
- [ ] Test form validation
- [ ] Test state management

### 11.3 E2E Tests (Playwright)
- [ ] Test critical user flows
- [ ] Test data persistence
- [ ] Test export functionality

### 11.4 Accessibility
- [ ] ARIA labels on all interactive elements
- [ ] Keyboard navigation
- [ ] Screen reader testing
- [ ] Color contrast validation
- [ ] Focus management

---

## Phase 12: Performance Optimization

### 12.1 Code Splitting
- [ ] Route-based code splitting
- [ ] Component lazy loading
- [ ] Bundle size analysis

### 12.2 Data Optimization
- [ ] Virtualized lists for large datasets
- [ ] Pagination for transactions
- [ ] IndexedDB for receipt images (if localStorage limits hit)
- [ ] Debounced search

### 12.3 Image Optimization
- [ ] Compress receipt images
- [ ] Lazy load receipt thumbnails
- [ ] Image dimension limits

---

## Implementation Order (Recommended)

### Sprint 1 (Foundation)
1. Data models and types
2. Local storage utilities
3. State management setup
4. Basic routing structure

### Sprint 2 (Core Features)
5. Dashboard layout and navigation
6. Transactions list page
7. Add/edit transaction functionality
8. Category system

### Sprint 3 (Receipts)
9. Receipt upload and storage
10. Receipt gallery view
11. Link receipts to transactions

### Sprint 4 (Advanced)
12. Filtering and search
13. Tags system
14. Reports and exports

### Sprint 5 (Polish)
15. Settings page
16. UI enhancements (empty states, loading, errors)
17. Mobile responsive
18. Keyboard shortcuts

### Sprint 6 (Future)
19. Advanced features (recurring, budgets)
20. PWA implementation
21. Testing
22. Performance optimization

---

## Technical Stack

### Core
- **Framework**: Next.js 15 (App Router) ✅
- **Language**: TypeScript ✅
- **Styling**: Tailwind CSS v4 ✅

### UI Components
- **Component Library**: shadcn/ui ✅
- **Icons**: Lucide React ✅
- **Animations**: GSAP ✅, Framer Motion (to add)

### State & Data
- **State Management**: Zustand (recommended) or Jotai
- **Storage**: localStorage + IndexedDB (for large files)
- **Forms**: react-hook-form + zod
- **Date Handling**: date-fns

### Charts & Visualization
- **Charts**: Recharts or Chart.js
- **Data Table**: TanStack Table

### File Handling
- **Image Processing**: browser-image-compression
- **PDF Generation**: @react-pdf/renderer or jsPDF

### Quality
- **Testing**: Vitest, Testing Library, Playwright
- **Linting**: ESLint ✅
- **Type Safety**: TypeScript strict mode

---

## Notes

- All data stored client-side (localStorage/IndexedDB)
- No authentication required yet
- Design system already implemented ✅
- Can migrate to backend later by swapping storage layer
- Focus on DX and UX, make it feel like a premium SaaS app

---

## Future Backend Integration (Phase 13+)

When ready to add backend:
- [ ] User authentication (Clerk or Auth.js)
- [ ] PostgreSQL database
- [ ] Supabase or custom API
- [ ] Cloud storage for receipts (S3, Cloudinary)
- [ ] Real-time sync
- [ ] Multi-device support
- [ ] Bank integration (Plaid)
- [ ] Automatic transaction import
- [ ] Receipt OCR extraction
- [ ] Team/accountant sharing features
