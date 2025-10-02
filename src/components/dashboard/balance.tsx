
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ChevronDown } from "lucide-react";
import { type ChartConfig } from "../ui/chart";

interface BalanceProps {
  totalSpending: number;
  budget: number;
  aggregatedData: { category: string; amount: number }[];
  chartConfig: ChartConfig;
}

export function Balance({
  totalSpending,
  budget,
  aggregatedData,
  chartConfig,
}: BalanceProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const spendingPercentage = budget > 0 ? (totalSpending / budget) * 100 : 0;
  const isOverBudget = spendingPercentage >= 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending</CardTitle>
        <CardDescription>Your spending vs. budget for this period.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between items-baseline">
          <div className="text-3xl font-bold text-foreground">
            ${totalSpending.toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground">
            of ${budget.toFixed(2)}
          </div>
        </div>
        <Progress
          value={isOverBudget ? 100 : spendingPercentage}
          className={cn("h-3", isOverBudget && "[&>div]:bg-destructive")}
        />
        {isExpanded && (
          <div className="pt-2 space-y-2 animate-in fade-in-0">
            {aggregatedData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: chartConfig[item.category]?.color }}
                  />
                  <span className="text-muted-foreground">{item.category}</span>
                </div>
                <span className="font-medium">
                  ${item.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
        {aggregatedData.length > 0 && (
          <div className="p-0 pt-1 flex justify-center">
            <Button
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full h-auto p-1 hover:bg-transparent"
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
