"use client";

import { createWorker } from "tesseract.js";

// Type for quick preview OCR results
export interface QuickOCRResult {
  text: string;
  merchant?: string;
  amount?: number;
  date?: string;
  confidence: number;
}

/**
 * Quick client-side OCR using Tesseract.js
 * This provides instant preview while waiting for GPT-4 Vision
 */
export async function quickScanReceipt(
  imageFile: File,
  onProgress?: (progress: number) => void
): Promise<QuickOCRResult> {
  try {
    // Create Tesseract worker
    const worker = await createWorker("eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text" && onProgress) {
          onProgress(Math.round(m.progress * 100));
        }
      },
    });

    // Process image
    const {
      data: { text, confidence },
    } = await worker.recognize(imageFile);

    // Terminate worker
    await worker.terminate();

    // Parse extracted text for common fields
    const parsed = parseReceiptText(text);

    return {
      text: text.trim(),
      merchant: parsed.merchant,
      amount: parsed.amount,
      date: parsed.date,
      confidence: Math.round(confidence),
    };
  } catch (error) {
    console.error("Tesseract OCR error:", error);
    throw new Error("Failed to scan receipt preview");
  }
}

/**
 * Parse raw OCR text to extract common receipt fields
 * This is a simple heuristic-based parser for preview purposes
 */
function parseReceiptText(text: string): {
  merchant?: string;
  amount?: number;
  date?: string;
} {
  const lines = text.split("\n").filter((line) => line.trim());

  let merchant: string | undefined;
  let amount: number | undefined;
  let date: string | undefined;

  // Extract merchant (usually first line or line with common keywords)
  const firstLine = lines[0]?.trim();
  if (firstLine && firstLine.length > 2 && firstLine.length < 50) {
    merchant = firstLine;
  }

  // Extract amount (look for TOTAL, AMOUNT, etc.)
  const amountRegex = /(?:total|amount|balance|due|paid)[\s:]*\$?\s*(\d+[.,]\d{2})/i;
  for (const line of lines) {
    const match = line.match(amountRegex);
    if (match) {
      const amountStr = match[1].replace(",", ".");
      amount = parseFloat(amountStr);
      break;
    }
  }

  // If no labeled total found, look for last amount on receipt
  if (!amount) {
    const lastAmounts = text.match(/\$?\s*(\d+[.,]\d{2})/g);
    if (lastAmounts && lastAmounts.length > 0) {
      const lastAmount = lastAmounts[lastAmounts.length - 1];
      const cleaned = lastAmount.replace(/[$\s,]/g, "").replace(",", ".");
      amount = parseFloat(cleaned);
    }
  }

  // Extract date (various formats)
  const datePatterns = [
    /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/,           // MM-DD-YYYY or MM/DD/YYYY
    /(\d{4}[-/]\d{1,2}[-/]\d{1,2})/,             // YYYY-MM-DD
    /(\w{3}\s+\d{1,2},?\s+\d{4})/,               // Jan 15, 2025
    /(\d{1,2}\s+\w{3}\s+\d{4})/,                 // 15 Jan 2025
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      date = match[1];
      break;
    }
  }

  return { merchant, amount, date };
}

/**
 * Preprocess image for better OCR results
 * Can be used to improve image quality before scanning
 */
export function preprocessImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas for preprocessing
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        // Set canvas size
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Simple contrast enhancement
        const factor = 1.5; // Contrast factor
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, ((data[i] - 128) * factor + 128)); // Red
          data[i + 1] = Math.min(255, ((data[i + 1] - 128) * factor + 128)); // Green
          data[i + 2] = Math.min(255, ((data[i + 2] - 128) * factor + 128)); // Blue
        }

        // Put processed image back
        ctx.putImageData(imageData, 0, 0);

        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const processedFile = new File([blob], file.name, {
              type: file.type,
            });
            resolve(processedFile);
          } else {
            resolve(file);
          }
        }, file.type);
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
