import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { plaidClient, isPlaidConfigured } from "@/lib/plaid-client";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
  ensureUserExists,
} from "@/lib/api-helpers";
import { createClient } from "@/utils/supabase/server";
import { syncTransactionsFromPlaid } from "@/lib/plaid-sync";

/**
 * GET /api/bank-connections
 * Get all bank connections for the user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const { data, error } = await supabaseAdmin
      .from("bank_connections")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to fetch bank connections",
        500,
        error
      );
    }

    // Mask access tokens in response
    const maskedData = data.map((conn) => ({
      ...conn,
      plaid_access_token: "***",
    }));

    return createSuccessResponse({
      connections: maskedData,
      count: maskedData.length,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error fetching bank connections:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}

/**
 * POST /api/bank-connections
 * Create a new bank connection and perform initial sync
 */
export async function POST(request: NextRequest) {
  try {
    if (!isPlaidConfigured()) {
      return createErrorResponse(
        "PLAID_NOT_CONFIGURED",
        "Plaid is not configured",
        500
      );
    }

    const userId = await requireAuth(request);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return createErrorResponse("UNAUTHORIZED", "User not found", 401);
    }

    // Ensure user exists in database
    await ensureUserExists(userId, user.email || "", supabaseAdmin);

    const body = await request.json();
    const { public_token, account_id, metadata } = body;

    if (!public_token || !account_id) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Public token and account ID are required",
        400
      );
    }

    // Exchange public token for access token
    const tokenResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const accessToken = tokenResponse.data.access_token;
    const itemId = tokenResponse.data.item_id;

    // Get institution info
    const itemResponse = await plaidClient.itemGet({
      access_token: accessToken,
    });

    const institutionId = itemResponse.data.item.institution_id;

    // Get institution details
    let institutionName = metadata?.institution?.name || "Unknown Bank";
    let institutionLogo = null;

    if (institutionId) {
      try {
        const institutionResponse = await plaidClient.institutionsGetById({
          institution_id: institutionId,
          country_codes: ["US"] as any,
        });
        institutionName = institutionResponse.data.institution.name;
        institutionLogo = institutionResponse.data.institution.logo || null;
      } catch (e) {
        console.warn("Failed to fetch institution details:", e);
      }
    }

    // Get account information
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const account = accountsResponse.data.accounts.find(
      (acc) => acc.account_id === account_id
    );

    if (!account) {
      return createErrorResponse("NOT_FOUND", "Account not found", 404);
    }

    // Check if connection already exists
    const { data: existing } = await supabaseAdmin
      .from("bank_connections")
      .select("id")
      .eq("plaid_item_id", itemId)
      .eq("plaid_account_id", account_id)
      .single();

    if (existing) {
      return createErrorResponse(
        "DUPLICATE_CONNECTION",
        "This bank account is already connected",
        409
      );
    }

    // Create bank connection record
    const { data: connection, error: connError } = await supabaseAdmin
      .from("bank_connections")
      .insert({
        user_id: userId,
        plaid_item_id: itemId,
        plaid_access_token: accessToken,
        plaid_account_id: account_id,
        institution_id: institutionId || "",
        institution_name: institutionName,
        institution_logo: institutionLogo,
        account_name: account.name,
        account_type: account.type,
        account_subtype: account.subtype || "other",
        account_mask: account.mask || null,
        status: "connected",
      })
      .select()
      .single();

    if (connError) {
      console.error("Database error:", connError);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to create bank connection",
        500,
        connError
      );
    }

    // Trigger initial transaction sync
    console.log(`Starting initial sync for connection ${connection.id}`);
    const syncResult = await syncTransactionsFromPlaid(connection.id, userId);

    return createSuccessResponse(
      {
        connection: {
          ...connection,
          plaid_access_token: "***",
        },
        initial_sync: {
          success: syncResult.success,
          transactions_added: syncResult.added,
          transactions_modified: syncResult.modified,
          transactions_removed: syncResult.removed,
          has_more: syncResult.has_more,
        },
      },
      201
    );
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error creating bank connection:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}
