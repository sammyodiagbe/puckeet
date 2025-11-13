# CRA Export Structure Research & Recommendations

**Date:** November 12, 2025
**Project:** TaxReady - Expense Tracking Application
**Purpose:** Define optimal export structure for CRA tax submission

---

## Executive Summary

This document outlines the Canada Revenue Agency (CRA) requirements for business expense reporting and provides recommendations for implementing a comprehensive export feature that aligns with Form T2125 (Statement of Business or Professional Activities) requirements.

**Key Findings:**
- CRA accepts digital records in PDF, CSV, and Excel formats
- Records must be retained for 6 years from the end of the tax year
- Form T2125 has 21 standardized expense categories with specific line numbers
- Current database structure captures most required fields but needs category mapping

---

## 1. CRA Requirements Summary

### 1.1 Form T2125 Overview

Form T2125 is used by sole proprietors and professionals to report business income and expenses. It's the primary form for self-employed individuals filing personal income tax returns (T1).

**Key Form Sections:**
- **Part 1:** Identification (Business name, industry code, fiscal period)
- **Part 2:** Income (Gross income, returns, net income)
- **Part 3:** Cost of Goods Sold (for product-based businesses)
- **Part 4:** Expenses (21 standardized expense categories)
- **Part 5:** Business-Use-of-Home Expenses
- **Part 6:** Capital Cost Allowance (Depreciation)

### 1.2 CRA Expense Categories (Part 4)

| Line # | Category | CRA Requirements | Notes |
|--------|----------|------------------|-------|
| **8521** | Advertising | Promotional costs | Websites, business cards, ads |
| **8523** | Meals & Entertainment | 50% deductible | Must track allowable portion |
| **8590** | Bad Debts | Uncollectible receivables | Only if previously included in income |
| **8690** | Insurance | Business premiums | Property, liability, malpractice |
| **8710** | Interest & Bank Charges | Financial fees | Business loans, credit card fees |
| **8760** | Business Taxes, Licences & Memberships | Professional fees | Annual licenses, memberships |
| **8810** | Office Expenses | General office costs | Not stationery (use 8811) |
| **8811** | Office Stationery & Supplies | Paper goods | Pens, paper, printer supplies |
| **8860** | Professional Fees | Legal, accounting | Includes tax preparation |
| **8871** | Management & Administration Fees | Business management | Consulting, bookkeeping |
| **8910** | Rent | Business premises | Office, warehouse, studio |
| **8960** | Repairs & Maintenance | Property upkeep | Repairs (not improvements) |
| **9060** | Salaries, Wages & Benefits | Employee compensation | Excludes owner's salary |
| **9180** | Property Taxes | Real estate taxes | Business property only |
| **9200** | Travel Expenses | Business travel | Airfare, hotels, car rental |
| **9220** | Utilities | Phone, internet, electricity | Business portion only |
| **9224** | Fuel Costs | Non-vehicle fuel | Heating oil, generator fuel |
| **9275** | Delivery, Freight & Express | Shipping costs | Courier, postage |
| **9281** | Motor Vehicle Expenses | Gas, insurance, repairs | Business % of personal vehicle |
| **9936** | Capital Cost Allowance | Asset depreciation | See Schedule 8 (CCA) |
| **9270** | Other Expenses | Miscellaneous | Must specify in detail |

### 1.3 Non-Deductible Expenses

The following **cannot** be deducted:
- Personal expenses (including personal portion of mixed-use)
- Owner's salary or drawings
- Charitable donations (claim separately on T1)
- Most fines and penalties
- Cost of goods used by family
- Capital expenses (use CCA instead)

### 1.4 Digital Record Requirements

**Format Acceptance:**
- ✓ PDF (most common and accessible)
- ✓ CSV (for spreadsheets)
- ✓ Excel/XLSX
- ✓ Scanned images (must remain readable)

**Retention Period:**
- 6 years from the end of the last tax year

**Electronic Record Standards:**
- Must remain accessible and readable by CRA software
- Must be decrypted if encrypted
- Backup copies should be stored at alternate location
- Must be producible upon CRA request

