"use client";

import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, FileText, AlertCircle, CheckCircle2, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ExportSummary {
  totalTransactions: number;
  totalAmount: number;
  totalGstHst: number;
  deductibleAmount: number;
  nonDeductibleAmount: number;
  categoryBreakdown: {
    lineNumber: string;
    categoryName: string;
    amount: number;
    transactionCount: number;
  }[];
  warnings: string[];
}

export default function ExportsPage() {
  const currentYear = new Date().getFullYear();
  const [taxYear, setTaxYear] = useState(currentYear);
  const [format, setFormat] = useState<"csv" | "csv-summary">("csv");
  const [includeNonDeductible, setIncludeNonDeductible] = useState(false);
  const [requireReceipts, setRequireReceipts] = useState(false);
  const [applyMealsDeduction, setApplyMealsDeduction] = useState(true);
  const [includeGSTBreakdown, setIncludeGSTBreakdown] = useState(true);

  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [summary, setSummary] = useState<ExportSummary | null>(null);

  // Generate available years (current year and past 6 years)
  const availableYears = Array.from({ length: 7 }, (_, i) => currentYear - i);

  const handlePreview = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/exports/generate?taxYear=${taxYear}`);
      const data = await response.json();

      if (response.ok) {
        setPreviewData(data);
        toast.success("Preview loaded successfully");
      } else {
        toast.error(data.error || "Failed to load preview");
      }
    } catch (error) {
      console.error("Preview error:", error);
      toast.error("Failed to load preview");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setSummary(null);

    try {
      const response = await fetch("/api/exports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taxYear,
          format,
          includeNonDeductible,
          requireReceipts,
          options: {
            applyMealsDeduction,
            includeGSTBreakdown,
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSummary(data.summary);

        // Download the file
        if (data.fileUrl) {
          window.open(data.fileUrl, "_blank");
          toast.success("Export generated successfully!");
        }
      } else {
        if (response.status === 404) {
          toast.error("No transactions found for the selected criteria");
        } else {
          toast.error(data.error || "Failed to generate export");
        }
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to generate export");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Export Tax Documents</h1>
          <p className="text-muted-foreground">
            Generate CRA-compliant expense reports for tax filing
          </p>
        </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
          <CardDescription>
            Configure your export settings for CRA Form T2125 compliance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tax Year Selection */}
          <div className="space-y-2 w-full">
            <Label htmlFor="tax-year">Tax Year</Label>
            <Select
              value={taxYear.toString()}
              onValueChange={(value) => setTaxYear(parseInt(value))}
              
            >
              <SelectTrigger id="tax-year w-full">
                <SelectValue placeholder="Select tax year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Exports all transactions from January 1 to December 31, {taxYear}
            </p>
          </div>

          {/* Export Format */}
          <div className="space-y-2">
            <Label htmlFor="format">Export Format</Label>
            <Select
              value={format}
              onValueChange={(value: any) => setFormat(value)}
            >
              <SelectTrigger id="format w-full">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>CSV - Detailed (recommended)</span>
                  </div>
                </SelectItem>
                <SelectItem value="csv-summary">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>CSV - Summary by Category</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filters */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">Filters</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="deductible">Include non-deductible expenses</Label>
                <p className="text-sm text-muted-foreground">
                  Include personal and non-business expenses
                </p>
              </div>
              <Switch
                id="deductible"
                checked={includeNonDeductible}
                onCheckedChange={setIncludeNonDeductible}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="receipts">Only transactions with receipts</Label>
                <p className="text-sm text-muted-foreground">
                  Exclude transactions without receipt attachments
                </p>
              </div>
              <Switch
                id="receipts"
                checked={requireReceipts}
                onCheckedChange={setRequireReceipts}
              />
            </div>
          </div>

          {/* Advanced Options */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">Tax Calculations</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="meals">Apply 50% meals deduction</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically apply CRA 50% rule for meals & entertainment
                </p>
              </div>
              <Switch
                id="meals"
                checked={applyMealsDeduction}
                onCheckedChange={setApplyMealsDeduction}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="gst">Include GST/HST breakdown</Label>
                <p className="text-sm text-muted-foreground">
                  Show separate GST/HST amounts for Input Tax Credits
                </p>
              </div>
              <Switch
                id="gst"
                checked={includeGSTBreakdown}
                onCheckedChange={setIncludeGSTBreakdown}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              Preview
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Generate Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Statistics */}
      {previewData && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Export Preview - {taxYear}</CardTitle>
            <CardDescription>
              Overview of transactions that will be included
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">
                  {previewData.statistics?.totalTransactions || 0}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Deductible</p>
                <p className="text-2xl font-bold text-green-600">
                  {previewData.statistics?.deductibleTransactions || 0}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">
                  ${previewData.statistics?.totalAmount?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Deductible Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  ${previewData.statistics?.deductibleAmount?.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Export Complete
            </CardTitle>
            <CardDescription>
              Your export has been generated successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{summary.totalTransactions}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">
                  ${summary.totalAmount.toFixed(2)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">GST/HST</p>
                <p className="text-2xl font-bold">
                  ${summary.totalGstHst.toFixed(2)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Deductible</p>
                <p className="text-2xl font-bold text-green-600">
                  ${summary.deductibleAmount.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Warnings */}
            {summary.warnings && summary.warnings.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {summary.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Category Breakdown */}
            <div className="space-y-2">
              <h3 className="font-semibold">Category Breakdown</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium">Line #</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">Category</th>
                      <th className="px-4 py-2 text-right text-sm font-medium">Count</th>
                      <th className="px-4 py-2 text-right text-sm font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {summary.categoryBreakdown.map((cat, index) => (
                      <tr key={index} className="hover:bg-muted/50">
                        <td className="px-4 py-2 text-sm font-mono">{cat.lineNumber}</td>
                        <td className="px-4 py-2 text-sm">{cat.categoryName}</td>
                        <td className="px-4 py-2 text-sm text-right">{cat.transactionCount}</td>
                        <td className="px-4 py-2 text-sm text-right font-medium">
                          ${cat.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </AppLayout>
  );
}
