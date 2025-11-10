"use client";

import { useEffect } from "react";
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
} from "lucide-react";
import { useSyncStore } from "@/lib/stores/sync-store";
import { mockBankConnections } from "@/lib/mock-data";
import { format } from "date-fns";
import { toast } from "sonner";

export default function BankSyncPage() {
  const { bankConnections, addBankConnection, startSync, finishSync, removeBankConnection } =
    useSyncStore();

  useEffect(() => {
    mockBankConnections.forEach((conn) => {
      if (!bankConnections.find((c) => c.id === conn.id)) {
        addBankConnection(conn);
      }
    });
  }, [addBankConnection, bankConnections]);

  const handleSync = (bankId: string) => {
    startSync(bankId);
    toast.info("Syncing transactions...");

    // Simulate sync
    setTimeout(() => {
      finishSync(bankId, true);
      toast.success("Transactions synced successfully");
    }, 2000);
  };

  const handleConnect = () => {
    toast.info("Opening Plaid connection flow...");
    // This would trigger the Plaid integration in a real app
  };

  const handleDisconnect = (bankId: string, bankName: string) => {
    removeBankConnection(bankId);
    toast.success(`${bankName} disconnected`);
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
          <Button onClick={handleConnect}>
            <Plus className="mr-2 h-4 w-4" />
            Connect Bank Account
          </Button>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            We use bank-level security with Plaid to securely connect your
            accounts. Your credentials are never stored on our servers.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4">
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
                <Button onClick={handleConnect}>
                  <Plus className="mr-2 h-4 w-4" />
                  Connect Your First Account
                </Button>
              </CardContent>
            </Card>
          ) : (
            bankConnections.map((connection) => (
              <Card key={connection.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{connection.bankName}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {connection.accountType} account
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(connection.status)}
                          {getStatusBadge(connection.status)}
                        </div>
                        {connection.lastSyncDate && (
                          <p className="text-xs text-muted-foreground">
                            Last synced:{" "}
                            {format(connection.lastSyncDate, "MMM dd, yyyy")}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSync(connection.id)}
                          disabled={connection.status === "syncing"}
                        >
                          <RefreshCw
                            className={`h-4 w-4 ${
                              connection.status === "syncing" ? "animate-spin" : ""
                            }`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleDisconnect(connection.id, connection.bankName)
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

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