**Required Receipt Information:**
- Vendor name and address
- Date of transaction
- Description of goods/services
- Total cost including taxes
- GST/HST breakdown (if applicable)

---

## 2. Current Database Structure Analysis

### 2.1 Transactions Table (Core Data)

**Currently Tracked:**
```typescript
{
  id: UUID
  user_id: UUID
  date: DATE                    // ✓ Required for CRA
  amount: NUMERIC               // ✓ Required for CRA
  description: TEXT             // ✓ Required for CRA
  merchant: TEXT                // ✓ Required for CRA (vendor)
  category_id: UUID             // ✓ Maps to CRA categories
  tags: TEXT[]                  // ○ Optional metadata
  notes: TEXT                   // ○ Optional notes
  is_deductible: BOOLEAN        // ✓ Critical for filtering
  status: ENUM                  // ○ Internal workflow
  plaid_transaction_id: TEXT    // ○ Bank integration
  plaid_account_id: TEXT        // ○ Bank integration
  bank_connection_id: UUID      // ○ Bank integration
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

**Legend:**
- ✓ = Required for CRA export
- ○ = Optional/internal use

### 2.2 Categories Table

**Default Categories (17):**
1. Business Travel
2. Meals & Entertainment
3. Office Supplies
4. Software & Subscriptions
5. Marketing & Advertising
6. Professional Services
7. Equipment & Hardware
8. Utilities
9. Rent & Facilities
10. Education & Training
11. Insurance
12. Shipping & Postage
13. Groceries
14. Transportation
15. Healthcare
16. Personal
17. Miscellaneous

**Gap Analysis:**
- ⚠️ No direct mapping to T2125 line numbers
- ⚠️ Some categories combine multiple CRA lines (e.g., "Office Supplies" could be 8810 or 8811)
- ⚠️ Missing categories: Bad Debts (8590), Interest & Bank Charges (8710), Property Taxes (9180), Fuel Costs (9224)

### 2.3 Receipts Table (Supporting Documentation)

**Currently Tracked:**
```typescript
{
  id: UUID
  user_id: UUID
  transaction_id: UUID          // ✓ Links to transaction
  file_name: TEXT               // ✓ Required for record keeping
  file_size: INTEGER
  file_type: TEXT               // ✓ Format validation
  storage_path: TEXT            // ✓ Retrieval
  thumbnail_path: TEXT
  upload_date: TIMESTAMP        // ✓ Audit trail
  notes: TEXT

  // OCR Extracted Data:
  merchant: TEXT                // ✓ Vendor information
  date: DATE                    // ✓ Transaction date
  total: NUMERIC                // ✓ Amount
  subtotal: NUMERIC             // ○ Pre-tax amount
  tax: NUMERIC                  // ✓ GST/HST tracking
  tip: NUMERIC                  // ○ Optional
  items: JSONB[]                // ○ Line items
  paymentMethod: TEXT           // ○ Optional
  confidence: INTEGER           // ○ OCR quality
}
```

---

## 3. Export Structure Recommendations

### 3.1 Primary Export Format: CSV

**Rationale:**
- Universal compatibility (Excel, Google Sheets, tax software)
- Easy to parse and validate
- Human-readable
- Lightweight file size
- Accountant-friendly

### 3.2 Recommended CSV Structure

#### **Option A: CRA Line-Item Format** (Recommended)

**File:** `expenses_export_YYYY.csv`

| Column | Data Type | Description | Example |
|--------|-----------|-------------|---------|
| transaction_id | UUID | Internal reference | `a1b2c3d4-...` |
| date | DATE | Transaction date | `2025-03-15` |
| cra_line_number | TEXT | T2125 line number | `8521` |
| cra_category | TEXT | T2125 category name | `Advertising` |
| merchant | TEXT | Vendor name | `Google Ads` |
| description | TEXT | Expense description | `Online advertising campaign` |
| amount | DECIMAL(10,2) | Transaction amount | `125.00` |
| gst_hst | DECIMAL(10,2) | Tax amount | `16.25` |
| total_amount | DECIMAL(10,2) | Amount + tax | `141.25` |
| is_deductible | BOOLEAN | Tax deductible flag | `TRUE` |
| deductible_percentage | INTEGER | % deductible (for mixed-use) | `100` |
| deductible_amount | DECIMAL(10,2) | Calculated deductible | `141.25` |
| has_receipt | BOOLEAN | Receipt attached | `TRUE` |
| receipt_filename | TEXT | Receipt file reference | `receipt_2025-03-15_001.pdf` |
| notes | TEXT | Additional notes | `Q1 marketing campaign` |
| payment_method | TEXT | Payment type | `Credit Card` |
| tags | TEXT | Comma-separated tags | `marketing,online,paid-ads` |

**Sample Data:**
```csv
transaction_id,date,cra_line_number,cra_category,merchant,description,amount,gst_hst,total_amount,is_deductible,deductible_percentage,deductible_amount,has_receipt,receipt_filename,notes,payment_method,tags
a1b2c3d4,2025-03-15,8521,Advertising,Google Ads,Online advertising campaign,125.00,16.25,141.25,TRUE,100,141.25,TRUE,receipt_2025-03-15_001.pdf,Q1 marketing campaign,Credit Card,marketing|online
b2c3d4e5,2025-03-18,8523,Meals & Entertainment,Starbucks,Client meeting coffee,35.00,4.55,39.55,TRUE,50,19.78,TRUE,receipt_2025-03-18_002.pdf,Meeting with John,Credit Card,meals|client-meeting
c3d4e5f6,2025-03-22,9220,Utilities,Rogers,Internet service - March,89.99,11.70,101.69,TRUE,100,101.69,FALSE,,Home office internet,Bank Transfer,utilities|internet
```

#### **Option B: Summary by Category Format** (Supplementary)

**File:** `expenses_summary_YYYY.csv`

| Column | Data Type | Description | Example |
|--------|-----------|-------------|---------|
| cra_line_number | TEXT | T2125 line number | `8521` |
| cra_category | TEXT | Category name | `Advertising` |
| transaction_count | INTEGER | # of transactions | `12` |
| total_amount | DECIMAL(10,2) | Total for category | `2,450.00` |
| gst_hst_total | DECIMAL(10,2) | Total tax | `318.50` |
| deductible_amount | DECIMAL(10,2) | Total deductible | `2,768.50` |
| receipt_count | INTEGER | # with receipts | `10` |
| notes | TEXT | Summary notes | `Q1-Q4 digital marketing` |

**Sample Data:**
```csv
cra_line_number,cra_category,transaction_count,total_amount,gst_hst_total,deductible_amount,receipt_count,notes
8521,Advertising,12,2450.00,318.50,2768.50,10,Q1-Q4 digital marketing
8523,Meals & Entertainment,45,1850.00,240.50,1045.25,38,50% deduction applied
9220,Utilities,12,1079.88,140.38,1220.26,12,Internet and phone
9200,Travel Expenses,8,3250.00,422.50,3672.50,8,Client visits
```

### 3.3 Secondary Export Format: Excel (XLSX)

**Structure:** Multi-sheet workbook

**Sheet 1: Expense Details**
- Same columns as CSV Option A
- Formatted with currency symbols
- Color-coded by category
- Conditional formatting for missing receipts

**Sheet 2: Category Summary**
- Same as CSV Option B
- Pivot table ready
- Chart showing expenses by category

**Sheet 3: Monthly Breakdown**
- Rows: Categories
- Columns: Jan, Feb, Mar, ..., Dec, Total
- Cell values: Sum of expenses per month

**Sheet 4: Tax Summary**
- Total deductible expenses
- Total non-deductible expenses
- GST/HST breakdown
- Meals & Entertainment adjustment (50% rule)

**Sheet 5: Missing Documentation**
- List of transactions without receipts
- Flagged for review

### 3.4 Tertiary Export Format: PDF Report

**Structure:** Multi-page professional report

**Page 1: Cover Page**
- Tax year
- User name and business details
- Report generation date
- Summary statistics

**Pages 2-N: Expense Details**
- Table format by category
- Each category section includes:
  - Line number and name
  - List of transactions
  - Subtotal for category
  - Supporting receipt thumbnails (optional)

**Last Page: Summary & Totals**
- Total expenses by category
- Pie chart visualization
- Deductible vs. non-deductible breakdown
- Notes and disclaimers

---

## 4. Category Mapping: Current to CRA

### 4.1 Recommended Mapping Table

| Current Category | CRA Line | CRA Category | Notes |
|------------------|----------|--------------|-------|
| Business Travel | 9200 | Travel Expenses | Direct match |
| Meals & Entertainment | 8523 | Meals & Entertainment | Apply 50% rule |
| Office Supplies | 8811 | Office Stationery & Supplies | Default mapping |
| Software & Subscriptions | 8810 | Office Expenses | Or 9270 if specialized |
| Marketing & Advertising | 8521 | Advertising | Direct match |
| Professional Services | 8860 | Professional Fees | Legal, accounting, consulting |
| Equipment & Hardware | 9936 | Capital Cost Allowance | If > $500, else 8810 |
| Utilities | 9220 | Utilities | Phone, internet, electricity |
| Rent & Facilities | 8910 | Rent | Direct match |
| Education & Training | 9270 | Other Expenses | Specify "Professional development" |
| Insurance | 8690 | Insurance | Business insurance only |
| Shipping & Postage | 9275 | Delivery, Freight & Express | Direct match |
| Transportation | 9281 | Motor Vehicle Expenses | Or 9200 for public transit |
| **NEW NEEDED** | 8590 | Bad Debts | Add category |
| **NEW NEEDED** | 8710 | Interest & Bank Charges | Add category |
| **NEW NEEDED** | 8760 | Business Taxes, Licences & Memberships | Add category |
| **NEW NEEDED** | 8871 | Management & Administration Fees | Add category |
| **NEW NEEDED** | 8960 | Repairs & Maintenance | Add category |
| **NEW NEEDED** | 9060 | Salaries, Wages & Benefits | Add category |
| **NEW NEEDED** | 9180 | Property Taxes | Add category |
| **NEW NEEDED** | 9224 | Fuel Costs (non-vehicle) | Add category |
| Groceries | N/A | Non-deductible | Exclude from export (unless home office food) |
| Healthcare | N/A | Non-deductible | Personal expense |
| Personal | N/A | Non-deductible | Exclude from export |
| Miscellaneous | 9270 | Other Expenses | Specify in description |

### 4.2 Implementation: Add CRA Mapping to Categories Table

**SQL Migration:**
```sql
ALTER TABLE categories
ADD COLUMN cra_line_number TEXT,
ADD COLUMN cra_category_name TEXT,
ADD COLUMN deductible_percentage INTEGER DEFAULT 100,
ADD COLUMN requires_special_handling BOOLEAN DEFAULT FALSE,
ADD COLUMN handling_notes TEXT;

