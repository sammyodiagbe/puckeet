import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api-helpers";
import {
  createTransactionSchema,
  getTransactionsQuerySchema,
} from "@/lib/validations/transaction";

/**
 * GET /api/transactions
 * Get all transactions for the authenticated user with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validation = getTransactionsQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid query parameters",
        400,
        validation.error.errors
      );
    }

    const {
      page,
      limit,
      category_id,
      status,
      is_deductible,
      from_date,
      to_date,
      search,
    } = validation.data;

    // Build query
    let query = supabaseAdmin
      .from("transactions")
      .select("*, categories(id, name, color, icon)", { count: "exact" })
      .eq("user_id", userId)
      .order("date", { ascending: false });

    // Apply filters
    if (category_id) {
      query = query.eq("category_id", category_id);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (is_deductible !== undefined) {
      query = query.eq("is_deductible", is_deductible);
    }
    if (from_date) {
      query = query.gte("date", from_date);
    }
    if (to_date) {
      query = query.lte("date", to_date);
    }
    if (search) {
      query = query.or(
        `description.ilike.%${search}%,merchant.ilike.%${search}%,notes.ilike.%${search}%`
      );
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to fetch transactions",
        500,
        error
      );
    }

    return createSuccessResponse({
      transactions: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error fetching transactions:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}

/**
 * POST /api/transactions
 * Create a new transaction
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const body = await request.json();
    const validation = createTransactionSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid transaction data",
        400,
        validation.error.errors
      );
    }

    const transactionData = {
      ...validation.data,
      user_id: userId,
    };

    const { data, error } = await supabaseAdmin
      .from("transactions")
      .insert(transactionData)
      .select("*, categories(id, name, color, icon)")
      .single();

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to create transaction",
        500,
        error
      );
    }

    return createSuccessResponse(data, 201);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error creating transaction:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}
