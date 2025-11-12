import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api-helpers";
import { updateReceiptSchema } from "@/lib/validations/receipt";

/**
 * GET /api/receipts/[id]
 * Get a single receipt by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from("receipts")
      .select("*, transactions(id, description, merchant, date, amount)")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return createErrorResponse("NOT_FOUND", "Receipt not found", 404);
    }

    // Generate signed URL for accessing the receipt file
    const { data: signedUrlData } = await supabaseAdmin.storage
      .from("receipts")
      .createSignedUrl(data.storage_path, 3600); // 1 hour expiry

    return createSuccessResponse({
      ...data,
      signed_url: signedUrlData?.signedUrl,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error fetching receipt:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}

/**
 * PATCH /api/receipts/[id]
 * Update receipt metadata
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);
    const { id } = await params;

    const body = await request.json();
    const validation = updateReceiptSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid receipt data",
        400,
        validation.error.errors
      );
    }

    // Check if receipt exists and belongs to user
    const { data: existing } = await supabaseAdmin
      .from("receipts")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (!existing) {
      return createErrorResponse(
        "NOT_FOUND",
        "Receipt not found or access denied",
        404
      );
    }

    // Update the receipt
    const { data, error } = await supabaseAdmin
      .from("receipts")
      .update(validation.data)
      .eq("id", id)
      .eq("user_id", userId)
      .select("*, transactions(id, description, merchant, date, amount)")
      .single();

    if (error) {
      console.error("Database error:", error);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to update receipt",
        500,
        error
      );
    }

    return createSuccessResponse(data);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error updating receipt:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}

/**
 * DELETE /api/receipts/[id]
 * Delete a receipt (also removes file from storage)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);
    const { id } = await params;

    // Get receipt to obtain storage path
    const { data: receipt, error: fetchError } = await supabaseAdmin
      .from("receipts")
      .select("storage_path, thumbnail_path")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !receipt) {
      return createErrorResponse(
        "NOT_FOUND",
        "Receipt not found or access denied",
        404
      );
    }

    // First, unlink from all transactions (remove from junction table)
    try {
      await supabaseAdmin
        .from("transaction_receipts")
        .delete()
        .eq("receipt_id", id);
    } catch (unlinkError) {
      console.warn("Failed to unlink receipt from transactions:", unlinkError);
    }

    // Delete the database record
    const { error: deleteError } = await supabaseAdmin
      .from("receipts")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Database error:", deleteError);
      return createErrorResponse(
        "DATABASE_ERROR",
        "Failed to delete receipt",
        500,
        deleteError
      );
    }

    // Delete files from storage (don't fail if this errors)
    try {
      const filesToDelete = [receipt.storage_path];
      if (receipt.thumbnail_path) {
        filesToDelete.push(receipt.thumbnail_path);
      }
      await supabaseAdmin.storage.from("receipts").remove(filesToDelete);
    } catch (storageError) {
      console.warn("Failed to delete receipt files from storage:", storageError);
    }

    return createSuccessResponse({ id, deleted: true });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error deleting receipt:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}