-- Example update:
UPDATE categories
SET
  cra_line_number = '8523',
  cra_category_name = 'Meals & Entertainment',
  deductible_percentage = 50,
  requires_special_handling = TRUE,
  handling_notes = 'Only 50% of meals and entertainment expenses are deductible'
WHERE name = 'Meals & Entertainment';
```

---

## 5. Required Fields for CRA Export

### 5.1 Mandatory Fields

| Field | Source | Validation |
|-------|--------|------------|
| **Transaction Date** | `transactions.date` | Must be within tax year (Jan 1 - Dec 31) |
| **Amount** | `transactions.amount` | Must be > 0 |
| **Description** | `transactions.description` | Required, max 500 chars |
| **Merchant/Vendor** | `transactions.merchant` OR `receipts.merchant` | At least one required |
| **CRA Category** | `categories.cra_line_number` | Must map to valid T2125 line |
| **Deductible Flag** | `transactions.is_deductible` | TRUE/FALSE |

### 5.2 Recommended Fields

| Field | Source | Purpose |
|-------|--------|---------|
| **GST/HST Amount** | `receipts.tax` | For Input Tax Credit (ITC) claims |
| **Receipt Attachment** | `receipts.storage_path` | CRA audit support |
| **Payment Method** | `receipts.paymentMethod` OR manual | Audit trail |
| **Business Use %** | User input (new field) | For mixed-use expenses |
| **Notes** | `transactions.notes` | Additional context |

### 5.3 Optional Fields (Value-Add)

| Field | Source | Purpose |
|-------|--------|---------|
| **Tags** | `transactions.tags` | Filtering and reporting |
| **Project/Client** | New field | Job costing |
| **Invoice Number** | New field | Professional services tracking |
| **Odometer Readings** | New field | Vehicle expense substantiation |

---

## 6. Export Feature Requirements

### 6.1 User Interface

**Export Options Page:**
```
┌─────────────────────────────────────────────┐
│  Export Expenses for Tax Filing             │
├─────────────────────────────────────────────┤
│                                             │
│  Tax Year:  [2025 ▼]                       │
│                                             │
│  Date Range:                                │
│  From: [Jan 1, 2025]  To: [Dec 31, 2025]  │
│                                             │
│  Include:                                   │
│  ☑ Deductible expenses only                │
│  ☐ All expenses (deductible + personal)    │
│  ☑ Transactions with receipts              │
│  ☑ Transactions without receipts           │
│                                             │
│  Export Format:                             │
│  ○ CSV - Detailed (recommended)            │
│  ○ CSV - Summary                           │
│  ○ Excel Workbook (multi-sheet)            │
│  ○ PDF Report (printable)                  │
│                                             │
│  Options:                                   │
│  ☑ Include receipt images (PDF only)       │
│  ☑ Apply 50% meals deduction automatically │
│  ☑ Include GST/HST breakdown               │
│                                             │
│  [Preview Export]  [Generate Export]       │
└─────────────────────────────────────────────┘
```

### 6.2 Export Logic Flow

```
1. USER SELECTS EXPORT OPTIONS
   ↓
