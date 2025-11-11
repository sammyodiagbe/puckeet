# Plaid Integration Setup Guide

This guide will help you set up Plaid integration for automatic bank transaction syncing in Puckeet.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Getting Plaid Credentials](#getting-plaid-credentials)
3. [Configuration](#configuration)
4. [Testing the Integration](#testing-the-integration)
5. [Usage](#usage)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18+ installed
- A Plaid account (free for development)
- Next.js development environment set up

## Getting Plaid Credentials

### 1. Create a Plaid Account

1. Go to [Plaid Dashboard](https://dashboard.plaid.com/signup)
2. Sign up for a free account
3. Complete the registration process

### 2. Get Your API Keys

1. Log in to the [Plaid Dashboard](https://dashboard.plaid.com/)
2. Navigate to **Team Settings** → **Keys**
3. Copy your:
   - **client_id**
   - **sandbox secret** (for testing)
   - **development secret** (for development with real bank data)
   - **production secret** (for production use)

## Configuration

### 1. Create Environment Variables File

Create a `.env.local` file in the root of your project:

```bash
cp .env.example .env.local
```

### 2. Add Your Plaid Credentials

Edit `.env.local` and add your Plaid credentials:

```env
# Plaid API Credentials
PLAID_CLIENT_ID=your_client_id_here
PLAID_SECRET=your_sandbox_secret_here
PLAID_ENV=sandbox

# Next.js App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Environment Options:**
- `sandbox`: For testing with fake credentials (recommended for initial setup)
- `development`: For development with real bank credentials
- `production`: For production use

### 3. Install Dependencies (Already Done)

The required dependencies are already installed:
- `plaid` - Official Plaid Node SDK
- `react-plaid-link` - React component for Plaid Link

## Testing the Integration

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Navigate to Bank Sync Page

Open your browser and go to:
```
http://localhost:3000/settings/bank-sync
```

### 3. Connect a Test Bank Account

1. Click **"Connect Bank Account"**
2. The Plaid Link modal will open
3. Select any bank from the list
4. Use these test credentials for **Sandbox environment**:
   - **Username**: `user_good`
   - **Password**: `pass_good`
5. Select the accounts you want to connect
6. Complete the flow

### 4. Sync Transactions

1. After connecting, you'll see your bank connection in the list
2. Click the **Sync** button (circular arrow icon)
3. Transactions will be imported and added to your Transactions page
4. Check `/transactions` to see the imported transactions

## Usage

### Connecting a Bank Account

```typescript
import { PlaidLink } from "@/components/plaid-link";
import { useUserStore } from "@/lib/stores/user-store";
import { useSyncStore } from "@/lib/stores/sync-store";

function MyComponent() {
  const { user } = useUserStore();
  const { addMultipleBankConnections } = useSyncStore();

  const handleSuccess = (accounts) => {
    // Accounts are automatically added to the sync store
    console.log("Connected accounts:", accounts);
  };

  return (
    <PlaidLink
      userId={user?.id || ""}
      onSuccess={handleSuccess}
      buttonText="Connect Bank"
    />
  );
}
```

### Syncing Transactions

The bank sync page (`/settings/bank-sync`) handles transaction syncing automatically. Here's how it works:

1. **Initial Sync**: When you first connect a bank, no cursor exists, so all available transactions are fetched
2. **Incremental Sync**: Subsequent syncs use the stored cursor to only fetch new/modified transactions
3. **Deduplication**: Transactions are checked for duplicates based on Plaid's transaction_id
4. **Category Mapping**: Plaid categories are automatically mapped to your app's categories

### Manual Sync from Code

```typescript
import { useSyncStore } from "@/lib/stores/sync-store";
import { useTransactionStore } from "@/lib/stores/transaction-store";
import { mapPlaidTransactions, filterDuplicateTransactions } from "@/lib/plaid-utils";

async function syncBankAccount(bankId: string) {
  const { getBankConnection, startSync, finishSync } = useSyncStore.getState();
  const { transactions, addTransaction } = useTransactionStore.getState();

  const connection = getBankConnection(bankId);
  if (!connection) return;

  startSync(bankId);

  try {
    const response = await fetch("/api/plaid/sync-transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessToken: connection.plaidAccessToken,
        cursor: connection.cursor,
        accountId: connection.accountId,
      }),
    });

    const data = await response.json();

    // Map and filter transactions
    const mappedTransactions = mapPlaidTransactions(data.transactions, bankId);
    const newTransactions = filterDuplicateTransactions(transactions, mappedTransactions);

    // Add to store
    newTransactions.forEach((txn) => addTransaction(txn));

    // Update cursor
    finishSync(bankId, true, data.cursor);
  } catch (error) {
    finishSync(bankId, false, undefined, error.message);
  }
}
```

## API Routes

The integration includes three API routes:

### 1. Create Link Token
**POST** `/api/plaid/create-link-token`

Creates a link token for initializing Plaid Link.

**Request:**
```json
{
  "userId": "user_123"
}
```

**Response:**
```json
{
  "link_token": "link-sandbox-xxx",
  "expiration": "2024-01-01T12:00:00Z"
}
```

### 2. Exchange Token
**POST** `/api/plaid/exchange-token`

Exchanges a public token for an access token after successful Link.

**Request:**
```json
{
  "public_token": "public-sandbox-xxx",
  "userId": "user_123"
}
```

**Response:**
```json
{
  "success": true,
  "accounts": [
    {
      "accountId": "xxx",
      "accountName": "Plaid Checking",
      "accountType": "depository",
      "accountSubtype": "checking",
      "mask": "0000",
      "institutionId": "ins_3",
      "institutionName": "Chase",
      "plaidItemId": "item-xxx",
      "plaidAccessToken": "access-sandbox-xxx"
    }
  ]
}
```

### 3. Sync Transactions
**POST** `/api/plaid/sync-transactions`

Syncs transactions from Plaid using cursor-based pagination.

**Request:**
```json
{
  "accessToken": "access-sandbox-xxx",
  "cursor": "optional-cursor-for-incremental-sync",
  "accountId": "optional-account-id-to-filter"
}
```

**Response:**
```json
{
  "success": true,
  "transactions": [...],
  "cursor": "next-cursor",
  "hasMore": false,
  "added": 25,
  "modified": 0,
  "removed": 0
}
```

## Data Flow

```
User clicks "Connect Bank"
    ↓
PlaidLink component requests link_token from API
    ↓
Plaid Link modal opens
    ↓
User authenticates with bank
    ↓
Plaid returns public_token
    ↓
PlaidLink exchanges public_token for access_token
    ↓
Bank connections saved to sync-store
    ↓
User clicks "Sync" button
    ↓
API fetches transactions from Plaid
    ↓
Transactions mapped to app format
    ↓
Duplicates filtered out
    ↓
New transactions added to transaction-store
    ↓
Cursor updated for next sync
```

## Category Mapping

Plaid categories are automatically mapped to your app's categories:

| Plaid Category | App Category |
|---|---|
| Shops, Shopping | Office Supplies |
| Travel, Airlines | Travel |
| Food and Drink, Restaurants | Meals & Entertainment |
| Service, Subscription | Software & Subscriptions |
| Advertising, Marketing | Marketing |
| Automotive, Home Improvement | Equipment |
| Professional Services, Legal, Accounting | Professional Services |

You can customize the mapping in `lib/plaid-utils.ts`.

## Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Use sandbox environment** for development and testing
3. **Rotate secrets regularly** in production
4. **Access tokens are stored in localStorage** - consider encrypting them for production
5. **Implement proper authentication** before allowing bank connections
6. **Use HTTPS** in production (required by Plaid)

## Troubleshooting

### "Plaid is not configured" Error

**Solution:** Make sure you've created `.env.local` with valid credentials:
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

### Link Token Creation Fails

**Possible causes:**
- Invalid `PLAID_CLIENT_ID` or `PLAID_SECRET`
- Network connectivity issues
- Plaid service outage

**Solution:** Check your credentials in the Plaid Dashboard and verify they match your `.env.local` file.

### Transactions Not Syncing

**Possible causes:**
- Invalid access token
- Bank connection is in error state
- No new transactions available

**Solution:**
1. Check the bank connection status in `/settings/bank-sync`
2. Try disconnecting and reconnecting the bank account
3. Check browser console for error messages

### "Invalid Credentials" in Sandbox

**Solution:** Use these test credentials for Sandbox:
- Username: `user_good`
- Password: `pass_good`

For other test scenarios, see [Plaid Sandbox Guide](https://plaid.com/docs/sandbox/test-credentials/).

### Duplicate Transactions

**Solution:** The app automatically filters duplicates based on Plaid's `transaction_id`. If you're seeing duplicates:
1. Clear your localStorage
2. Reconnect your bank account
3. Re-sync transactions

## Production Checklist

Before going to production:

- [ ] Sign up for Plaid production access
- [ ] Update `PLAID_ENV` to `production`
- [ ] Use production secret in `PLAID_SECRET`
- [ ] Update `NEXT_PUBLIC_APP_URL` to your production domain
- [ ] Implement proper user authentication
- [ ] Add database storage for bank connections and access tokens
- [ ] Set up webhook handling for transaction updates
- [ ] Implement proper error handling and logging
- [ ] Add rate limiting to API routes
- [ ] Encrypt sensitive data at rest
- [ ] Set up monitoring and alerts

## Additional Resources

- [Plaid Documentation](https://plaid.com/docs/)
- [Plaid Quickstart Guide](https://plaid.com/docs/quickstart/)
- [Plaid API Reference](https://plaid.com/docs/api/)
- [Plaid Sandbox Testing](https://plaid.com/docs/sandbox/)
- [Plaid Link Documentation](https://plaid.com/docs/link/)

## Support

For issues related to:
- **Puckeet app**: Create an issue in the repository
- **Plaid integration**: Check [Plaid Support](https://support.plaid.com/)
- **Plaid API**: See [Plaid Documentation](https://plaid.com/docs/)
