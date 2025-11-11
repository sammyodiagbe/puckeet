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
  "#3B82F6", // blue-500
  "#10B981", // emerald-500
  "#F59E0B", // amber-500
  "#EF4444", // red-500
  "#8B5CF6", // violet-500
  "#EC4899", // pink-500
  "#14B8A6", // teal-500
  "#F97316", // orange-500
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
      <Card className="border-0 bg-white dark:bg-zinc-950 shadow-sm">
        <CardHeader className="border-0">
          <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white">
            Category Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex h-[350px] items-center justify-center text-muted-foreground">
            No categorized transactions yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-white dark:bg-zinc-950 shadow-sm">
      <CardHeader className="border-0">
        <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white">
          Category Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius={70}
              outerRadius={110}
              fill="#8884d8"
              paddingAngle={2}
              dataKey="value"
              label={false}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
                padding: "8px 12px",
              }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, "Amount"]}
            />
            <Legend
              verticalAlign="bottom"
              height={60}
              iconType="circle"
              wrapperStyle={{
                fontSize: "13px",
                paddingTop: "10px",
              }}
              formatter={(value, entry: any) => {
                const percentage = ((entry.payload.value / chartData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1);
                return (
                  <span style={{ color: "hsl(var(--foreground))" }}>
                    {value} ({percentage}%)
                  </span>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