2. VALIDATE DATE RANGE
   - Must be valid tax year (Jan 1 - Dec 31)
   - Warn if future dates included
   ↓
3. FETCH TRANSACTIONS
   - Filter by date range
   - Filter by is_deductible if selected
   - Include category mapping (JOIN categories)
   - Include receipt metadata (LEFT JOIN receipts)
   ↓
4. APPLY BUSINESS RULES
   - Calculate meals & entertainment 50% deduction
   - Calculate business-use percentage for mixed expenses
   - Sum by CRA category
   - Flag missing receipts
   - Calculate GST/HST totals
   ↓
5. GENERATE EXPORT FILE
   - CSV: Format as specified in Section 3.2
   - Excel: Create multi-sheet workbook
   - PDF: Generate professional report
   ↓
6. DOWNLOAD/EMAIL TO USER
   - Option 1: Direct download
   - Option 2: Email with secure link
   - Option 3: Save to Supabase Storage (retain for 6 years)
```

### 6.3 Backend API Structure

**Endpoint:** `POST /api/exports/generate`

**Request Body:**
```typescript
{
  userId: string;
  taxYear: number;           // e.g., 2025
  startDate?: string;        // Optional custom range (YYYY-MM-DD)
  endDate?: string;          // Optional custom range (YYYY-MM-DD)
  format: "csv" | "csv-summary" | "xlsx" | "pdf";
  includeNonDeductible: boolean;
  requireReceipts: boolean;
  options: {
    includeReceiptImages: boolean;    // PDF only
    applyMealsDeduction: boolean;     // Auto-apply 50% rule
    includeGSTBreakdown: boolean;
  }
}
```

**Response:**
```typescript
{
  success: boolean;
  exportId: string;
  fileName: string;
  fileUrl: string;           // Supabase Storage URL
  expiresAt: string;         // ISO 8601 timestamp (24-hour expiry)
  summary: {
    totalTransactions: number;
    totalAmount: number;
    deductibleAmount: number;
    categoryBreakdown: {
      lineNumber: string;
      categoryName: string;
      amount: number;
    }[];
    warnings: string[];      // e.g., "12 transactions missing receipts"
  }
}
```

---

## 7. Implementation Roadmap

### Phase 1: Data Structure Updates (Week 1)

**Tasks:**
1. Add CRA mapping fields to categories table
   - `cra_line_number`
   - `cra_category_name`
   - `deductible_percentage`
   - `requires_special_handling`
   - `handling_notes`

2. Update default categories with CRA mappings

3. Add missing CRA categories:
   - Bad Debts (8590)
   - Interest & Bank Charges (8710)
   - Business Taxes, Licences & Memberships (8760)
   - Management & Administration Fees (8871)
   - Repairs & Maintenance (8960)
   - Salaries, Wages & Benefits (9060)
   - Property Taxes (9180)
   - Fuel Costs (9224)

4. Add new transaction fields (optional):
   - `business_use_percentage` (for mixed-use expenses)
   - `gst_hst_amount` (if not already extracting from OCR)

### Phase 2: Export Logic Implementation (Week 2)

**Tasks:**
1. Create export service (`lib/export-service.ts`)
   - Transaction fetching with filters
   - Category mapping logic
   - Meals & Entertainment 50% calculation
   - GST/HST aggregation
   - Receipt linking

2. Implement CSV generation
   - Detailed format (Option A)
   - Summary format (Option B)

3. Implement Excel generation
   - Use library: `exceljs` or `xlsx`
   - Multi-sheet workbook
   - Formatting and charts

4. Implement PDF generation
   - Use library: `jsPDF` or `pdfmake`
   - Professional report layout
   - Optional receipt thumbnails

### Phase 3: API Endpoints (Week 2)

**Tasks:**
1. Create `/api/exports/generate` endpoint
   - Accept request parameters
   - Validate inputs
   - Call export service
   - Upload to Supabase Storage
   - Return download URL

2. Create `/api/exports/preview` endpoint
   - Return summary statistics
   - Show category breakdown
   - Flag warnings (missing receipts, etc.)

3. Create `/api/exports/[exportId]` endpoint
   - Retrieve previously generated export
   - Check expiration
   - Re-generate if expired

### Phase 4: Frontend UI (Week 3)

**Tasks:**
1. Create Export page (`app/exports/page.tsx`)
   - Form for selecting options
   - Date range picker
   - Format selection
   - Preview button
   - Generate button

2. Create Export preview modal
   - Show summary statistics
   - Category breakdown table
   - Warnings list
   - Confirm and download

3. Add Export link to Dashboard
   - Navigation item
   - Quick export button (current tax year CSV)

4. Create Export history page (optional)
   - List of previously generated exports
   - Re-download capability
   - Expired exports can be regenerated

### Phase 5: Testing & Validation (Week 4)

**Tasks:**
1. Unit tests for export service
   - Test category mapping
   - Test 50% meals calculation
   - Test GST/HST aggregation
   - Test date filtering

2. Integration tests for API endpoints
   - Test CSV generation
   - Test Excel generation
   - Test PDF generation
   - Test error handling

3. User acceptance testing
   - Generate sample exports
   - Validate with accountant
   - Test with tax software import

4. Documentation
   - User guide for exports
   - Accountant guide
   - FAQ for common issues

---

## 8. Libraries & Tools

### 8.1 CSV Generation
- **Native JavaScript:** `Array.map()` + `join()` (no library needed)
- **Pros:** Lightweight, no dependencies
- **Cons:** Manual escaping required

### 8.2 Excel Generation
- **Option 1: `exceljs`** (Recommended)
  - Full-featured Excel library
  - Supports formatting, charts, formulas
  - Active maintenance
  - Size: ~1.5MB

- **Option 2: `xlsx` (SheetJS)**
  - Popular, lightweight
  - Good for simple exports
  - Limited formatting
  - Size: ~700KB

```bash
npm install exceljs
```

### 8.3 PDF Generation
- **Option 1: `jsPDF`** (Simple)
  - Lightweight
  - Good for basic reports
  - Limited layout control
  - Size: ~200KB

- **Option 2: `pdfmake`** (Recommended)
  - Declarative API
  - Advanced layouts
  - Tables, images, styling
  - Size: ~500KB

```bash
npm install pdfmake
```

### 8.4 Date Handling
- **`date-fns`** (Already in project)
  - Format dates for export
  - Calculate tax year boundaries
  - Date range validation

---

## 9. Sample Code Snippets

### 9.1 Category Mapping Service

```typescript
// lib/services/category-mapping.ts

