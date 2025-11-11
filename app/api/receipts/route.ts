import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api-helpers";

/**
 * GET /api/receipts
 * Get all receipts for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const unlinked = searchParams.get("unlinked") === "true";

    let query = supabaseAdmin
      .from("receipts")
      .select("*, transactions(id, description, merchant, date, amount)")
      .eq("user_id", userId)
      .order("upload_date", { ascending: false });

    if (unlinked) {
      query = query.is("transaction_id", null);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to fetch receipts",
        500,
        error
      );
    }

    return createSuccessResponse({
      receipts: data,
      count: data.length,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error fetching receipts:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}
