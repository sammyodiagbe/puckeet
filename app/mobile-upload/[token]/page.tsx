"use client";

import { useState, useRef, use } from "react";
import { Camera, Upload, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function MobileUploadPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ name: string; status: "success" | "error"; message?: string }>
  >([]);
  const [sessionExpired, setSessionExpired] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`/api/upload-sessions/${token}/upload`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          setUploadedFiles((prev) => [
            ...prev,
            { name: file.name, status: "success" },
          ]);
          toast.success(`${file.name} uploaded successfully!`);
        } else {
          if (data.error?.code === "SESSION_EXPIRED") {
            setSessionExpired(true);
            toast.error("Session expired. Please scan a new QR code.");
            break;
          }
          setUploadedFiles((prev) => [
            ...prev,
            {
              name: file.name,
              status: "error",
              message: data.error?.message || "Upload failed",
            },
          ]);
          toast.error(`Failed to upload ${file.name}`);
        }
      } catch (error) {
        console.error("Upload error:", error);
        setUploadedFiles((prev) => [
          ...prev,
          { name: file.name, status: "error", message: "Network error" },
        ]);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setUploading(false);

    // Clear file input
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  if (sessionExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
              <h1 className="text-2xl font-bold">Session Expired</h1>
              <p className="text-muted-foreground">
                This upload link has expired. Please scan a new QR code from your desktop.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">📸 Upload Receipts</h1>
        <p className="text-sm opacity-90">
          Take photos or select receipts from your gallery
        </p>
      </div>

      <div className="container max-w-2xl mx-auto p-4 space-y-4">
        {/* Upload Buttons */}
        <div className="grid grid-cols-2 gap-4">
          {/* Camera Button */}
          <Button
            size="lg"
            className="h-32 flex-col gap-2"
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
          >
            <Camera className="w-8 h-8" />
            <span className="text-base">Take Photo</span>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
              multiple
            />
          </Button>

          {/* Gallery Button */}
          <Button
            size="lg"
            variant="outline"
            className="h-32 flex-col gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="w-8 h-8" />
            <span className="text-base">From Gallery</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
              multiple
            />
          </Button>
        </div>

        {/* Upload Status */}
        {uploading && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span>Uploading...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h2 className="font-semibold mb-4">
                Uploaded ({uploadedFiles.length})
              </h2>
              <div className="space-y-3">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted"
                  >
                    {file.status === "success" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      {file.status === "success" ? (
                        <p className="text-xs text-green-600">
                          ✓ Uploaded • AI processing...
                        </p>
                      ) : (
                        <p className="text-xs text-destructive">
                          {file.message || "Upload failed"}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">💡 Tips</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Receipts appear on your desktop instantly!</li>
              <li>• Make sure receipt is clearly visible and well-lit</li>
              <li>• Hold phone parallel to receipt</li>
              <li>• Upload multiple receipts at once</li>
              <li>• AI extracts data automatically in the background</li>
            </ul>
          </CardContent>
        </Card>

        {/* Done Button */}
        {uploadedFiles.length > 0 && (
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              toast.success(
                `${uploadedFiles.length} receipt${uploadedFiles.length > 1 ? "s" : ""} saved to desktop! AI is extracting data...`,
                { duration: 4000 }
              );
            }}
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            All Done ({uploadedFiles.filter(f => f.status === "success").length} saved)
          </Button>
        )}
      </div>
    </div>
  );
}
