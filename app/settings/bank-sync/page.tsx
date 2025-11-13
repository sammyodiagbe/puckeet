"use client";

import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  RefreshCw,
  Trash2,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useSyncStore } from "@/lib/stores/sync-store";
import { useUserStore } from "@/lib/stores/user-store";
import { useTransactionStore } from "@/lib/stores/transaction-store";
import { PlaidLink } from "@/components/plaid-link";
import { BankLogo } from "@/components/bank-logo";
import { format } from "date-fns";
import { toast } from "sonner";
import { BankConnectionInput } from "@/lib/types";

export default function BankSyncPage() {
  const {
    bankConnections,
    addMultipleBankConnections,
    startSync,
    finishSync,
    removeBankConnection,
    getBankConnection,
  } = useSyncStore();
  const { user } = useUserStore();
  const { loadTransactions } = useTransactionStore();
  const [showPlaidLink, setShowPlaidLink] = useState(false);

  const handlePlaidSuccess = (accounts: any[]) => {
    console.log("Received accounts from Plaid:", accounts);

    // Convert accounts to BankConnectionInput format
    const connections: BankConnectionInput[] = accounts.map((account) => ({
      userId: user?.id || "1",
      institutionId: account.institutionId,
      institutionName: account.institutionName,
      institutionLogo: account.institutionLogo,
      accountId: account.accountId,
      accountName: account.accountName,
      accountType: account.accountType,
      accountSubtype: account.accountSubtype,
      mask: account.mask,
      status: "connected" as const,
      plaidItemId: account.plaidItemId,
      plaidAccessToken: account.plaidAccessToken,
    }));

    console.log("Processed connections:", connections);

    // Add all connections to store
    addMultipleBankConnections(connections);

    toast.success("Bank account connected!", {
      description: `${connections.length} account${connections.length > 1 ? "s" : ""} connected successfully`,
    });

    setShowPlaidLink(false);
  };

  const handleSync = async (bankId: string) => {
    const connection = getBankConnection(bankId);
    if (!connection) {
      toast.error("Bank connection not found");
      return;
    }

    startSync(bankId);
    toast.info(`Syncing transactions from ${connection.institutionName}...`);

    try {
      const response = await fetch("/api/plaid/sync-transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: connection.plaidAccessToken,
          cursor: connection.cursor,
          accountId: connection.accountId,
          bankConnectionId: connection.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to sync transactions");
      }

      // Transactions are now saved directly by the API
      // No need to map or filter - the backend handles everything

      // Update cursor and finish sync
      finishSync(bankId, true, data.cursor);

      // Show success message with sync stats
      const savedCount = data.savedCount || 0;
      const skippedCount = data.skippedCount || 0;

      toast.success(
        `Successfully synced ${savedCount} new transaction${
          savedCount !== 1 ? "s" : ""
        }`,
        {
          description: skippedCount > 0
            ? `${savedCount} new, ${skippedCount} already existed`
            : `${data.added || 0} fetched from bank`,
        }
      );

      // Reload transactions from database
      await loadTransactions();
    } catch (error: any) {
      console.error("Error syncing transactions:", error);
      finishSync(bankId, false, undefined, error.message);
      toast.error("Failed to sync transactions", {
        description: error.message,
      });
    }
  };

  const handleDisconnect = (bankId: string, institutionName: string) => {
    removeBankConnection(bankId);
    toast.success(`${institutionName} disconnected`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "syncing":
        return <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      connected: "default",
      syncing: "secondary",
      error: "destructive",
      disconnected: "outline",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status}
      </Badge>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bank Sync</h1>
            <p className="text-muted-foreground">
              Connect and manage your financial accounts
            </p>
          </div>
          {user && (
            <PlaidLink
              userId={user.id}
              onSuccess={handlePlaidSuccess}
              onExit={() => setShowPlaidLink(false)}
              buttonText="Connect Bank Account"
            />
          )}
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            We use bank-level security with Plaid to securely connect your
            accounts. Your credentials are never stored on our servers.
          </AlertDescription>
        </Alert>

        {bankConnections.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No bank accounts connected
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Connect your bank account to automatically import transactions
              </p>
              {user && (
                <PlaidLink
                  userId={user.id}
                  onSuccess={handlePlaidSuccess}
                  onExit={() => setShowPlaidLink(false)}
                  buttonText="Connect Your First Account"
                />
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Sort by newest first */}
            {[...bankConnections]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((connection) => (
                <Card key={connection.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                      {/* Header with Logo and Status */}
                      <div className="flex items-start justify-between gap-3">
                        <BankLogo
                          institutionName={connection.institutionName}
                          institutionLogo={connection.institutionLogo}
                          size="md"
                        />
                        {getStatusBadge(connection.status)}
                      </div>

                      {/* Account Info */}
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">
                          {connection.institutionName}
                        </h3>
                        <p className="text-sm font-medium text-foreground">
                          {connection.accountName}
                          {connection.mask && (
                            <span className="text-muted-foreground ml-1">
                              ••••{connection.mask}
                            </span>
                          )}
                        </p>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground capitalize bg-muted px-2 py-0.5 rounded inline-flex w-fit">
                            {connection.accountSubtype}
                          </span>
                          {connection.lastSyncDate && (
                            <span className="text-xs text-muted-foreground">
                              Last synced {format(connection.lastSyncDate, "MMM dd, h:mm a")}
                            </span>
                          )}
                        </div>
                        {connection.errorMessage && (
                          <p className="text-xs text-destructive">
                            {connection.errorMessage}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSync(connection.id)}
                          disabled={connection.status === "syncing"}
                          className="gap-2 flex-1"
                        >
                          <RefreshCw
                            className={`h-4 w-4 ${
                              connection.status === "syncing" ? "animate-spin" : ""
                            }`}
                          />
                          Sync
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleDisconnect(
                              connection.id,
                              connection.institutionName
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>How Bank Sync Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                1
              </div>
              <p>
                Connect your bank account securely through our partner Plaid
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                2
              </div>
              <p>
                Transactions are automatically imported and categorized
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                3
              </div>
              <p>
                Review and adjust categories as needed for tax preparation
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
