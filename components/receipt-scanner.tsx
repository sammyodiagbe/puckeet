"use client";

import { useState, useCallback } from "react";
import { quickScanReceipt, QuickOCRResult } from "@/lib/ocr-client";
import { Loader2, CheckCircle2, AlertCircle, Zap } from "lucide-react";

interface ReceiptScannerProps {
  file: File;
  onScanComplete?: (result: QuickOCRResult) => void;
  onError?: (error: Error) => void;
}

export function ReceiptScanner({
  file,
  onScanComplete,
  onError,
}: ReceiptScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<QuickOCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startScan = useCallback(async () => {
    setScanning(true);
    setError(null);
    setProgress(0);

    try {
      const scanResult = await quickScanReceipt(file, (p) => {
        setProgress(p);
      });

      setResult(scanResult);
      setScanning(false);
      onScanComplete?.(scanResult);
    } catch (err: any) {
      const errorMsg = err.message || "Failed to scan receipt";
      setError(errorMsg);
      setScanning(false);
      onError?.(err);
    }
  }, [file, onScanComplete, onError]);

  // Auto-start scan when component mounts
  useState(() => {
    startScan();
  });

  if (scanning) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <div className="text-center">
          <p className="text-sm font-medium">Scanning receipt preview...</p>
          <p className="text-xs text-muted-foreground mt-1">
            {progress}% complete
          </p>
        </div>
        <div className="w-full max-w-xs bg-secondary rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-6 space-y-3">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <div className="text-center">
          <p className="text-sm font-medium text-destructive">
            Preview scan failed
          </p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Don't worry! AI processing will still extract data accurately.
          </p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold text-sm">Quick Preview</h3>
          <span className="ml-auto text-xs text-muted-foreground">
            ~{result.confidence}% confident
          </span>
        </div>

        <div className="space-y-2 text-sm">
          {result.merchant && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Merchant:</span>
              <span className="font-medium">{result.merchant}</span>
            </div>
          )}

          {result.amount && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-medium">${result.amount.toFixed(2)}</span>
            </div>
          )}

          {result.date && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{result.date}</span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>AI is processing for accurate results...</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

interface AIProcessingStatusProps {
  receiptId: string;
  onComplete?: (ocrData: any) => void;
}

export function AIProcessingStatus({
  receiptId,
  onComplete,
}: AIProcessingStatusProps) {
  const [status, setStatus] = useState<"processing" | "completed" | "failed">(
    "processing"
  );
  const [ocrData, setOcrData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Poll for OCR status
  useState(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/receipts/${receiptId}/ocr-status`);
        const data = await response.json();

        if (data.success) {
          if (data.data.status === "completed") {
            setStatus("completed");
            setOcrData(data.data.ocr_data);
            onComplete?.(data.data.ocr_data);
          } else if (data.data.status === "failed") {
            setStatus("failed");
            setError(data.data.error);
          } else {
            // Still processing, check again in 2 seconds
            setTimeout(checkStatus, 2000);
          }
        }
      } catch (err) {
        console.error("Failed to check OCR status:", err);
        setTimeout(checkStatus, 3000); // Retry
      }
    };

    // Start checking after a brief delay
    const timer = setTimeout(checkStatus, 1000);
    return () => clearTimeout(timer);
  });

  if (status === "processing") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>AI is extracting detailed data...</span>
      </div>
    );
  }

  if (status === "completed" && ocrData) {
    return (
      <div className="rounded-lg border bg-green-50 dark:bg-green-950/20 p-4 space-y-3">
        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
          <CheckCircle2 className="w-5 h-5" />
          <h3 className="font-semibold text-sm">Receipt Processed!</h3>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Merchant:</span>
            <span className="font-medium">{ocrData.merchant}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Date:</span>
            <span className="font-medium">{ocrData.date}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-medium">${ocrData.total.toFixed(2)}</span>
          </div>

          {ocrData.categoryName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category:</span>
              <span className="font-medium">{ocrData.categoryName}</span>
            </div>
          )}

          {ocrData.items && ocrData.items.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">
                Items found: {ocrData.items.length}
              </p>
              <div className="space-y-1">
                {ocrData.items.slice(0, 3).map((item: any, i: number) => (
                  <div key={i} className="text-xs flex justify-between">
                    <span>{item.description}</span>
                    {item.price && (
                      <span className="text-muted-foreground">
                        ${item.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                ))}
                {ocrData.items.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{ocrData.items.length - 3} more items
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          Confidence: {ocrData.confidence}%
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="rounded-lg border bg-destructive/10 p-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <div>
            <p className="font-semibold text-sm">Processing failed</p>
            <p className="text-xs mt-1">{error || "Unknown error occurred"}</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
