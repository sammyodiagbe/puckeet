# Backend Architecture Plan - Puckeet

## Overview
This document outlines the backend architecture for Puckeet, a tax-ready expense tracking application with Clerk authentication and Plaid bank integration.

## Technology Stack

### Core Technologies
- **Runtime**: Node.js with Next.js API Routes
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma or Drizzle ORM
- **Authentication**: Clerk (already integrated)
- **Bank Integration**: Plaid (already integrated on frontend)
- **File Storage**: Supabase Storage (for receipt images)
- **Hosting**: Vercel (Next.js) + Supabase

### Additional Services
- **Caching**: Redis (optional, for rate limiting & session caching)
- **Queue System**: BullMQ (optional, for async tasks like bank syncs)
- **Email**: Resend or SendGrid (for notifications)

---

## Database Schema

### Users Table
**Note**: Primary user data comes from Clerk. This table stores app-specific user settings.

```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,  -- Clerk user ID
  email VARCHAR(255) NOT NULL UNIQUE,
  subscription_tier VARCHAR(20) DEFAULT 'free', -- free, premium, enterprise
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
```

### Transactions Table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  merchant VARCHAR(255),
  category_id UUID REFERENCES categories(id),
  tags TEXT[], -- Array of tags
  notes TEXT,
  is_deductible BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'pending', -- pending, categorized, reviewed

  -- Plaid integration fields
  plaid_transaction_id VARCHAR(255) UNIQUE,
  plaid_account_id VARCHAR(255),
  bank_connection_id UUID REFERENCES bank_connections(id) ON DELETE SET NULL,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_plaid_id ON transactions(plaid_transaction_id);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
```

### Receipts Table
```sql
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,

  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  storage_path TEXT NOT NULL, -- Path in Supabase Storage
  thumbnail_path TEXT,

  upload_date TIMESTAMP DEFAULT NOW(),
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_receipts_user_id ON receipts(user_id);
CREATE INDEX idx_receipts_transaction_id ON receipts(transaction_id);
CREATE INDEX idx_receipts_upload_date ON receipts(upload_date);
```

### Categories Table
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE, -- NULL for default categories
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) NOT NULL, -- Hex color code
  icon VARCHAR(50),
  description TEXT,
  is_default BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Ensure unique category names per user (including default categories)
  CONSTRAINT unique_category_per_user UNIQUE (user_id, name)
);

-- Indexes
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_is_default ON categories(is_default);
```

### Bank Connections Table
```sql
CREATE TABLE bank_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Plaid data
  plaid_item_id VARCHAR(255) NOT NULL UNIQUE,
  plaid_access_token TEXT NOT NULL, -- Encrypted
  plaid_account_id VARCHAR(255) NOT NULL,

  -- Institution info
  institution_id VARCHAR(255) NOT NULL,
  institution_name VARCHAR(255) NOT NULL,
  institution_logo TEXT,

  -- Account info
  account_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) NOT NULL, -- depository, credit, loan, investment, other
  account_subtype VARCHAR(50) NOT NULL,
  account_mask VARCHAR(4), -- Last 4 digits

  -- Sync status
  status VARCHAR(20) DEFAULT 'connected', -- connected, syncing, error, disconnected
  last_sync_date TIMESTAMP,
  cursor TEXT, -- For incremental transaction sync

  -- Error handling
  error_code VARCHAR(50),
  error_message TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bank_connections_user_id ON bank_connections(user_id);
CREATE INDEX idx_bank_connections_plaid_item_id ON bank_connections(plaid_item_id);
CREATE INDEX idx_bank_connections_status ON bank_connections(status);
```

### Transaction Receipt Links Table (Many-to-Many)
```sql
CREATE TABLE transaction_receipts (
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  linked_at TIMESTAMP DEFAULT NOW(),

  PRIMARY KEY (transaction_id, receipt_id)
);

-- Indexes
CREATE INDEX idx_transaction_receipts_transaction ON transaction_receipts(transaction_id);
CREATE INDEX idx_transaction_receipts_receipt ON transaction_receipts(receipt_id);
```

