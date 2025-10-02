"use client";

import { useEffect, useState, useCallback } from "react";
import { getSheetData } from "@/ai/flows/get-sheet-data-flow";
import { getBudgetData } from "@/ai/flows/get-budget-data-flow";
import { type Transaction, type Budget } from "@/lib/data";
import { Balance } from "@/components/dashboard/balance";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { AiAnalysis } from "@/components/dashboard/ai-analysis";
import { Separator } from "@/components/ui/separator";
import { DateFilter, type DateRange } from "@/components/dashboard/date-filter";
import { type ChartConfig } from "@/components/ui/chart";

const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbyo_FVmlXpdAw1TTUtySgKMafuDoIhY35dQFvAlxE3OxJ3-gT9XufPNbp32huac8fvEkQ/exec";

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [chartConfig, setChartConfig] = useState<ChartConfig>({});

  const handleChartConfigChange = useCallback((config: ChartConfig) => {
    setChartConfig(config);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [tx, bd] = await Promise.all([
          getSheetData({ googleSheetUrl: SHEET_API_URL }),
          getBudgetData({ googleSheetUrl: SHEET_API_URL })
        ]);
        setTransactions(tx);
        setBudgets(bd);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getFilteredTransactions = () => {
    const now = new Date();
    if (dateRange === 'daily') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return transactions.filter(t => {
        if (!t.Date) return false;
        const transactionDate = new Date(t.Date);
        return !isNaN(transactionDate.getTime()) && transactionDate >= today;
      });
    }
    if (dateRange === 'week') {
      const oneWeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      return transactions.filter(t => {
        if (!t.Date) return false;
        const transactionDate = new Date(t.Date);
        return !isNaN(transactionDate.getTime()) && transactionDate >= oneWeekAgo;
      });
    }
    if (dateRange === 'month') {
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      return transactions.filter(t => {
        if (!t.Date) return false;
        const transactionDate = new Date(t.Date);
        return !isNaN(transactionDate.getTime()) && transactionDate >= oneMonthAgo;
      });
    }
    if (dateRange === 'yearly') {
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        return transactions.filter(t => {
            if (!t.Date) return false;
            const transactionDate = new Date(t.Date);
            return !isNaN(transactionDate.getTime()) && transactionDate >= oneYearAgo;
        });
    }
    return transactions;
  }

  const filteredTransactions = getFilteredTransactions();

  const totalBudget = budgets.reduce((sum, b) => sum + b.Budget, 0);
  const totalSpent = filteredTransactions
    .filter(t => t.Type === "Expense")
    .reduce((sum, t) => sum + t.Amount, 0);

  const expenseTransactions = filteredTransactions.filter(t => t.Type === 'Expense');

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center">
        <div className="w-full max-w-[428px] border-x border-border p-6">
          <div className="flex justify-center items-center h-64">
            <p>Loading your financial data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background items-center">
      <div className="w-full max-w-[428px] border-x border-border">
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold">Welcome</h1>
              <h1 className="text-3xl font-bold text-primary">David</h1>
            </div>
            <DateFilter value={dateRange} onValueChange={setDateRange} />
          </div>
          
          <Balance
            totalSpending={totalSpent}
            budget={totalBudget}
          />
          <Separator />
          <SpendingChart 
            data={expenseTransactions} 
            chartConfig={chartConfig}
            onChartConfigChange={handleChartConfigChange}
          />
          <AiAnalysis transactions={expenseTransactions} />
          <TransactionsTable data={expenseTransactions} chartConfig={chartConfig} />
        </main>
      </div>
    </div>
  );
}
