# Puckeet Routing Structure

## Overview

Puckeet uses Next.js 15 App Router with file-based routing. All routes are located in the `app/` directory.

## Current Routes

### Public Routes

#### `/` - Landing Page
- **File**: `app/page.tsx`
- **Purpose**: Homepage/landing page for the application
- **Status**: Needs implementation

---

### Application Routes

#### `/dashboard` - Dashboard
- **File**: `app/dashboard/page.tsx`
- **Purpose**: Main dashboard with statistics, charts, and quick actions
- **Features**:
  - Total expenses overview
  - Deductible expenses tracking
  - Pending categorization count
  - Recent transactions list
  - Quick action buttons
- **Status**: Ready for implementation (Sprint 2)

#### `/transactions` - Transactions List
- **File**: `app/transactions/page.tsx`
- **Purpose**: View, filter, and manage all transactions
- **Features**:
  - Transaction list/table
  - Advanced filtering and search
  - Bulk operations
  - Add/Edit transaction modals
  - Receipt attachment
- **Status**: Ready for implementation (Sprint 2)

#### `/receipts` - Receipts Gallery
- **File**: `app/receipts/page.tsx`
- **Purpose**: Upload and manage receipts
- **Features**:
  - Receipt gallery view
  - Upload interface
  - Link receipts to transactions
  - Receipt viewer/lightbox
- **Status**: Ready for implementation (Sprint 3)

#### `/reports` - Reports & Export
- **File**: `app/reports/page.tsx`
- **Purpose**: Generate and export financial reports
- **Features**:
  - Report types (Summary, Detailed, Tax-ready)
  - Date range selection
  - Export formats (CSV, JSON, PDF)
  - Print view
- **Status**: Ready for implementation (Sprint 4)

---

### Settings Routes

#### `/settings/profile` - User Profile
- **File**: `app/settings/profile/page.tsx`
- **Purpose**: User profile and preferences
- **Features**:
  - Display name
  - Tax year settings
  - Currency settings
  - Date format preferences
- **Status**: Ready for implementation (Sprint 5)

#### `/settings/bank-sync` - Bank Synchronization
- **File**: `app/settings/bank-sync/page.tsx`
- **Purpose**: Bank connection settings (Future feature)
- **Features**:
  - Bank connections list
  - Add/remove bank accounts
  - Sync status
- **Status**: Future implementation (Phase 13+)

---

## Route Groups (Proposed)

For better organization, consider implementing route groups:

```
app/
├── (auth)/           # Future: Authentication pages
│   ├── login/
│   └── signup/
├── (app)/            # Main application
│   ├── dashboard/
│   ├── transactions/
│   ├── receipts/
│   └── reports/
└── (settings)/       # Settings pages
    ├── profile/
    ├── categories/
    ├── rules/
    └── bank-sync/
```

## Layouts

### Root Layout (`app/layout.tsx`)
- Global layout for all pages
- Includes:
  - Font loading (Inter, JetBrains Mono)
  - Theme provider
  - App initializer (default categories)
  - Toast notifications
  - Global metadata

### Future Layouts

#### App Layout (`app/(app)/layout.tsx`)
- Shared layout for main application pages
- Should include:
  - Navigation sidebar
  - Header with search
  - User menu
  - Breadcrumbs

#### Settings Layout (`app/(settings)/layout.tsx`)
- Shared layout for settings pages
- Should include:
  - Settings sidebar navigation
  - Page header
  - Save/Cancel actions

## Navigation Structure

### Primary Navigation
1. Dashboard (`/dashboard`)
2. Transactions (`/transactions`)
3. Receipts (`/receipts`)
4. Reports (`/reports`)
5. Settings (`/settings/profile`)

### Secondary Navigation (Settings)
1. Profile (`/settings/profile`)
2. Categories (to be created)
3. Tags (to be created)
4. Rules (to be created)
5. Bank Sync (`/settings/bank-sync`)
6. Data Management (to be created)

## Implementation Priority

Based on the plan.md:

### Sprint 2 (Core Features) - NEXT
1. Dashboard layout and navigation
2. Transactions list page
3. Add/edit transaction functionality

### Sprint 3 (Receipts)
4. Receipt upload and storage
5. Receipt gallery view
6. Link receipts to transactions

### Sprint 4 (Advanced)
7. Filtering and search
8. Reports and exports

### Sprint 5 (Polish)
9. Settings pages
10. UI enhancements

## API Routes (Future)

When backend is added:

```
app/api/
├── transactions/
│   ├── route.ts          # GET, POST
│   └── [id]/route.ts     # GET, PUT, DELETE
├── receipts/
│   ├── route.ts
│   └── [id]/route.ts
├── categories/
│   └── route.ts
└── export/
    └── route.ts
```

## Notes

- All pages should be Server Components by default
- Use "use client" directive only when needed (forms, interactivity)
- Implement proper loading.tsx and error.tsx for each route
- Use parallel routes for modals where appropriate
- Consider implementing intercepting routes for modals
