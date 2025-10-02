
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
        <Progress value={spendingPercentage} />
        <div className="flex justify-between text-sm">
          <span
            className={cn(
              "font-medium",
              spendingPercentage > 100 ? "text-destructive" : "text-foreground"
            )}
          >
            Spent
          </span>
           <span
            className={cn(
              "font-medium",
              spendingPercentage > 100 ? "text-destructive" : "text-foreground"
            )}
          >
            {spendingPercentage.toFixed(0)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
