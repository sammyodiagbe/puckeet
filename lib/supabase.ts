import { createClient } from "@supabase/supabase-js";

// Check if Supabase environment variables are configured
export function isSupabaseConfigured() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing Supabase environment variables. Please add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your .env.local file.\n\n" +
    "You can find these values in your Supabase project settings:\n" +
    "1. Go to https://supabase.com/dashboard\n" +
    "2. Select your project\n" +
    "3. Go to Settings > API\n" +
    "4. Copy 'Project URL' as NEXT_PUBLIC_SUPABASE_URL\n" +
    "5. Copy 'service_role key' as SUPABASE_SERVICE_ROLE_KEY"
  );
}

// Create a Supabase client with service role key for server-side operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Type definitions for database tables
export type Database = {
  users: {
    id: string;
    email: string;
    subscription_tier: string;
    settings: Record<string, any>;
    created_at: string;
    updated_at: string;
  };
  transactions: {
    id: string;
    user_id: string;
    date: string;
    amount: number;
    description: string;
    merchant: string | null;
    category_id: string | null;
    tags: string[] | null;
    notes: string | null;
    is_deductible: boolean;
    status: string;
    plaid_transaction_id: string | null;
    plaid_account_id: string | null;
    bank_connection_id: string | null;
    created_at: string;
    updated_at: string;
  };
  categories: {
    id: string;
    user_id: string | null;
    name: string;
    color: string;
    icon: string | null;
    description: string | null;
    is_default: boolean;
    created_at: string;
    updated_at: string;
  };
  receipts: {
    id: string;
    user_id: string;
    transaction_id: string | null;
    file_name: string;
    file_size: number;
    file_type: string;
    storage_path: string;
    thumbnail_path: string | null;
    upload_date: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };
  bank_connections: {
    id: string;
    user_id: string;
    plaid_item_id: string;
    plaid_access_token: string;
    plaid_account_id: string;
    institution_id: string;
    institution_name: string;
    institution_logo: string | null;
    account_name: string;
    account_type: string;
    account_subtype: string;
    account_mask: string | null;
    status: string;
    last_sync_date: string | null;
    cursor: string | null;
    error_code: string | null;
    error_message: string | null;
    created_at: string;
    updated_at: string;
  };
  auto_categorize_rules: {
    id: string;
    user_id: string;
    name: string;
    pattern: string;
    category_id: string;
    enabled: boolean;
    priority: number;
    created_at: string;
    updated_at: string;
  };
};
