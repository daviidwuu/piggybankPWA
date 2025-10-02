
"use client";

import { useEffect, useState } from "react";
import { type Transaction } from "@/lib/data";
import { Balance } from "@/components/dashboard/balance";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { AiAnalysis } from "@/components/dashboard/ai-analysis";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { DataImporter } from "@/components/dashboard/data-importer";

export default function DashboardPage() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly">(
    "monthly"
  );
  
  const budget = 2000; // Mock budget

  const handleImport = (transactions: Transaction[]) => {
    setAllTransactions(transactions);
    setFilteredTransactions(transactions); // Initially, show all transactions
    setIsDataLoaded(true);
  };

  const filterTransactions = (
    transactions: Transaction[],
    range: "daily" | "weekly" | "monthly",
    now: Date
  ) => {
    const expenses = transactions.filter(t => t.Type === 'Expense');
    if (range === "monthly") {
      // Show all transactions for the current month
      return expenses.filter(t => {
        const transactionDate = new Date(t.Date);
        return transactionDate.getMonth() === now.getMonth() && transactionDate.getFullYear() === now.getFullYear();
      });
    }
    if (range === "weekly") {
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);
      return expenses.filter(t => {
        const transactionDate = new Date(t.Date);
        return transactionDate >= oneWeekAgo && transactionDate <= now;
      });
    }
    if (range === "daily") {
      return expenses.filter((t) => {
        const transactionDate = new Date(t.Date);
        return (
          transactionDate.getDate() === now.getDate() &&
          transactionDate.getMonth() === now.getMonth() &&
          transactionDate.getFullYear() === now.getFullYear()
        );
      });
    }
    return expenses;
  };

  useEffect(() => {
    if (!isDataLoaded) return;
    const now = new Date();
    const filtered = filterTransactions(allTransactions, timeRange, now);
    setFilteredTransactions(filtered);
  }, [allTransactions, timeRange, isDataLoaded]);

  const totalSpending = filteredTransactions.reduce((sum, t) => sum + t.Amount, 0);

  return (
    <div className="flex flex-col min-h-screen bg-background items-center">
      <div className="w-full max-w-[428px] border-x border-border">
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold">Welcome</h1>
              <h1 className="text-3xl font-bold text-primary">David</h1>
            </div>
            <Select value={timeRange} onValueChange={(value: "daily" | "weekly" | "monthly") => setTimeRange(value)}>
               <SelectTrigger className="w-auto bg-card p-2">
                <Calendar className="h-5 w-5" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DataImporter onImport={handleImport} />

          {isDataLoaded ? (
            <>
              <Balance
                totalSpending={totalSpending}
                budget={budget}
              />
              <Separator />
              <SpendingChart data={filteredTransactions} />
              <AiAnalysis transactions={filteredTransactions} />
              <TransactionsTable data={filteredTransactions} />
            </>
          ) : (
            <div className="flex justify-center items-center h-64">
                <p>Loading transactions...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
