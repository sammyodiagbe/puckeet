import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

// Validate required environment variables
const requiredEnvVars = ["PLAID_CLIENT_ID", "PLAID_SECRET", "PLAID_ENV"];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  console.warn(
    `Missing Plaid environment variables: ${missingEnvVars.join(", ")}. Plaid integration will not work.`
  );
}

// Get Plaid environment
const getPlaidEnvironment = () => {
  const env = process.env.PLAID_ENV || "sandbox";
  switch (env) {
    case "sandbox":
      return PlaidEnvironments.sandbox;
    case "development":
      return PlaidEnvironments.development;
    case "production":
      return PlaidEnvironments.production;
    default:
      return PlaidEnvironments.sandbox;
  }
};

// Create Plaid client configuration
const configuration = new Configuration({
  basePath: getPlaidEnvironment(),
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID || "",
      "PLAID-SECRET": process.env.PLAID_SECRET || "",
    },
  },
});

// Export Plaid client instance
export const plaidClient = new PlaidApi(configuration);

// Helper function to check if Plaid is configured
export const isPlaidConfigured = () => {
  return missingEnvVars.length === 0;
};
