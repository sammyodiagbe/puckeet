import OpenAI from "openai";

// Check if OpenAI is configured
export function isOpenAIConfigured() {
  return !!process.env.OPENAI_API_KEY;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Type definitions for extracted receipt data
export interface ReceiptOCRData {
  merchant: string;
  date: string; // YYYY-MM-DD format
  total: number;
  subtotal?: number;
  tax?: number;
  tip?: number;
  items?: Array<{
    description: string;
    quantity?: number;
    price?: number;
  }>;
  paymentMethod?: string;
  lastFourDigits?: string;
  categoryName?: string;
  confidence: number; // 0-100
  rawText?: string;
}

/**
 * Process receipt image using GPT-4 Vision
 * Returns structured data extracted from the receipt
 */
export async function processReceiptWithGPT4(
  imageUrl: string
): Promise<ReceiptOCRData> {
  if (!isOpenAIConfigured()) {
    throw new Error("OpenAI API key is not configured");
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using GPT-4o which has vision capabilities
      messages: [
        {
          role: "system",
          content: `You are an expert receipt data extraction system. Extract structured data from receipts with high accuracy.

Rules:
1. Always return valid JSON
2. Date must be in YYYY-MM-DD format
3. Amounts must be numbers (not strings)
4. Merchant name should be standardized (e.g., "STARBUCKS #1234" → "Starbucks")
5. If you can't find a field, use null
6. Confidence is your certainty from 0-100
7. Suggest a category based on merchant/items

Categories to consider: Business Travel, Meals & Entertainment, Office Supplies, Software & Subscriptions, Marketing & Advertising, Professional Services, Equipment & Hardware, Utilities, Rent & Facilities, Education & Training, Insurance, Shipping & Postage, Groceries, Transportation, Healthcare, Personal, Miscellaneous`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract the following information from this receipt and return as JSON:

{
  "merchant": "Store name",
  "date": "YYYY-MM-DD",
  "total": 0.00,
  "subtotal": 0.00,
  "tax": 0.00,
  "tip": 0.00,
  "items": [
    {
      "description": "Item name",
      "quantity": 1,
      "price": 0.00
    }
  ],
  "paymentMethod": "Cash/Credit/Debit",
  "lastFourDigits": "1234",
  "categoryName": "Suggested category name",
  "confidence": 95,
  "rawText": "Any additional relevant text"
}

Focus on accuracy. If you're unsure about any field, set it to null and lower the confidence score.`,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high", // Use high detail for better accuracy
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.1, // Low temperature for more consistent output
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from GPT-4 Vision");
    }

    // Parse JSON response
    // GPT-4 might wrap JSON in markdown code blocks, so we need to extract it
    let jsonString = content.trim();
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonString = jsonMatch[1];
    } else if (content.includes("```")) {
      // Handle plain code blocks
      const match = content.match(/```\n([\s\S]*?)\n```/);
      if (match) {
        jsonString = match[1];
      }
    }

    const extractedData = JSON.parse(jsonString) as ReceiptOCRData;

    // Validate and clean data
    return {
      merchant: extractedData.merchant || "Unknown",
      date: extractedData.date || new Date().toISOString().split("T")[0],
      total: Number(extractedData.total) || 0,
      subtotal: extractedData.subtotal ? Number(extractedData.subtotal) : undefined,
      tax: extractedData.tax ? Number(extractedData.tax) : undefined,
      tip: extractedData.tip ? Number(extractedData.tip) : undefined,
      items: extractedData.items || [],
      paymentMethod: extractedData.paymentMethod || undefined,
      lastFourDigits: extractedData.lastFourDigits || undefined,
      categoryName: extractedData.categoryName || "Miscellaneous",
      confidence: Math.min(Math.max(Number(extractedData.confidence) || 50, 0), 100),
      rawText: extractedData.rawText || undefined,
    };
  } catch (error: any) {
    console.error("GPT-4 Vision OCR error:", error);

    // Check for specific OpenAI errors
    if (error.status === 401) {
      throw new Error("Invalid OpenAI API key");
    } else if (error.status === 429) {
      throw new Error("OpenAI rate limit exceeded. Please try again later.");
    } else if (error.status === 400) {
      throw new Error("Invalid image format or size");
    }

    throw new Error(`OCR processing failed: ${error.message}`);
  }
}

/**
 * Get category ID from category name
 * Matches against existing categories in the database
 */
export function matchCategory(
  categoryName: string,
  categories: Array<{ id: string; name: string }>
): string | null {
  if (!categoryName) return null;

  // Exact match (case insensitive)
  const exactMatch = categories.find(
    (cat) => cat.name.toLowerCase() === categoryName.toLowerCase()
  );
  if (exactMatch) return exactMatch.id;

  // Partial match
  const partialMatch = categories.find((cat) =>
    cat.name.toLowerCase().includes(categoryName.toLowerCase())
  );
  if (partialMatch) return partialMatch.id;

  // Reverse partial match
  const reverseMatch = categories.find((cat) =>
    categoryName.toLowerCase().includes(cat.name.toLowerCase())
  );
  if (reverseMatch) return reverseMatch.id;

  return null;
}
