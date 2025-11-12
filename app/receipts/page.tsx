"use client";

import { useEffect, useRef, useState } from "react";
import { AppLayout } from "@/components/app-layout";
import gsap from "gsap";
import { ReceiptUpload } from "@/components/receipt-upload";
import { ReceiptViewerDialog } from "@/components/receipt-viewer-dialog";
import { QRReceiptUpload } from "@/components/qr-receipt-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, Trash2, Link as LinkIcon, Image as ImageIcon, Upload } from "lucide-react";
import { format } from "date-fns";
import { useReceiptStore } from "@/lib/stores/receipt-store";
import { useTransactionStore } from "@/lib/stores/transaction-store";
import { useUserStore } from "@/lib/stores/user-store";
import { toast } from "sonner";
import { Receipt } from "@/lib/types";

export default function ReceiptsPage() {
  const { user } = useUserStore();
  const allReceipts = useReceiptStore((state) => state.receipts);
  const allTransactions = useTransactionStore((state) => state.transactions);

  // Filter receipts and transactions for current user
  const receipts = user?.id
    ? allReceipts.filter(r => r.userId === user.id)
    : [];
  const transactions = user?.id
    ? allTransactions.filter(t => t.userId === user.id)
    : [];

  const deleteReceipt = useReceiptStore((state) => state.deleteReceipt);
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, {
        opacity: 0,
        y: -20,
        duration: 0.6,
        ease: "power3.out",
      });

      gsap.from(uploadRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.6,
        delay: 0.2,
        ease: "power3.out",
      });

      gsap.from(galleryRef.current?.querySelectorAll(".receipt-card") || [], {
        opacity: 0,
        scale: 0.9,
        duration: 0.6,
        delay: 0.4,
        stagger: 0.1,
        ease: "back.out(1.7)",
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-8">
        <div ref={headerRef} className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">Receipts</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              Upload and manage your receipt documents
            </p>
          </div>
          <QRReceiptUpload />
        </div>

        <div ref={uploadRef}>
          <ReceiptUpload />
        </div>

        <Card ref={galleryRef} className="border-0 bg-white dark:bg-zinc-950 shadow-sm">
          <CardHeader className="border-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white">
                Receipt Gallery ({receipts.length})
              </CardTitle>
              {receipts.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {receipts.filter(r => r.transactionId).length} linked
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {receipts.length === 0 ? (
                <div className="col-span-full text-center py-16">
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/30">
                      <Upload className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-zinc-900 dark:text-white">
                        No receipts yet
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Upload your first receipt to get started
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                receipts.map((receipt) => {
                  const linkedTransaction = receipt.transactionId
                    ? transactions.find((t) => t.id === receipt.transactionId)
                    : null;

                  const isImage = receipt.imageUrl.startsWith("data:image/");
                  const isPDF = receipt.fileType === "application/pdf";

                  return (
                    <Card key={receipt.id} className="receipt-card border-0 hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="mb-4 flex h-40 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                          {isImage ? (
                            <img
                              src={receipt.thumbnailUrl || receipt.imageUrl}
                              alt={receipt.fileName}
                              className="h-full w-full object-cover"
                            />
                          ) : isPDF ? (
                            <FileText className="h-12 w-12 text-red-500" />
                          ) : (
                            <ImageIcon className="h-12 w-12 text-muted-foreground" />
                          )}
                        </div>
                        <div className="space-y-2">
                          <h3 className="truncate font-semibold text-sm text-zinc-900 dark:text-white">
                            {receipt.fileName}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {format(receipt.uploadDate, "MMM dd, yyyy")}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            {(receipt.fileSize / 1024).toFixed(1)} KB
                          </div>
                          {linkedTransaction ? (
                            <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                              <LinkIcon className="h-3 w-3" />
                              <span className="truncate">
                                {linkedTransaction.merchant || linkedTransaction.description}
                              </span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Unlinked
                            </Badge>
                          )}
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => setViewingReceipt(receipt)}
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                deleteReceipt(receipt.id);
                                toast.success("Receipt deleted");
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {viewingReceipt && (
          <ReceiptViewerDialog
            receipt={viewingReceipt}
            open={!!viewingReceipt}
            onOpenChange={(open) => !open && setViewingReceipt(null)}
          />
        )}
      </div>
    </AppLayout>
  );
}
