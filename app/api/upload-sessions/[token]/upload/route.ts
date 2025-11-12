import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-helpers";
import { processReceiptWithGPT4, isOpenAIConfigured, matchCategory } from "@/lib/ocr-gpt4";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

/**
 * POST /api/upload-sessions/[token]/upload
 * Upload receipt via mobile QR code link (NO AUTH REQUIRED - uses session token)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Verify session exists and is valid
    const { data: session, error: sessionError } = await supabaseAdmin
      .from("upload_sessions")
      .select("*")
      .eq("session_token", token)
      .single();

    if (sessionError || !session) {
      return createErrorResponse(
        "INVALID_SESSION",
        "Upload session not found or expired",
        404
      );
    }

    // Check if session is still active
    if (!session.is_active) {
      return createErrorResponse(
        "SESSION_INACTIVE",
        "Upload session is no longer active",
        400
      );
    }

    // Check if session has expired
    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    if (now > expiresAt) {
      // Mark session as inactive
      await supabaseAdmin
        .from("upload_sessions")
        .update({ is_active: false })
        .eq("id", session.id);

      return createErrorResponse(
        "SESSION_EXPIRED",
        "Upload session has expired. Please scan a new QR code.",
        400
      );
    }

    // Check receipt limit
    if (session.receipt_count >= session.max_receipts) {
      return createErrorResponse(
        "LIMIT_REACHED",
        `Maximum of ${session.max_receipts} receipts per session reached`,
        400
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return createErrorResponse("VALIDATION_ERROR", "No file provided", 400);
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return createErrorResponse(
        "INVALID_FILE_TYPE",
        `Invalid file type: ${file.type}. Allowed types: images and PDF`,
        400
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return createErrorResponse(
        "FILE_TOO_LARGE",
        `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum: 10MB`,
        400
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split(".").pop();
    const storagePath = `${session.user_id}/${timestamp}-${randomStr}.${extension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("receipts")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return createErrorResponse(
        "STORAGE_ERROR",
        `Failed to upload: ${uploadError.message}`,
        500
      );
    }

    // Create receipt record in database
    const { data: receipt, error: dbError } = await supabaseAdmin
      .from("receipts")
      .insert({
        user_id: session.user_id,
        upload_session_id: session.id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: storagePath,
        ocr_status: "pending",
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      // Try to clean up uploaded file
      await supabaseAdmin.storage.from("receipts").remove([storagePath]);
      return createErrorResponse(
        "DATABASE_ERROR",
        `Failed to create record: ${dbError.message}`,
        500
      );
    }

    // Update session receipt count
    await supabaseAdmin
      .from("upload_sessions")
      .update({
        receipt_count: session.receipt_count + 1,
      })
      .eq("id", session.id);

    // Trigger OCR processing in background (don't wait for it)
    if (isOpenAIConfigured()) {
      processReceiptInBackground(receipt.id, session.user_id, storagePath);
    }

    return createSuccessResponse(
      {
        receipt_id: receipt.id,
        file_name: receipt.file_name,
        uploaded: true,
        ocr_status: "processing",
        session_receipts_count: session.receipt_count + 1,
        message: "Receipt uploaded successfully! Processing with AI...",
      },
      201
    );
  } catch (error: any) {
    console.error("Error uploading receipt:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}

/**
 * Process receipt OCR in background
 */
async function processReceiptInBackground(
  receiptId: string,
  userId: string,
  storagePath: string
) {
  try {
    // Update status to processing
    await supabaseAdmin
      .from("receipts")
      .update({ ocr_status: "processing" })
      .eq("id", receiptId);

    // Generate signed URL
    const { data: signedUrlData } = await supabaseAdmin.storage
      .from("receipts")
      .createSignedUrl(storagePath, 3600);

    if (!signedUrlData?.signedUrl) {
      throw new Error("Failed to generate signed URL");
    }

    // Process with GPT-4 Vision
    const ocrData = await processReceiptWithGPT4(signedUrlData.signedUrl);

    // Get categories to match suggested category
    const { data: categories } = await supabaseAdmin
      .from("categories")
      .select("id, name")
      .or(`user_id.eq.${userId},is_default.eq.true`);

    const suggestedCategoryId = matchCategory(
      ocrData.categoryName || "",
      categories || []
    );

    // Update receipt with OCR data
    await supabaseAdmin
      .from("receipts")
      .update({
        ocr_status: "completed",
        ocr_data: ocrData,
        ocr_processed_at: new Date().toISOString(),
        suggested_category_id: suggestedCategoryId,
        ocr_error: null,
      })
      .eq("id", receiptId);

    console.log(`✅ OCR completed for receipt ${receiptId}`);
  } catch (error: any) {
    console.error("Background OCR processing error:", error);

    // Update receipt with error
    await supabaseAdmin
      .from("receipts")
      .update({
        ocr_status: "failed",
        ocr_error: error.message || "OCR processing failed",
      })
      .eq("id", receiptId);
  }
}
