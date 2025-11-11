import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/api-helpers";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

/**
 * POST /api/receipts/upload
 * Upload receipt files
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const notes = formData.get("notes") as string | null;

    if (!files || files.length === 0) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "No files provided",
        400
      );
    }

    if (files.length > 10) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "Maximum 10 files allowed per upload",
        400
      );
    }

    const uploadedReceipts = [];
    const errors = [];

    for (const file of files) {
      try {
        // Validate file type
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          errors.push({
            file: file.name,
            error: `Invalid file type: ${file.type}. Allowed types: images and PDF`,
          });
          continue;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          errors.push({
            file: file.name,
            error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum: 10MB`,
          });
          continue;
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 15);
        const extension = file.name.split(".").pop();
        const storagePath = `${userId}/${timestamp}-${randomStr}.${extension}`;

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
          errors.push({
            file: file.name,
            error: `Failed to upload: ${uploadError.message}`,
          });
          continue;
        }

        // Create receipt record in database
        const { data: receipt, error: dbError } = await supabaseAdmin
          .from("receipts")
          .insert({
            user_id: userId,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            storage_path: storagePath,
            notes: notes,
          })
          .select()
          .single();

        if (dbError) {
          console.error("Database error:", dbError);
          // Try to clean up uploaded file
          await supabaseAdmin.storage
            .from("receipts")
            .remove([storagePath]);
          errors.push({
            file: file.name,
            error: `Failed to create record: ${dbError.message}`,
          });
          continue;
        }

        uploadedReceipts.push(receipt);
      } catch (fileError: any) {
        errors.push({
          file: file.name,
          error: fileError.message || "Unknown error occurred",
        });
      }
    }

    if (uploadedReceipts.length === 0 && errors.length > 0) {
      return createErrorResponse(
        "UPLOAD_FAILED",
        "All file uploads failed",
        400,
        errors
      );
    }

    return createSuccessResponse(
      {
        receipts: uploadedReceipts,
        uploaded_count: uploadedReceipts.length,
        failed_count: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      },
      201
    );
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
    console.error("Error uploading receipts:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}
