"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "@/lib/types";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface MonthlySpendingChartProps {
  transactions: Transaction[];
}

export function MonthlySpendingChart({
  transactions,
}: MonthlySpendingChartProps) {
  // Generate data for the last 6 months
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(new Date(), i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    const monthTransactions = transactions.filter(
      (t) => t.date >= monthStart && t.date <= monthEnd
    );

    const totalAmount = monthTransactions.reduce((sum, t) => sum + t.amount, 0);

    monthlyData.push({
      month: format(monthDate, "MMM"),
      amount: Math.round(totalAmount * 100) / 100,
    });
  }

  return (
    <Card className="border-0 bg-white dark:bg-zinc-950 shadow-sm">
      <CardHeader className="border-0">
        <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white">
          Monthly Spending Trend
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="rgb(37, 99, 235)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="rgb(37, 99, 235)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
            <XAxis
              dataKey="month"
              className="text-xs"
              tick={{ fill: "currentColor" }}
              axisLine={false}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "currentColor" }}
              tickFormatter={(value) => `$${value}`}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
              }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, "Amount"]}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="rgb(37, 99, 235)"
              strokeWidth={2}
              fill="url(#colorAmount)"
              dot={{ fill: "rgb(37, 99, 235)", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