export interface CRACategory {
  lineNumber: string;
  name: string;
  deductiblePercentage: number;
  requiresSpecialHandling: boolean;
}

export const CRA_CATEGORIES: Record<string, CRACategory> = {
  "8521": {
    lineNumber: "8521",
    name: "Advertising",
    deductiblePercentage: 100,
    requiresSpecialHandling: false,
  },
  "8523": {
    lineNumber: "8523",
    name: "Meals & Entertainment",
    deductiblePercentage: 50,
    requiresSpecialHandling: true,
  },
  // ... all 21 categories
};

export function getCRACategory(categoryId: string): CRACategory | null {
  // Fetch from database with mapping
  // Return CRA category info
}

export function calculateDeductibleAmount(
  amount: number,
  categoryLineNumber: string
): number {
  const category = CRA_CATEGORIES[categoryLineNumber];
  if (!category) return amount;

  return amount * (category.deductiblePercentage / 100);
}
```

### 9.2 CSV Export Generator

```typescript
// lib/services/csv-export.ts

import { format } from "date-fns";

export interface ExportTransaction {
  id: string;
  date: Date;
  craLineNumber: string;
  craCategory: string;
  merchant: string;
  description: string;
  amount: number;
  gstHst: number;
  totalAmount: number;
  isDeductible: boolean;
  deductiblePercentage: number;
  deductibleAmount: number;
  hasReceipt: boolean;
  receiptFilename?: string;
  notes?: string;
  paymentMethod?: string;
  tags?: string[];
}

