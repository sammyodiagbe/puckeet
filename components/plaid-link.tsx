"use client";

import { useEffect, useState } from "react";
import {
  usePlaidLink,
  PlaidLinkOptions,
  PlaidLinkOnSuccess,
} from "react-plaid-link";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PlaidLinkProps {
  userId: string;
  onSuccess: (accounts: any[]) => void;
  onExit?: () => void;
  buttonText?: string;
  buttonVariant?: "default" | "outline" | "secondary" | "ghost" | "link";
}

export function PlaidLink({
  userId,
  onSuccess,
  onExit,
  buttonText = "Connect Bank Account",
  buttonVariant = "default",
}: PlaidLinkProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch link token when component mounts
  useEffect(() => {
    const fetchLinkToken = async () => {
      try {
        const response = await fetch("/api/plaid/create-link-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create link token");
        }

        setLinkToken(data.link_token);
      } catch (error: any) {
        console.error("Error fetching link token:", error);
        toast.error("Failed to initialize bank connection", {
          description: error.message,
        });
      }
    };

    if (userId) {
      fetchLinkToken();
    }
  }, [userId]);

  // Handle successful link
  const handleOnSuccess: PlaidLinkOnSuccess = async (public_token, metadata) => {
    setIsLoading(true);

    try {
      // Exchange public token for access token
      const response = await fetch("/api/plaid/exchange-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          public_token,
          userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to exchange token");
      }

      // Call the success callback with the accounts
      onSuccess(data.accounts);

      toast.success("Bank account connected successfully!", {
        description: `Connected ${data.accounts.length} account${
          data.accounts.length > 1 ? "s" : ""
        }`,
      });
    } catch (error: any) {
      console.error("Error exchanging token:", error);
      toast.error("Failed to connect bank account", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Plaid Link configuration
  const config: PlaidLinkOptions = {
    token: linkToken,
    onSuccess: handleOnSuccess,
    onExit: (error, metadata) => {
      if (error) {
        console.error("Plaid Link error:", error);
        toast.error("Bank connection cancelled", {
          description: error.error_message,
        });
      }
      onExit?.();
    },
  };

  const { open, ready } = usePlaidLink(config);

  return (
    <Button
      onClick={() => open()}
      disabled={!ready || isLoading}
      variant={buttonVariant}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        buttonText
      )}
    </Button>
  );
}
