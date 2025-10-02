
"use client";

import React, { useEffect, useMemo } from "react";
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
import { isEqual } from 'lodash';

interface SpendingChartProps {
  data: Transaction[];
  chartConfig: ChartConfig;
  onChartConfigChange: (config: ChartConfig) => void;
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

export function SpendingChart({ data, chartConfig, onChartConfigChange }: SpendingChartProps) {
  const aggregatedData = useMemo(() => data
    .reduce((acc, transaction) => {
      const existingCategory = acc.find(
        (item) => item.category === transaction.Category
      );
      if (existingCategory) {
        existingCategory.amount += transaction.Amount;
      } else {
        acc.push({
          category: transaction.Category,
          amount: transaction.Amount,
        });
      }
      return acc;
    }, [] as { category: string; amount: number }[])
    .sort((a, b) => b.amount - a.amount), [data]);
  
  useEffect(() => {
    const newChartConfig = aggregatedData.reduce((acc, item, index) => {
      acc[item.category] = {
        label: item.category,
        color: chartColors[index % chartColors.length],
      };
      return acc;
    }, {} as ChartConfig);

    // Deep compare to prevent infinite loops
    if (JSON.stringify(chartConfig) !== JSON.stringify(newChartConfig)) {
      onChartConfigChange(newChartConfig);
    }
  }, [aggregatedData, onChartConfigChange, chartConfig]);

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
                {aggregatedData.map((entry) => (
                  <Cell
                    key={`cell-${entry.category}`}
                    fill={chartConfig[entry.category]?.color}
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