export function generateDetailedCSV(
  transactions: ExportTransaction[]
): string {
  const headers = [
    "transaction_id",
    "date",
    "cra_line_number",
    "cra_category",
    "merchant",
    "description",
    "amount",
    "gst_hst",
    "total_amount",
    "is_deductible",
    "deductible_percentage",
    "deductible_amount",
    "has_receipt",
    "receipt_filename",
    "notes",
    "payment_method",
    "tags",
  ];

  const rows = transactions.map((tx) => [
    tx.id,
    format(tx.date, "yyyy-MM-dd"),
    tx.craLineNumber,
    tx.craCategory,
    escapeCSV(tx.merchant),
    escapeCSV(tx.description),
    tx.amount.toFixed(2),
    tx.gstHst.toFixed(2),
    tx.totalAmount.toFixed(2),
    tx.isDeductible ? "TRUE" : "FALSE",
    tx.deductiblePercentage.toString(),
    tx.deductibleAmount.toFixed(2),
    tx.hasReceipt ? "TRUE" : "FALSE",
    tx.receiptFilename || "",
    escapeCSV(tx.notes || ""),
    tx.paymentMethod || "",
    tx.tags?.join("|") || "",
  ]);

  return [headers, ...rows].map((row) => row.join(",")).join("\n");
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
```

### 9.3 Export API Endpoint

```typescript
// app/api/exports/generate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { generateDetailedCSV } from "@/lib/services/csv-export";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request
    const body = await request.json();
    const { taxYear, format, includeNonDeductible, options } = body;

    // Fetch transactions with category mappings
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select(`
        *,
        category:categories(
          cra_line_number,
          cra_category_name,
          deductible_percentage
        ),
        receipts(file_name, storage_path, tax)
      `)
      .eq("user_id", user.id)
      .gte("date", `${taxYear}-01-01`)
      .lte("date", `${taxYear}-12-31`)
      .eq("is_deductible", includeNonDeductible ? undefined : true)
      .order("date", { ascending: true });

    if (txError) throw txError;

    // Transform data for export
    const exportData = transactions.map((tx) => ({
      id: tx.id,
      date: new Date(tx.date),
      craLineNumber: tx.category?.cra_line_number || "9270",
      craCategory: tx.category?.cra_category_name || "Other Expenses",
      merchant: tx.merchant || "Unknown",
      description: tx.description,
      amount: parseFloat(tx.amount),
      gstHst: tx.receipts?.[0]?.tax || 0,
      totalAmount: parseFloat(tx.amount) + (tx.receipts?.[0]?.tax || 0),
      isDeductible: tx.is_deductible,
      deductiblePercentage: tx.category?.deductible_percentage || 100,
      deductibleAmount:
        parseFloat(tx.amount) *
        ((tx.category?.deductible_percentage || 100) / 100),
      hasReceipt: tx.receipts && tx.receipts.length > 0,
      receiptFilename: tx.receipts?.[0]?.file_name,
      notes: tx.notes,
      paymentMethod: null,
      tags: tx.tags,
    }));

    // Generate CSV
    const csvContent = generateDetailedCSV(exportData);
    const fileName = `expenses_export_${taxYear}.csv`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("exports")
      .upload(`${user.id}/${fileName}`, csvContent, {
        contentType: "text/csv",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL (or signed URL with expiry)
    const { data: urlData } = supabase.storage
      .from("exports")
      .createSignedUrl(`${user.id}/${fileName}`, 86400); // 24 hours

    return NextResponse.json({
      success: true,
      fileName,
      fileUrl: urlData?.signedUrl,
      summary: {
        totalTransactions: exportData.length,
        totalAmount: exportData.reduce((sum, tx) => sum + tx.totalAmount, 0),
        deductibleAmount: exportData.reduce(
          (sum, tx) => sum + tx.deductibleAmount,
          0
        ),
      },
    });
  } catch (error) {
    console.error("Export generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate export" },
      { status: 500 }
    );
  }
}
```

---

## 10. Key Recommendations

### 10.1 Must-Have Features
1. ✅ **CSV export with CRA line item mapping** (Option A)
2. ✅ **Automatic 50% meals & entertainment deduction**
3. ✅ **GST/HST breakdown**
4. ✅ **Receipt attachment tracking**
5. ✅ **Date range filtering (tax year)**
6. ✅ **Deductible vs. non-deductible filtering**

### 10.2 Should-Have Features
1. ⭐ Excel multi-sheet export with charts
2. ⭐ PDF professional report
3. ⭐ Category summary export (Option B)
4. ⭐ Missing receipt warnings
5. ⭐ Export history and re-download

### 10.3 Nice-to-Have Features
1. 💡 Direct integration with tax software (TurboTax, UFile)
2. 💡 Email export to accountant
3. 💡 Multi-year comparison report
4. 💡 Expense forecasting for next year
5. 💡 Automated quarterly export reminders

### 10.4 Data Integrity Recommendations
1. Add database constraints for required fields
2. Validate CRA category mappings on transaction creation
3. Run monthly data quality checks (missing categories, invalid dates)
4. Archive exports for 6+ years in Supabase Storage
5. Implement export audit trail (who exported what, when)

---

## 11. Next Steps

1. **Review & Approve** this research document
2. **Database Migration** - Add CRA mapping fields to categories table
3. **Category Setup** - Map existing categories and add missing ones
4. **CSV Export Implementation** - Start with detailed format (Option A)
5. **API Development** - Build `/api/exports/generate` endpoint
6. **UI Development** - Create export options page
7. **Testing** - Validate exports with sample data and accountant review
8. **Documentation** - User guide and help articles

---

## 12. References

- [CRA Form T2125](https://www.canada.ca/en/revenue-agency/services/forms-publications/forms/t2125.html)
- [CRA Expense Guidelines](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/report-business-income-expenses/completing-form-t2125/expenses-section-form-t2125.html)
- [CRA Record Keeping Requirements](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/keeping-records.html)
- [Guide T4002 - Business Income](https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4002/t4002-5.html)

---

**Document Prepared By:** Claude Code AI Assistant
**Date:** November 12, 2025
**Status:** ✅ Ready for Review
