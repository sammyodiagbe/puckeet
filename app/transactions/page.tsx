"use client";

import { useEffect, useState, useRef } from "react";
import { AppLayout } from "@/components/app-layout";
import { AddTransactionDialog } from "@/components/add-transaction-dialog";
import gsap from "gsap";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, Edit, Trash2 } from "lucide-react";
import { useTransactionStore } from "@/lib/stores/transaction-store";
import { useCategoryStore } from "@/lib/stores/category-store";
import { useUserStore } from "@/lib/stores/user-store";
import { format } from "date-fns";
import { toast } from "sonner";
import { Transaction } from "@/lib/types";

const statuses = ["all", "pending", "categorized", "reviewed"];

export default function TransactionsPage() {
  const { user } = useUserStore();
  const allTransactions = useTransactionStore((state) => state.transactions);

  // Filter transactions for current user
  const transactions = user?.id
    ? allTransactions.filter(t => t.userId === user.id)
    : [];

  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction);
  const categories = useCategoryStore((state) => state.categories);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, {
        opacity: 0,
        y: -20,
        duration: 0.6,
        ease: "power3.out",
      });

      gsap.from(filterRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.6,
        delay: 0.2,
        ease: "power3.out",
      });

      gsap.from(tableRef.current, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        delay: 0.4,
        ease: "power3.out",
      });
    });

    return () => ctx.revert();
  }, []);

  const displayTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      (transaction.merchant?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      selectedCategory === "all" || transaction.category === selectedCategory;
    const matchesStatus =
      selectedStatus === "all" || transaction.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    toast.success("Transaction deleted successfully");
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div ref={headerRef} className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">Transactions</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              Manage and categorize your expenses
            </p>
          </div>
          <AddTransactionDialog />
        </div>

        <Card ref={filterRef} className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
          <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
            <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white">Filter Transactions</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status === "all" ? "All Statuses" : status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card ref={tableRef} className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deductible</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  displayTransactions.map((transaction) => {
                    const category = categories.find(c => c.id === transaction.category);
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(transaction.date, "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {transaction.merchant || "-"}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {transaction.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {category?.name || transaction.category.replace(/-/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${transaction.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.status === "reviewed"
                                ? "default"
                                : transaction.status === "categorized"
                                ? "secondary"
                                : "destructive"
                            }
                            className="capitalize"
                          >
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {transaction.isDeductible ? (
                            <Badge variant="default">Yes</Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <AddTransactionDialog transaction={transaction}>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </AddTransactionDialog>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(transaction.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {displayTransactions.length} of {transactions.length}{" "}
            transactions
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
