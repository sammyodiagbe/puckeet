"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "@/lib/types";

interface CategoryBreakdownChartProps {
  transactions: Transaction[];
}

const COLORS = [
  "#2563eb", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#6b7280", // gray
];

const CATEGORY_LABELS: Record<string, string> = {
  meals: "Meals & Entertainment",
  travel: "Travel",
  office_supplies: "Office Supplies",
  software: "Software",
  utilities: "Utilities",
  professional_services: "Professional Services",
  marketing: "Marketing",
  other: "Other",
};

export function CategoryBreakdownChart({
  transactions,
}: CategoryBreakdownChartProps) {
  // Calculate spending by category
  const categoryData = transactions.reduce((acc, transaction) => {
    if (transaction.category) {
      const category = transaction.category;
      acc[category] = (acc[category] || 0) + transaction.amount;
    }
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(categoryData).map(([category, amount]) => ({
    name: CATEGORY_LABELS[category] || category,
    value: Math.round(amount * 100) / 100,
  }));

  if (chartData.length === 0) {
    return (
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
        <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
          <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white">
            Category Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No categorized transactions yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
      <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
        <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white">
          Category Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
              }}
              formatter={(value: number) => `$${value.toFixed(2)}`}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: "12px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
