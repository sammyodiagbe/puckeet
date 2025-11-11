"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Download, FileText, Calendar as CalendarIcon } from "lucide-react";
import { useTransactionStore } from "@/lib/stores/transaction-store";
import { mockTransactions } from "@/lib/mock-data";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ReportsPage() {
  const { transactions, setTransactions } = useTransactionStore();
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(2025, 0, 1)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [exportFormat, setExportFormat] = useState("csv");
  const [taxRelevantOnly, setTaxRelevantOnly] = useState(true);

  useEffect(() => {
    setTransactions(mockTransactions);
  }, [setTransactions]);

  const filteredTransactions = transactions.filter((t) => {
    const inDateRange =
      (!startDate || t.date >= startDate) && (!endDate || t.date <= endDate);
    const matchesTaxFilter = !taxRelevantOnly || t.isTaxRelevant;
    return inDateRange && matchesTaxFilter;
  });

  const totalAmount = filteredTransactions.reduce(
    (sum, t) => sum + t.amount,
    0
  );

  const categorySummary = filteredTransactions.reduce((acc, t) => {
    if (t.category) {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
    }
    return acc;
  }, {} as Record<string, number>);

  const handleExport = () => {
    const data = filteredTransactions.map((t) => ({
      date: format(t.date, "yyyy-MM-dd"),
      merchant: t.merchant,
      description: t.description,
      category: t.category || "Uncategorized",
      amount: t.amount,
      taxRelevant: t.isTaxRelevant ? "Yes" : "No",
    }));

    if (exportFormat === "csv") {
      const headers = Object.keys(data[0] || {}).join(",");
      const rows = data.map((row) => Object.values(row).join(","));
      const csv = [headers, ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `expenses-${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      toast.success("CSV file exported successfully");
    } else if (exportFormat === "json") {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `expenses-${format(new Date(), "yyyy-MM-dd")}.json`;
      a.click();
      toast.success("JSON file exported successfully");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">Reports</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              Generate and export expense reports for tax preparation
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
            <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
              <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white">Report Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Date Range</Label>
                <div className="grid gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "End date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Export Format</Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="pdf">PDF (Coming Soon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Filter Options</Label>
                <Select
                  value={taxRelevantOnly ? "tax-only" : "all"}
                  onValueChange={(value) =>
                    setTaxRelevantOnly(value === "tax-only")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Transactions</SelectItem>
                    <SelectItem value="tax-only">Tax Relevant Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleExport}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                disabled={filteredTransactions.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </CardContent>
          </Card>

          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
            <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
              <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white">Report Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Transactions
                </span>
                <Badge>{filteredTransactions.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Amount
                </span>
                <span className="text-2xl font-bold">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="space-y-2 pt-4">
                <Label>Expenses by Category</Label>
                {Object.entries(categorySummary).map(([category, amount]) => (
                  <div
                    key={category}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="capitalize">
                      {category.replace("_", " ")}
                    </span>
                    <span className="font-semibold">${amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
          <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
            <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white">Recent Reports</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold text-sm">
                      Q4 2024 Tax Report
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Generated on Dec 31, 2024
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold text-sm">
                      Q3 2024 Tax Report
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Generated on Sep 30, 2024
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
