
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface BalanceProps {
  totalSpending: number;
  budget: number;
}

export function Balance({
  totalSpending,
  budget,
}: BalanceProps) {
  const spendingPercentage = budget > 0 ? (totalSpending / budget) * 100 : 0;
  const isOverBudget = spendingPercentage >= 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Spending</CardTitle>
        </div>
        <CardDescription>Your spending vs. budget for this period.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
          className={cn(isOverBudget && "[&>div]:bg-destructive")}
        />
      </CardContent>
    </Card>
  );
}