### Auto-Categorization Rules Table
```sql
CREATE TABLE auto_categorize_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  pattern TEXT NOT NULL, -- Regex pattern
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Higher priority rules run first

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_auto_rules_user_id ON auto_categorize_rules(user_id);
CREATE INDEX idx_auto_rules_enabled ON auto_categorize_rules(enabled);
CREATE INDEX idx_auto_rules_priority ON auto_categorize_rules(priority DESC);
```

### Audit Log Table (Optional but recommended)
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, EXPORT, etc.
  entity_type VARCHAR(50) NOT NULL, -- transaction, receipt, bank_connection, etc.
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

---

## API Endpoints Structure

### Authentication Endpoints
All endpoints require Clerk authentication middleware. Clerk provides the user ID in the request.

```
Middleware: authenticateUser()
- Verifies Clerk session token
- Extracts user ID from Clerk
- Attaches user to request object
```

### Transaction Endpoints

```
POST   /api/transactions              - Create new transaction
GET    /api/transactions              - Get all user transactions (with filters)
GET    /api/transactions/:id          - Get single transaction
PATCH  /api/transactions/:id          - Update transaction
DELETE /api/transactions/:id          - Delete transaction
POST   /api/transactions/bulk         - Bulk create/update transactions
DELETE /api/transactions/bulk         - Bulk delete transactions
PATCH  /api/transactions/bulk/categorize - Bulk categorize transactions
```

### Receipt Endpoints

```
POST   /api/receipts/upload           - Upload receipt(s)
GET    /api/receipts                  - Get all user receipts
GET    /api/receipts/:id              - Get single receipt
PATCH  /api/receipts/:id              - Update receipt metadata
DELETE /api/receipts/:id              - Delete receipt
POST   /api/receipts/:id/link         - Link receipt to transaction
DELETE /api/receipts/:id/unlink       - Unlink receipt from transaction
GET    /api/receipts/unlinked         - Get unlinked receipts
```

### Category Endpoints

```
GET    /api/categories                - Get all categories (default + user custom)
POST   /api/categories                - Create custom category
PATCH  /api/categories/:id            - Update custom category
DELETE /api/categories/:id            - Delete custom category
```

### Bank Connection Endpoints (Plaid)

```
POST   /api/plaid/create-link-token   - Generate Plaid Link token for frontend
POST   /api/plaid/exchange-token      - Exchange public token for access token
GET    /api/bank-connections          - Get user's bank connections
POST   /api/bank-connections/:id/sync - Trigger manual sync
DELETE /api/bank-connections/:id      - Disconnect bank account
PATCH  /api/bank-connections/:id      - Update connection settings
POST   /api/plaid/webhook             - Plaid webhook handler
```

### Report/Export Endpoints

```
POST   /api/reports/generate          - Generate report (CSV, JSON, PDF)
GET    /api/reports/summary           - Get financial summary
GET    /api/reports/analytics         - Get spending analytics
```

### User Settings Endpoints

```
GET    /api/user/settings             - Get user settings
PATCH  /api/user/settings             - Update user settings
GET    /api/user/stats                - Get user statistics
```

### Auto-Categorization Rules Endpoints

```
GET    /api/rules                     - Get all rules
POST   /api/rules                     - Create rule
PATCH  /api/rules/:id                 - Update rule
DELETE /api/rules/:id                 - Delete rule
POST   /api/rules/apply               - Apply rules to existing transactions
```

---

## User Flow Diagrams

### 1. User Authentication Flow

```
┌─────────────┐
│   User      │
│  Opens App  │
└──────┬──────┘
       │
       v
┌──────────────────────┐
│  Clerk SDK Checks    │
│  Authentication      │
└──────┬───────────────┘
       │
       ├─── Not Authenticated ──> Redirect to Sign-In Page
       │                                    │
       │                                    v
       │                          ┌─────────────────┐
       │                          │ Clerk Sign-In   │
       │                          │    Widget       │
       │                          └────────┬────────┘
       │                                   │
       └─── Authenticated ────────────────┘
                    │
                    v
       ┌────────────────────────┐
       │ Frontend Syncs User    │
       │ with Local Store       │
       └────────┬───────────────┘
                │
                v
       ┌────────────────────────┐
       │ Check if User Exists   │
       │ in Backend Database    │
       └────────┬───────────────┘
                │
                ├─── Exists ──> Load User Data
                │
                └─── New ──> Create User Record in DB
                                    │
                                    v
                          ┌──────────────────┐
                          │ Initialize Default│
                          │   Categories      │
                          └──────────────────┘
```

