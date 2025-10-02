
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface BalanceProps {
  totalSpending: number;
  budget: number;
  timeRange: "daily" | "weekly" | "monthly";
  setTimeRange: (value: "daily" | "weekly" | "monthly") => void;
}

export function Balance({
  totalSpending,
  budget,
  timeRange,
  setTimeRange,
}: BalanceProps) {
  const balance = budget - totalSpending;
  const spendingPercentage = (totalSpending / budget) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Balance</CardTitle>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CardDescription>Your spending vs. budget for this period.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-baseline">
          <div className="text-3xl font-bold text-foreground">
            ${balance.toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground">
            of ${budget.toFixed(2)}
          </div>
        </div>
        <Progress value={spendingPercentage} />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Spent</span>
          <span
            className={cn(
              "font-medium",
              spendingPercentage > 100 ? "text-destructive" : "text-foreground"
            )}
          >
            ${totalSpending.toFixed(2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
