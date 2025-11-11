import { NextResponse } from "next/server";

export async function GET() {
  const config = {
    PLAID_CLIENT_ID: process.env.PLAID_CLIENT_ID,
    PLAID_SECRET: process.env.PLAID_SECRET ? "***" + process.env.PLAID_SECRET.slice(-4) : "NOT SET",
    PLAID_ENV: process.env.PLAID_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };

  const isConfigured =
    !!process.env.PLAID_CLIENT_ID &&
    !!process.env.PLAID_SECRET &&
    !!process.env.PLAID_ENV;

  return NextResponse.json({
    configured: isConfigured,
    config,
    note: "Make sure you restart the dev server after changing .env.local"
  });
}
