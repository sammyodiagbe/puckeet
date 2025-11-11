"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Receipt } from "@/lib/types";
import { format } from "date-fns";
import { Download, Link as LinkIcon, X } from "lucide-react";
import { useTransactionStore } from "@/lib/stores/transaction-store";
import { useReceiptStore } from "@/lib/stores/receipt-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface ReceiptViewerDialogProps {
  receipt: Receipt;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiptViewerDialog({
  receipt,
  open,
  onOpenChange,
}: ReceiptViewerDialogProps) {
  const transactions = useTransactionStore((state) => state.transactions);
  const linkReceiptToTransaction = useReceiptStore((state) => state.linkReceiptToTransaction);
  const unlinkReceiptFromTransaction = useReceiptStore((state) => state.unlinkReceiptFromTransaction);

  const [selectedTransactionId, setSelectedTransactionId] = useState<
    string | null
  >(receipt.transactionId || null);

  const linkedTransaction = receipt.transactionId
    ? transactions.find((t) => t.id === receipt.transactionId)
    : null;

  // Transactions that don't have this receipt linked
  const unlinkedTransactions = transactions.filter(
    (t) => !t.receiptIds.includes(receipt.id)
  );

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = receipt.imageUrl;
    link.download = receipt.fileName;
    link.click();
    toast.success("Receipt downloaded");
  };

  const handleLink = () => {
    if (selectedTransactionId) {
      linkReceiptToTransaction(receipt.id, selectedTransactionId);
      toast.success("Receipt linked to transaction");
    }
  };

  const handleUnlink = () => {
    unlinkReceiptFromTransaction(receipt.id);
    setSelectedTransactionId(null);
    toast.success("Receipt unlinked from transaction");
  };

  const isPDF = receipt.fileType === "application/pdf";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{receipt.fileName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Uploaded: {format(receipt.uploadDate, "PPP")}
              </p>
              <p className="text-xs text-muted-foreground">
                Size: {(receipt.fileSize / 1024).toFixed(1)} KB
              </p>
              {linkedTransaction && (
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-green-600" />
                  <span className="text-sm">
                    Linked to: {linkedTransaction.merchant || linkedTransaction.description} - $
                    {linkedTransaction.amount.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4">
            {isPDF ? (
              <div className="flex h-[500px] items-center justify-center">
                <iframe
                  src={receipt.imageUrl}
                  className="h-full w-full rounded-md"
                  title={receipt.fileName}
                />
              </div>
            ) : (
              <div className="flex justify-center">
                <img
                  src={receipt.imageUrl}
                  alt={receipt.fileName}
                  className="max-h-[500px] rounded-md object-contain"
                />
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <h3 className="font-semibold">Link to Transaction</h3>
            {linkedTransaction ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-md border bg-muted/50 p-3">
                  <div>
                    <p className="font-medium">{linkedTransaction.merchant || linkedTransaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(linkedTransaction.date, "PPP")} - $
                      {linkedTransaction.amount.toFixed(2)}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleUnlink}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Select
                    value={selectedTransactionId || undefined}
                    onValueChange={setSelectedTransactionId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a transaction" />
                    </SelectTrigger>
                    <SelectContent>
                      {unlinkedTransactions.map((transaction) => (
                        <SelectItem key={transaction.id} value={transaction.id}>
                          {transaction.merchant || transaction.description} - $
                          {transaction.amount.toFixed(2)} (
                          {format(transaction.date, "MMM dd")})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleLink}
                    disabled={!selectedTransactionId}
                  >
                    Link
                  </Button>
                </div>
                {unlinkedTransactions.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No unlinked transactions available
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
