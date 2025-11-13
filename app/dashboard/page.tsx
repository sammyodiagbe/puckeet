"use client";

import { useEffect, useRef } from "react";
import { AppLayout } from "@/components/app-layout";
import { StatCard } from "@/components/stat-card";
import { AddTransactionDialog } from "@/components/add-transaction-dialog";
import { MonthlySpendingChart } from "@/components/monthly-spending-chart";
import { CategoryBreakdownChart } from "@/components/category-breakdown-chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  FileText,
  DollarSign,
  TrendingUp,
  Plus,
  Upload,
} from "lucide-react";
import { useTransactionStore } from "@/lib/stores/transaction-store";
import { useUserStore } from "@/lib/stores/user-store";
import { format } from "date-fns";
import Link from "next/link";
import gsap from "gsap";

export default function DashboardPage() {
  const { user: localUser } = useUserStore();
  const allTransactions = useTransactionStore((state) => state.transactions);

  // Filter transactions for current user
  const transactions = localUser?.id
    ? allTransactions.filter(t => t.userId === localUser.id)
    : [];

  const headerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate header
      gsap.from(headerRef.current, {
        opacity: 0,
        y: -20,
        duration: 0.6,
        ease: "power3.out",
      });

      // Animate stat cards
      gsap.from(statsRef.current?.children || [], {
        opacity: 0,
        y: 30,
        duration: 0.8,
        stagger: 0.1,
        delay: 0.2,
        ease: "power3.out",
      });

      // Animate charts
      gsap.from(chartsRef.current?.children || [], {
        opacity: 0,
        y: 30,
        duration: 0.8,
        stagger: 0.1,
        delay: 0.6,
        ease: "power3.out",
      });

      // Animate table
      gsap.from(tableRef.current, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        delay: 0.9,
        ease: "power3.out",
      });
    });

    return () => ctx.revert();
  }, []);

  const stats = {
    totalTransactions: transactions.length,
    deductible: transactions.filter((t) => t.isDeductible).length,
    pending: transactions.filter((t) => t.status === "pending").length,
    totalExpenses: transactions.reduce((sum, t) => sum + t.amount, 0),
  };

  const recentTransactions = transactions.slice(0, 5);

  return (
    <AppLayout>
      <div className="space-y-8">
        <div ref={headerRef} className="space-y-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {format(new Date(), "EEEE, do MMMM")}
          </p>
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Good Evening, {localUser?.name?.split(' ')[0] || localUser?.email?.split('@')[0] || 'there'}
            </h1>
            <div className="flex gap-3">
              <AddTransactionDialog>
                <Button variant="outline" className="rounded-lg border-zinc-200 dark:border-zinc-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Transaction
                </Button>
              </AddTransactionDialog>
              <Link href="/receipts">
                <Button variant="outline" className="rounded-lg border-zinc-200 dark:border-zinc-700">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Receipt
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex gap-6 pt-2">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">{stats.deductible}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Deductible</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/30">
                <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">{stats.pending}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Need Review</p>
              </div>
            </div>
          </div>
        </div>

        <div ref={statsRef} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total Transactions"
            value={stats.totalTransactions}
            description="All recorded transactions"
            icon={CreditCard}
          />
          <StatCard
            title="Deductible"
            value={stats.deductible}
            description="Tax deductible expenses"
            icon={FileText}
          />
          <StatCard
            title="Total Expenses"
            value={`$${stats.totalExpenses.toFixed(2)}`}
            description="Total amount spent"
            icon={DollarSign}
          />
        </div>

        <div ref={chartsRef} className="grid gap-6 md:grid-cols-2">
          <MonthlySpendingChart transactions={transactions} />
          <CategoryBreakdownChart transactions={transactions} />
        </div>

        <Card ref={tableRef} className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
          <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-zinc-900 dark:text-white">Recent Transactions</CardTitle>
              <Link href="/transactions">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                  See All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                      No transactions yet. Add your first transaction to get started!
                    </TableCell>
                  </TableRow>
                ) : (
                  recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {format(transaction.date, "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.merchant || transaction.description}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400 border-0 capitalize">
                          {transaction.category.replace(/-/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-zinc-900 dark:text-white">
                        ${transaction.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            transaction.status === "reviewed"
                              ? "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-400 border-0 capitalize"
                              : transaction.status === "categorized"
                              ? "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400 border-0 capitalize"
                              : "bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-950/30 dark:text-orange-400 border-0 capitalize"
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
