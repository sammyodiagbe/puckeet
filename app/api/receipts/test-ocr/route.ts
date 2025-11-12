import { NextRequest } from "next/server";
import { isOpenAIConfigured } from "@/lib/ocr-gpt4";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-helpers";

/**
 * GET /api/receipts/test-ocr
 * Test if OpenAI is configured correctly
 */
export async function GET(request: NextRequest) {
  try {
    const configured = isOpenAIConfigured();

    if (!configured) {
      return createErrorResponse(
        "OCR_NOT_CONFIGURED",
        "OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables.",
        500
      );
    }

    // Try to import OpenAI to verify the package is working
    try {
      const OpenAI = require("openai");
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      return createSuccessResponse({
        status: "configured",
        message: "✅ OpenAI API key is configured and ready to use!",
        model: "gpt-4o",
        features: {
          quick_preview: "Tesseract.js (client-side, free)",
          accurate_extraction: "GPT-4 Vision (server-side, ~$0.012/receipt)",
        },
        next_steps: [
          "Upload a receipt image",
          "Watch instant preview with Tesseract.js",
          "Wait for accurate extraction with GPT-4 Vision",
          "Review extracted data",
        ],
      });
    } catch (error: any) {
      return createErrorResponse(
        "OCR_PACKAGE_ERROR",
        `OpenAI package error: ${error.message}`,
        500
      );
    }
  } catch (error: any) {
    console.error("Error testing OCR:", error);
    return createErrorResponse("SERVER_ERROR", "Internal server error", 500);
  }
}
