
"use client";

import {
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartTooltipContent,
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart";
import type { Transaction } from "@/lib/data";

interface SpendingChartProps {
  data: Transaction[];
}

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#f59e0b", // amber-500
  "#10b981", // emerald-500
];

export function SpendingChart({ data }: SpendingChartProps) {
  const aggregatedData = data
    .reduce((acc, transaction) => {
      const existingCategory = acc.find(
        (item) => item.category === transaction.category
      );
      if (existingCategory) {
        existingCategory.amount += transaction.amount;
      } else {
        acc.push({
          category: transaction.category,
          amount: transaction.amount,
        });
      }
      return acc;
    }, [] as { category: string; amount: number }[])
    .sort((a, b) => b.amount - a.amount);
  
  const chartConfig = aggregatedData.reduce((acc, item, index) => {
    acc[item.category] = {
      label: item.category,
      color: chartColors[index % chartColors.length],
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories Budget</CardTitle>
        <CardDescription>
          Current spending for each category.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full h-[250px]">
          <ResponsiveContainer>
            <PieChart>
              <Tooltip
                cursor={{ fill: "hsl(var(--accent))", radius: 4 }}
                content={<ChartTooltipContent indicator="dot" hideLabel />}
              />
              <Pie
                data={aggregatedData}
                dataKey="amount"
                nameKey="category"
                innerRadius={60}
                strokeWidth={5}
              >
                {aggregatedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={chartColors[index % chartColors.length]}
                  />
                ))}
              </Pie>
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                iconSize={8}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
