"use client";

import { useEffect, useRef, useState } from "react";
import { AppLayout } from "@/components/app-layout";
import gsap from "gsap";
import { ReceiptUpload } from "@/components/receipt-upload";
import { ReceiptViewerDialog } from "@/components/receipt-viewer-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, Trash2, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { mockReceipts, mockTransactions } from "@/lib/mock-data";
import { format } from "date-fns";
import { useReceiptStore } from "@/lib/stores/receipt-store";
import { useTransactionStore } from "@/lib/stores/transaction-store";
import { toast } from "sonner";
import { Receipt } from "@/lib/types";

export default function ReceiptsPage() {
  const { receipts, setReceipts, deleteReceipt } = useReceiptStore();
  const { transactions } = useTransactionStore();
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize with mock data if empty
    if (receipts.length === 0) {
      setReceipts(mockReceipts);
    }
  }, [receipts.length, setReceipts]);

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
        </div>

        <div ref={uploadRef}>
          <ReceiptUpload />
        </div>

        <Card ref={galleryRef} className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
          <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
            <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white">Receipt Gallery ({receipts.length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {receipts.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">
                    No receipts uploaded yet. Upload your first receipt above!
                  </p>
                </div>
              ) : (
                receipts.map((receipt) => {
                  const linkedTransaction = transactions.find(
                    (t) => t.id === receipt.transactionId
                  );

                  const isImage = receipt.thumbnailUrl || receipt.fileUrl.startsWith("data:image/");

                  return (
                    <Card key={receipt.id} className="receipt-card">
                      <CardContent className="p-4">
                        <div className="mb-4 flex h-32 items-center justify-center rounded-md bg-muted overflow-hidden">
                          {isImage && receipt.thumbnailUrl ? (
                            <img
                              src={receipt.thumbnailUrl}
                              alt={receipt.fileName}
                              className="h-full w-full object-cover"
                            />
                          ) : isImage ? (
                            <ImageIcon className="h-12 w-12 text-muted-foreground" />
                          ) : (
                            <FileText className="h-12 w-12 text-muted-foreground" />
                          )}
                        </div>
                        <div className="space-y-2">
                          <h3 className="truncate font-semibold text-sm">
                            {receipt.fileName}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Uploaded: {format(receipt.uploadDate, "MMM dd, yyyy")}
                          </p>
                          {linkedTransaction && (
                            <div className="flex items-center gap-1 text-xs">
                              <LinkIcon className="h-3 w-3" />
                              <span className="truncate">
                                {linkedTransaction.merchant}
                              </span>
                            </div>
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
                              className="text-destructive"
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
