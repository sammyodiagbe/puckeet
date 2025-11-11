import { NextRequest, NextResponse } from "next/server";
import { plaidClient, isPlaidConfigured } from "@/lib/plaid-client";

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

    const body = await request.json();
    const { public_token, userId } = body;

    if (!public_token || !userId) {
      return NextResponse.json(
        { error: "Public token and user ID are required" },
        { status: 400 }
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
    let institutionName = "Unknown Bank";
    let institutionLogo = undefined;
    if (institutionId) {
      const institutionResponse = await plaidClient.institutionsGetById({
        institution_id: institutionId,
        country_codes: ["US"] as any,
        options: {
          include_optional_metadata: true,
        },
      });
      institutionName = institutionResponse.data.institution.name;
      institutionLogo = institutionResponse.data.institution.logo;

      console.log("Institution data:", {
        name: institutionName,
        hasLogo: !!institutionLogo,
        logoLength: institutionLogo?.length,
      });
    }

    // Get account information
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const accounts = accountsResponse.data.accounts.map((account) => ({
      accountId: account.account_id,
      accountName: account.name,
      accountType: account.type,
      accountSubtype: account.subtype || "other",
      mask: account.mask,
      institutionId: institutionId || "",
      institutionName,
      institutionLogo,
      plaidItemId: itemId,
      plaidAccessToken: accessToken,
    }));

    return NextResponse.json({
      success: true,
      accounts,
    });
  } catch (error: any) {
    console.error("Error exchanging token:", error);
    return NextResponse.json(
      {
        error: "Failed to exchange token",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