### 2. Transaction Creation Flow

```
┌──────────────┐
│   User       │
│ Clicks "Add  │
│ Transaction" │
└──────┬───────┘
       │
       v
┌────────────────────┐
│   Fill Form        │
│ - Date, Amount     │
│ - Category, etc.   │
└────────┬───────────┘
         │
         v
┌─────────────────────┐
│  Submit Form        │
│  (Frontend)         │
└────────┬────────────┘
         │
         v
┌─────────────────────────────┐
│  POST /api/transactions     │
│  with Clerk auth token      │
└────────┬────────────────────┘
         │
         v
┌─────────────────────────────┐
│  Backend Validates:         │
│  - User authenticated       │
│  - Data validation          │
│  - Category exists          │
└────────┬────────────────────┘
         │
         ├─── Valid ──> Insert into Database
         │                     │
         │                     v
         │           ┌──────────────────┐
         │           │ Return Transaction│
         │           │      Data         │
         │           └─────────┬─────────┘
         │                     │
         └─── Invalid ──> Return Error
                               │
                               v
                      ┌─────────────────┐
                      │ Frontend Updates│
                      │   Local Store   │
                      └─────────────────┘
```

### 3. Bank Sync Flow (Plaid Integration)

```
┌──────────────┐
│   User       │
│ Clicks       │
│ "Connect     │
│  Bank"       │
└──────┬───────┘
       │
       v
┌──────────────────────────┐
│ Frontend Calls           │
│ POST /api/plaid/         │
│ create-link-token        │
└──────┬───────────────────┘
       │
       v
┌──────────────────────────┐
│ Backend Creates Plaid    │
│ Link Token (with user_id)│
└──────┬───────────────────┘
       │
       v
┌──────────────────────────┐
│ Return Token to Frontend │
└──────┬───────────────────┘
       │
       v
┌──────────────────────────┐
│ Plaid Link Widget Opens  │
│ User Selects Bank &      │
│ Authenticates            │
└──────┬───────────────────┘
       │
       v
┌──────────────────────────┐
│ Plaid Returns            │
│ Public Token & Metadata  │
└──────┬───────────────────┘
       │
       v
┌──────────────────────────┐
│ Frontend Calls           │
│ POST /api/plaid/         │
│ exchange-token           │
│ with public_token        │
└──────┬───────────────────┘
       │
       v
┌──────────────────────────────────┐
│ Backend:                         │
│ 1. Exchange public token         │
│    for access token with Plaid   │
│ 2. Get account details           │
│ 3. Store encrypted access token  │
│ 4. Create bank_connection record │
│ 5. Trigger initial sync          │
└──────┬───────────────────────────┘
       │
       v
┌──────────────────────────────────┐
│ Backend Fetches Transactions     │
│ from Plaid (last 30-90 days)     │
└──────┬───────────────────────────┘
       │
       v
┌──────────────────────────────────┐
│ For Each Plaid Transaction:      │
│ 1. Check if exists (plaid_id)    │
│ 2. Map to our Transaction format │
│ 3. Auto-categorize if possible   │
│ 4. Insert into database          │
└──────┬───────────────────────────┘
       │
       v
┌──────────────────────────────────┐
│ Update bank_connection:          │
│ - last_sync_date                 │
│ - cursor (for next sync)         │
│ - status = 'connected'           │
└──────┬───────────────────────────┘
       │
       v
┌──────────────────────────────────┐
│ Return success + transaction     │
│ count to frontend                │
└──────────────────────────────────┘
```

### 4. Subsequent Bank Sync Flow

