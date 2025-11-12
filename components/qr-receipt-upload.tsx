"use client";

import { useState, useEffect, useCallback } from "react";
import QRCode from "react-qr-code";
import { useReceiptStore } from "@/lib/stores/receipt-store";
import { useUserStore } from "@/lib/stores/user-store";
import { useTransactionStore } from "@/lib/stores/transaction-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Smartphone,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  WifiOff,
  Plus,
  Link2,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface UploadSession {
  session_id: string;
  upload_url: string;
  expires_at: string;
  expires_in_minutes: number;
  max_receipts: number;
}

interface ReceiptData {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  ocr_status: "pending" | "processing" | "completed" | "failed";
  ocr_data: any;
  ocr_error: string | null;
  created_at: string;
}

interface SessionReceipts {
  session_id: string;
  receipt_count: number;
  max_receipts: number;
  is_active: boolean;
  expires_at: string;
  receipts: ReceiptData[];
}

export function QRReceiptUpload() {
  const { user } = useUserStore();
  const { addReceipt: addReceiptToStore, linkReceiptToTransaction, updateReceipt } = useReceiptStore();
  const { transactions, addTransaction, updateTransaction } = useTransactionStore();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<UploadSession | null>(null);
  const [receipts, setReceipts] = useState<SessionReceipts | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [processedReceiptIds, setProcessedReceiptIds] = useState<Set<string>>(new Set());
  const [showQRCode, setShowQRCode] = useState(true);
  const [linkingReceiptId, setLinkingReceiptId] = useState<string | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string>("");
  const [linkedReceipts, setLinkedReceipts] = useState<Map<string, string>>(new Map()); // receiptId -> transactionId

  // Cleanup session
  const cleanupSession = useCallback(async () => {
    if (!session?.session_id) return;

    try {
      await fetch(
        `/api/upload-sessions?session_id=${session.session_id}`,
        { method: "DELETE" }
      );
    } catch (error) {
      console.error("Error cleaning up session:", error);
    }
  }, [session?.session_id]);

  // Create new upload session
  const createSession = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/upload-sessions", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setSession(data.data);

        // Check if using localhost
        const isLocalUrl = data.data.upload_url.includes("localhost") ||
                          data.data.upload_url.includes("127.0.0.1");
        setIsLocalhost(isLocalUrl);

        if (isLocalUrl) {
          toast.warning("Note: localhost won't work on mobile. See instructions below.");
        } else {
          toast.success("QR Code generated! Scan with your phone.");
        }
      } else {
        toast.error(data.error?.message || "Failed to create upload session");
      }
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Failed to create upload session");
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll for uploaded receipts
  const pollReceipts = useCallback(async () => {
    if (!session?.session_id || !user?.id) return;

    try {
      const response = await fetch(
        `/api/upload-sessions?session_id=${session.session_id}`
      );

      const data = await response.json();

      if (data.success) {
        const sessionData = data.data;
        setReceipts(sessionData);

        // Hide QR code once receipts start arriving
        if (sessionData.receipts.length > 0) {
          setShowQRCode(false);
        }

        // Add new receipts to the store
        for (const receiptData of sessionData.receipts) {
          if (!processedReceiptIds.has(receiptData.id)) {
            // Fetch signed URL for the receipt
            try {
              const urlResponse = await fetch(`/api/receipts/${receiptData.id}/url`);
              const urlData = await urlResponse.json();

              // Add to receipt store so it appears on the receipts page
              addReceiptToStore({
                fileName: receiptData.file_name,
                fileSize: receiptData.file_size,
                fileType: receiptData.file_type,
                imageUrl: urlData.success ? urlData.data.url : '',
                thumbnailUrl: urlData.success ? urlData.data.url : '',
                uploadDate: new Date(receiptData.created_at),
              }, user.id);

              // Mark as processed
              setProcessedReceiptIds(prev => new Set(prev).add(receiptData.id));

              // Show toast for new receipt
              toast.success(`${receiptData.file_name} uploaded!`);
            } catch (error) {
              console.error("Error fetching receipt URL:", error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error polling receipts:", error);
    }
  }, [session?.session_id, user?.id, processedReceiptIds, addReceiptToStore]);

  // Update time remaining
  const updateTimeRemaining = useCallback(() => {
    if (!session?.expires_at) return;

    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    const diff = expiresAt.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeRemaining("Expired");
      return;
    }

    const minutes = Math.floor(diff / 1000 / 60);
    const seconds = Math.floor((diff / 1000) % 60);
    setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`);
  }, [session?.expires_at]);

  // Initialize session when dialog opens
  useEffect(() => {
    if (open && !session) {
      createSession();
    }
  }, [open, session, createSession]);

  // Poll for receipts every 2 seconds
  useEffect(() => {
    if (!open || !session) return;

    pollReceipts(); // Initial fetch

    const pollInterval = setInterval(pollReceipts, 2000);
    return () => clearInterval(pollInterval);
  }, [open, session, pollReceipts]);

  // Update time remaining every second
  useEffect(() => {
    if (!open || !session) return;

    updateTimeRemaining(); // Initial update

    const timeInterval = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(timeInterval);
  }, [open, session, updateTimeRemaining]);

  // Create new transaction from receipt data
  const handleCreateTransaction = useCallback(
    async (receipt: ReceiptData) => {
      if (!user?.id) return;

      const ocrData = receipt.ocr_data || {};

      // Create the transaction and get it back
      const newTransaction = addTransaction(
        {
          userId: user.id,
          date: ocrData.date ? new Date(ocrData.date) : new Date(),
          amount: ocrData.total || 0,
          description: ocrData.merchant || receipt.file_name,
          merchant: ocrData.merchant,
          category: ocrData.categoryName || "Uncategorized",
          tags: [],
          receiptIds: [receipt.id],
          isDeductible: false,
          status: "categorized",
        },
        user.id
      );

      // Link receipt to transaction via API
      try {
        const response = await fetch(`/api/receipts/${receipt.id}/link`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transaction_id: newTransaction.id }),
        });

        if (response.ok) {
          // Update local state
          linkReceiptToTransaction(receipt.id, newTransaction.id);
          setLinkedReceipts((prev) => new Map(prev).set(receipt.id, newTransaction.id));
          toast.success("Transaction created and linked to receipt!");
        } else {
          toast.success("Transaction created!");
        }
      } catch (error) {
        console.error("Failed to link receipt:", error);
        toast.success("Transaction created!");
      }
    },
    [user, addTransaction, linkReceiptToTransaction]
  );

  // Link receipt to existing transaction
  const handleLinkTransaction = useCallback(
    async (receiptId: string, transactionId: string) => {
      if (!transactionId) {
        toast.error("Please select a transaction");
        return;
      }

      try {
        const response = await fetch(`/api/receipts/${receiptId}/link`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transaction_id: transactionId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          toast.error(errorData.error?.message || "Failed to link receipt");
          return;
        }

        // Update local state
        linkReceiptToTransaction(receiptId, transactionId);
        setLinkedReceipts((prev) => new Map(prev).set(receiptId, transactionId));

        // Update transaction's receiptIds array
        const transaction = transactions.find((t) => t.id === transactionId);
        if (transaction) {
          const updatedReceiptIds = transaction.receiptIds.includes(receiptId)
            ? transaction.receiptIds
            : [...transaction.receiptIds, receiptId];
          updateTransaction(transactionId, { receiptIds: updatedReceiptIds });
        }

        toast.success("Receipt linked to transaction!");
        setLinkingReceiptId(null);
        setSelectedTransactionId("");
      } catch (error) {
        console.error("Failed to link receipt:", error);
        toast.error("Failed to link receipt");
      }
    },
    [linkReceiptToTransaction, transactions, updateTransaction]
  );

  // Reset state when dialog closes
  const handleOpenChange = async (newOpen: boolean) => {
    if (!newOpen) {
      // Cleanup session when closing
      await cleanupSession();
      setSession(null);
      setReceipts(null);
      setTimeRemaining("");
      setIsLocalhost(false);
      setProcessedReceiptIds(new Set());
      setShowQRCode(true);
      setLinkingReceiptId(null);
      setSelectedTransactionId("");
      setLinkedReceipts(new Map());
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Smartphone className="w-4 h-4 mr-2" />
          Upload from Phone
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Receipts from Phone</DialogTitle>
          <DialogDescription>
            Scan the QR code with your phone camera to upload receipts
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {!loading && session && (
          <div className="space-y-6">
            {/* Session Info Header */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>
                  Expires in:{" "}
                  <span className="font-medium">{timeRemaining}</span>
                </span>
              </div>
              <span>
                {receipts?.receipt_count || 0} / {session.max_receipts}{" "}
                receipts
              </span>
              {!showQRCode && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowQRCode(true)}
                >
                  Show QR Code
                </Button>
              )}
            </div>

            {/* QR Code Section - Only show if no receipts or user clicked "Show QR Code" */}
            {showQRCode && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center space-y-4">
                    {/* QR Code */}
                    <div className="p-4 bg-white rounded-lg">
                      <QRCode
                        value={session.upload_url}
                        size={256}
                        level="H"
                      />
                    </div>

                    {/* Instructions */}
                    <div className="text-center space-y-2">
                      <p className="text-sm font-medium">
                        1. Open camera app on your phone
                      </p>
                      <p className="text-sm text-muted-foreground">
                        2. Point at QR code
                      </p>
                      <p className="text-sm text-muted-foreground">
                        3. Tap the notification to open upload page
                      </p>
                    </div>

                    {receipts && receipts.receipts.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowQRCode(false)}
                      >
                        Hide QR Code
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Localhost Warning */}
            {isLocalhost && (
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <WifiOff className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                          Localhost detected - Won't work on mobile
                        </p>
                        <p className="text-xs text-orange-800 dark:text-orange-200">
                          Your app is running on localhost, which is only accessible from this computer. To test on your phone:
                        </p>
                        <ol className="text-xs text-orange-800 dark:text-orange-200 space-y-1 ml-4 list-decimal">
                          <li>Find your computer's local IP address:
                            <ul className="ml-4 mt-1 space-y-1 list-disc">
                              <li><strong>Windows:</strong> Run <code className="px-1 py-0.5 bg-orange-100 dark:bg-orange-900 rounded">ipconfig</code> in Command Prompt</li>
                              <li><strong>Mac/Linux:</strong> Run <code className="px-1 py-0.5 bg-orange-100 dark:bg-orange-900 rounded">ifconfig</code> in Terminal</li>
                              <li>Look for IPv4 Address (e.g., 192.168.1.100)</li>
                            </ul>
                          </li>
                          <li>Update <code className="px-1 py-0.5 bg-orange-100 dark:bg-orange-900 rounded">NEXT_PUBLIC_APP_URL</code> in <code className="px-1 py-0.5 bg-orange-100 dark:bg-orange-900 rounded">.env.local</code>:
                            <code className="block mt-1 px-2 py-1 bg-orange-100 dark:bg-orange-900 rounded text-xs">
                              NEXT_PUBLIC_APP_URL=http://YOUR_IP:3000
                            </code>
                          </li>
                          <li>Restart your dev server</li>
                          <li>Make sure your phone is on the same WiFi network</li>
                        </ol>
                        <p className="text-xs text-orange-700 dark:text-orange-300 mt-2">
                          💡 Or deploy your app to test QR code uploads from anywhere!
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Uploaded Receipts */}
            {receipts && receipts.receipts.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">
                        Uploaded Receipts ({receipts.receipts.length})
                      </h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={pollReceipts}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {receipts.receipts.map((receipt) => (
                        <div
                          key={receipt.id}
                          className="rounded-lg bg-muted overflow-hidden"
                        >
                          <div className="flex items-center gap-3 p-3">
                            {receipt.ocr_status === "completed" ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                            ) : receipt.ocr_status === "failed" ? (
                              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                            ) : (
                              <Loader2 className="w-5 h-5 animate-spin text-primary flex-shrink-0" />
                            )}

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {receipt.file_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {receipt.ocr_status === "completed"
                                  ? "✓ Processing complete"
                                  : receipt.ocr_status === "failed"
                                    ? "✗ Processing failed"
                                    : receipt.ocr_status === "processing"
                                      ? "⏳ Processing with AI..."
                                      : "⏳ Queued for processing"}
                              </p>
                            </div>

                            <p className="text-xs text-muted-foreground">
                              {new Date(receipt.created_at).toLocaleTimeString()}
                            </p>
                          </div>

                          {/* OCR Data Display */}
                          {receipt.ocr_status === "completed" && receipt.ocr_data && (
                            <div className="px-3 pb-3 pt-1 border-t border-background/50">
                              {linkedReceipts.has(receipt.id) && (
                                <div className="flex items-center gap-2 mb-2 px-2 py-1 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded text-xs text-green-700 dark:text-green-300">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span className="font-medium">Linked to transaction</span>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                                {receipt.ocr_data.merchant && (
                                  <div>
                                    <span className="text-muted-foreground">Merchant:</span>
                                    <span className="ml-1 font-medium">{receipt.ocr_data.merchant}</span>
                                  </div>
                                )}
                                {receipt.ocr_data.total && (
                                  <div>
                                    <span className="text-muted-foreground">Amount:</span>
                                    <span className="ml-1 font-medium">${receipt.ocr_data.total.toFixed(2)}</span>
                                  </div>
                                )}
                                {receipt.ocr_data.date && (
                                  <div>
                                    <span className="text-muted-foreground">Date:</span>
                                    <span className="ml-1 font-medium">{receipt.ocr_data.date}</span>
                                  </div>
                                )}
                                {receipt.ocr_data.categoryName && (
                                  <div>
                                    <span className="text-muted-foreground">Category:</span>
                                    <span className="ml-1 font-medium">{receipt.ocr_data.categoryName}</span>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons - Only show if not linked */}
                              {!linkedReceipts.has(receipt.id) && (
                                <>
                                  {linkingReceiptId === receipt.id ? (
                                    <div className="space-y-2">
                                      <Label className="text-xs">Link to existing transaction</Label>
                                      <Select
                                        value={selectedTransactionId}
                                        onValueChange={setSelectedTransactionId}
                                      >
                                        <SelectTrigger className="h-8 text-xs">
                                          <SelectValue placeholder="Select a transaction" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {transactions
                                            .filter((t) => t.userId === user?.id)
                                            .slice(0, 20)
                                            .map((transaction) => (
                                              <SelectItem
                                                key={transaction.id}
                                                value={transaction.id}
                                              >
                                                {transaction.merchant || transaction.description} - $
                                                {transaction.amount.toFixed(2)} ({new Date(transaction.date).toLocaleDateString()})
                                              </SelectItem>
                                            ))}
                                        </SelectContent>
                                      </Select>
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          className="h-7 text-xs flex-1"
                                          onClick={() =>
                                            handleLinkTransaction(
                                              receipt.id,
                                              selectedTransactionId
                                            )
                                          }
                                        >
                                          Link
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 text-xs"
                                          onClick={() => {
                                            setLinkingReceiptId(null);
                                            setSelectedTransactionId("");
                                          }}
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        className="h-7 text-xs flex-1"
                                        onClick={() => handleCreateTransaction(receipt)}
                                      >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Create Transaction
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs flex-1"
                                        onClick={() => setLinkingReceiptId(receipt.id)}
                                      >
                                        <Link2 className="w-3 h-3 mr-1" />
                                        Link to Existing
                                      </Button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}

                          {/* OCR Error Display */}
                          {receipt.ocr_status === "failed" && receipt.ocr_error && (
                            <div className="px-3 pb-3 pt-1 border-t border-background/50">
                              <p className="text-xs text-destructive">
                                Error: {receipt.ocr_error}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {receipts && receipts.receipts.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 space-y-2">
                    <Smartphone className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium">
                      Waiting for receipts...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Scan the QR code with your phone to start uploading
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tips */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>💡 Tips:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Receipts appear on your main receipts page instantly</li>
                <li>AI extraction happens automatically in the background</li>
                <li>Extracted data shows here when processing completes</li>
                <li>Session expires in 15 minutes</li>
                <li>You can close this dialog - receipts are already saved</li>
              </ul>
            </div>

            {/* Done Button */}
            <Button
              className="w-full"
              onClick={() => handleOpenChange(false)}
              disabled={!receipts || receipts.receipts.length === 0}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Done ({receipts?.receipts.length || 0} uploaded)
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
