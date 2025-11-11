import { NextRequest, NextResponse } from "next/server";
import { plaidClient, isPlaidConfigured } from "@/lib/plaid-client";
import { CountryCode, Products } from "plaid";

export async function POST(request: NextRequest) {
  try {
    // Check if Plaid is configured
    if (!isPlaidConfigured()) {
      return NextResponse.json(
        {
          error:
            "Plaid is not configured. Please add PLAID_CLIENT_ID, PLAID_SECRET, and PLAID_ENV to your .env.local file.",
        },
        { status: 500 }
      );
    }

    // Get user ID from request body
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Create link token
    const request_config: any = {
      user: {
        client_user_id: userId,
      },
      client_name: "Puckeet",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
    };

    // Only add redirect_uri if not in sandbox mode
    if (process.env.PLAID_ENV !== "sandbox" && process.env.NEXT_PUBLIC_APP_URL) {
      request_config.redirect_uri = `${process.env.NEXT_PUBLIC_APP_URL}/settings/bank-sync`;
    }

    const response = await plaidClient.linkTokenCreate(request_config);

    return NextResponse.json({
      link_token: response.data.link_token,
      expiration: response.data.expiration,
    });
  } catch (error: any) {
    console.error("Error creating link token:", error);
    console.error("Error response:", error.response?.data);
    return NextResponse.json(
      {
        error: "Failed to create link token",
        details: error.message,
        plaidError: error.response?.data,
      },
      { status: 500 }
    );
  }
}