```
┌──────────────┐
│   User       │
│ Clicks "Sync"│
│   Button     │
└──────┬───────┘
       │
       v
┌──────────────────────────────────┐
│ POST /api/bank-connections/      │
│      :id/sync                     │
└──────┬───────────────────────────┘
       │
       v
┌──────────────────────────────────┐
│ Backend:                         │
│ 1. Get bank_connection record    │
│ 2. Verify user owns connection   │
│ 3. Update status = 'syncing'     │
└──────┬───────────────────────────┘
       │
       v
┌──────────────────────────────────┐
│ Call Plaid Transactions Sync API │
│ with cursor for incremental sync │
└──────┬───────────────────────────┘
       │
       v
┌──────────────────────────────────┐
│ Plaid Returns:                   │
│ - Added transactions             │
│ - Modified transactions          │
│ - Removed transactions           │
│ - New cursor                     │
└──────┬───────────────────────────┘
       │
       v
┌──────────────────────────────────┐
│ Process Changes:                 │
│ - Insert new transactions        │
│ - Update modified transactions   │
│ - Mark removed as deleted        │
└──────┬───────────────────────────┘
       │
       v
┌──────────────────────────────────┐
│ Update bank_connection:          │
│ - last_sync_date = NOW()         │
│ - cursor = new_cursor            │
│ - status = 'connected'           │
└──────┬───────────────────────────┘
       │
       v
┌──────────────────────────────────┐
│ Return sync results to frontend  │
└──────────────────────────────────┘
```

### 5. Receipt Upload Flow

```
┌──────────────┐
│   User       │
│ Selects File │
│  to Upload   │
└──────┬───────┘
       │
       v
┌──────────────────────────┐
│ Frontend:                │
│ 1. Compress image        │
│ 2. Create thumbnail      │
└──────┬───────────────────┘
       │
       v
┌──────────────────────────┐
│ POST /api/receipts/upload│
│ (multipart/form-data)    │
└──────┬───────────────────┘
       │
       v
┌──────────────────────────────────┐
│ Backend:                         │
│ 1. Validate user authenticated   │
│ 2. Validate file type/size       │
│ 3. Generate unique filename      │
└──────┬───────────────────────────┘
       │
       v
┌──────────────────────────────────┐
│ Upload to Supabase Storage:      │
│ - Main image                     │
│ - Thumbnail                      │
└──────┬───────────────────────────┘
       │
       v
┌──────────────────────────────────┐
│ Create receipt record in DB      │
│ with storage paths               │
└──────┬───────────────────────────┘
       │
       v
┌──────────────────────────────────┐
│ Return receipt data to frontend  │
└──────────────────────────────────┘
```

---

## Data Migration Strategy

### Moving from Local Storage to Database

1. **Phase 1: Parallel Mode**
   - Frontend continues using Zustand stores
   - Backend API is built and tested
   - Add sync functions to gradually save data to backend

2. **Phase 2: Hybrid Mode**
   - New data goes directly to backend
   - Old data remains in local storage
   - Add migration endpoint to upload local data to backend

3. **Phase 3: Backend-First Mode**
   - All operations hit backend API first
   - Local storage acts as cache only
   - Implement optimistic updates

4. **Phase 4: Full Backend Mode**
   - Remove local persistence
   - Backend is source of truth
   - Local state is session-only

### Migration Endpoint

```typescript
POST /api/migrate/local-data

Body: {
  transactions: Transaction[],
  receipts: Receipt[],
  categories: Category[],
  bankConnections: BankConnection[]
}

Response: {
  success: boolean,
  migrated: {
    transactions: number,
    receipts: number,
    categories: number,
    bankConnections: number
  },
  errors: any[]
}
```

---

## Security Considerations

### Authentication & Authorization
- ✅ Clerk handles authentication
- All API routes require valid Clerk session
- Row-level security: Users can only access their own data
- Validate `user_id` from Clerk token, never from request body

### Data Protection
- Encrypt Plaid access tokens at rest
- Use HTTPS for all API communication
- Implement rate limiting per user
- Sanitize all user inputs
- Use prepared statements for SQL queries

### File Upload Security
- Validate file types (images, PDFs only)
- Limit file size (e.g., 10MB per file)
- Scan for malware (optional: ClamAV)
- Generate unique filenames to prevent overwrites
- Use signed URLs for accessing receipts

