"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { useReceiptStore } from "@/lib/stores/receipt-store";
import { useUserStore } from "@/lib/stores/user-store";

interface ReceiptUploadProps {
  onUpload?: () => void;
}

export function ReceiptUpload({ onUpload }: ReceiptUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const addReceipt = useReceiptStore((state) => state.addReceipt);
  const { user } = useUserStore();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/") || file.type === "application/pdf"
    );

    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
      toast.success(`${files.length} file(s) selected`);
    } else {
      toast.error("Please upload images or PDF files only");
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        setSelectedFiles((prev) => [...prev, ...files]);
        toast.success(`${files.length} file(s) selected`);
      }
    },
    []
  );

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    if (!user?.id) {
      toast.error("You must be logged in to upload receipts");
      return;
    }

    setIsUploading(true);

    try {
      for (const file of selectedFiles) {
        let imageUrl: string;
        let thumbnailUrl: string | undefined;

        if (file.type.startsWith("image/")) {
          // Compress image
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          };

          const compressedFile = await imageCompression(file, options);

          // Create thumbnail
          const thumbnailOptions = {
            maxSizeMB: 0.1,
            maxWidthOrHeight: 300,
            useWebWorker: true,
          };
          const thumbnailFile = await imageCompression(file, thumbnailOptions);

          // Convert to base64
          imageUrl = await imageCompression.getDataUrlFromFile(compressedFile);
          thumbnailUrl = await imageCompression.getDataUrlFromFile(
            thumbnailFile
          );
        } else {
          // For PDFs, just convert to base64
          imageUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        }

        addReceipt({
          imageUrl,
          thumbnailUrl,
          fileName: file.name,
          uploadDate: new Date(),
          fileSize: file.size,
          fileType: file.type,
          notes: undefined,
        }, user.id);
      }

      toast.success(`${selectedFiles.length} receipt(s) uploaded successfully`);
      onUpload?.();
      setSelectedFiles([]);
    } catch (error) {
      console.error("Error uploading receipts:", error);
      toast.error("Failed to upload some receipts");
    } finally {
      setIsUploading(false);
    }
  }, [selectedFiles, onUpload, addReceipt, user]);

  return (
    <Card className="border-0 bg-white dark:bg-zinc-950 shadow-sm">
      <CardContent className="p-8">
        <div
          className={`relative rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Upload Receipts</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Drag and drop your receipt images or PDFs here, or click to browse
          </p>
          <input
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-6 space-y-2">
            <h4 className="font-semibold">Selected Files ({selectedFiles.length})</h4>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-md border p-2"
                >
                  <span className="text-sm truncate">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              onClick={handleUpload}
              className="w-full"
              disabled={isUploading}
            >
              {isUploading
                ? "Uploading..."
                : `Upload ${selectedFiles.length} File(s)`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