### API Security
- CORS: Only allow requests from your domain
- CSRF protection
- Rate limiting: 100 requests/minute per user
- Request validation using Zod schemas
- Audit logging for sensitive operations

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "INVALID_TRANSACTION",
    "message": "Transaction amount must be positive",
    "details": {
      "field": "amount",
      "value": -100
    }
  },
  "timestamp": "2025-01-15T10:30:00Z",
  "requestId": "req_abc123"
}
```

### Common Error Codes
- `UNAUTHORIZED` - Invalid or missing auth token
- `FORBIDDEN` - User doesn't have access to resource
- `NOT_FOUND` - Resource doesn't exist
- `VALIDATION_ERROR` - Invalid request data
- `PLAID_ERROR` - Error from Plaid API
- `STORAGE_ERROR` - File upload/download failed
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `SERVER_ERROR` - Internal server error

---

## Performance Optimization

### Database Optimization
- Implement proper indexes (defined in schema)
- Use database connection pooling
- Implement pagination for list endpoints
- Use database views for complex queries
- Regular VACUUM and ANALYZE for PostgreSQL

### Caching Strategy
- Cache user settings in Redis (TTL: 1 hour)
- Cache category lists (TTL: 24 hours)
- Implement stale-while-revalidate for transaction lists
- Use CDN for static receipt images

### API Optimization
- Implement request/response compression
- Use ETags for conditional requests
- Batch operations where possible
- Implement GraphQL or tRPC for efficient data fetching (optional)

---

## Monitoring & Logging

### Metrics to Track
- API response times
- Database query performance
- Plaid API success rates
- Bank sync success/failure rates
- File upload success rates
- User engagement metrics

### Logging Strategy
- Structured logging (JSON format)
- Log levels: ERROR, WARN, INFO, DEBUG
- Include request IDs for tracing
- Log all Plaid API calls
- Log authentication failures
- Never log sensitive data (tokens, passwords)

### Tools
- Application monitoring: Sentry
- Database monitoring: Supabase built-in
- Uptime monitoring: UptimeRobot or Better Stack
- Analytics: PostHog or Plausible

---

## Deployment Strategy

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://... # For migrations

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Plaid
PLAID_CLIENT_ID=...
PLAID_SECRET=...
PLAID_ENV=sandbox|development|production

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=receipts

# App
NEXT_PUBLIC_APP_URL=https://...
NODE_ENV=production

# Optional
REDIS_URL=...
SENTRY_DSN=...
```

### Deployment Checklist
- [ ] Set up Supabase project
- [ ] Run database migrations
- [ ] Configure Supabase storage bucket
- [ ] Set up Clerk production instance
- [ ] Configure Plaid production credentials
- [ ] Set up environment variables in Vercel
- [ ] Configure custom domain
- [ ] Set up monitoring and alerts
- [ ] Test all API endpoints
- [ ] Run security audit
- [ ] Set up automated backups

---

## Next Steps

### Immediate Actions
1. Set up Supabase project
2. Create database schema (run migrations)
3. Implement authentication middleware
4. Build Transaction CRUD endpoints
5. Build Receipt upload/storage system
6. Update frontend to use API instead of local storage

### Future Enhancements
- **AI-Powered Features**
  - OCR for receipt scanning
  - Automatic transaction categorization using ML
  - Spending predictions and insights

- **Advanced Features**
  - Multi-currency support
  - Recurring transaction detection
  - Tax form generation (1040, Schedule C)
  - Accountant collaboration features
  - Mobile app (React Native)

- **Integrations**
  - QuickBooks export
  - Stripe/PayPal transaction import
  - Google Drive backup
  - Slack/Discord notifications

---

## Questions to Consider

1. **Scale**: Expected number of users in first year?
2. **Storage**: Average receipt size and volume per user?
3. **Budget**: Hosting and service costs acceptable?
4. **Compliance**: Any specific tax/financial regulations to follow?
5. **Features**: Which features are MVP vs. nice-to-have?

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Author**: Backend Architecture Team
