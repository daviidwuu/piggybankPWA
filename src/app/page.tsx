"use client";

import { useEffect, useState, useMemo } from "react";
import { type Transaction, type Budget } from "@/lib/data";
import { Balance } from "@/components/dashboard/balance";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { AiAnalysis } from "@/components/dashboard/ai-analysis";
import { Separator } from "@/components/ui/separator";
import { DateFilter, type DateRange } from "@/components/dashboard/date-filter";
import { type ChartConfig } from "@/components/ui/chart";
import { startOfDay, subMonths, subYears, startOfWeek, endOfWeek, endOfDay, max, min } from 'date-fns';
import { Button } from "@/components/ui/button";

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#f59e0b",
  "#10b981",
];

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [chartConfig, setChartConfig] = useState<ChartConfig>({});
  const [visibleTransactions, setVisibleTransactions] = useState(5);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/sheet');
        if (!res.ok) {
          throw new Error('Failed to fetch data');
        }
        const { transactions, budgets } = await res.json();
        setTransactions(transactions);
        setBudgets(budgets);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getFilteredTransactions = () => {
    if (!transactions.length) return [];
  
    const today = new Date();
    let startDate: Date;
    let endDate: Date | null = null;
  
    switch (dateRange) {
      case 'daily':
        startDate = startOfDay(today);
        endDate = endOfDay(today);
        break;
      case 'week':
        startDate = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        endDate = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = subMonths(today, 1);
        endDate = today;
        break;
      case 'yearly':
        startDate = subYears(today, 1);
        endDate = today;
        break;
      case 'all':
      default:
        return transactions;
    }
  
    return transactions.filter(t => {
      if (!t.Date) return false;
      const transactionDate = new Date(t.Date);
      if (isNaN(transactionDate.getTime())) return false;
      
      const isAfterStart = transactionDate >= startDate;
      const isBeforeEnd = endDate ? transactionDate <= endDate : true;
      
      return isAfterStart && isBeforeEnd;
    });
  };
  
  const getScaledBudget = () => {
    const monthlyBudget = budgets.reduce((sum, b) => sum + b.Budget, 0);
    if (monthlyBudget === 0) return 0;
  
    switch (dateRange) {
      case 'daily':
        return monthlyBudget / 30; // Approximation
      case 'week':
        return monthlyBudget / 4; // Approximation
      case 'yearly':
        return monthlyBudget * 12;
      case 'month':
        return monthlyBudget;
      case 'all':
        // For 'all time', maybe we want to scale it based on the number of months in the transaction data
        if (transactions.length === 0) return monthlyBudget;
        const dates = transactions.map(t => new Date(t.Date!)).filter(d => !isNaN(d.getTime()));
        if (dates.length === 0) return monthlyBudget;
        const minDate = new Date(Math.min.apply(null, dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max.apply(null, dates.map(d => d.getTime())));
        const monthDiff = (maxDate.getFullYear() - minDate.getFullYear()) * 12 + (maxDate.getMonth() - minDate.getMonth()) + 1;
        return monthlyBudget * monthDiff;
      default:
        return monthlyBudget;
    }
  };

  const filteredTransactions = getFilteredTransactions();
  const scaledBudget = getScaledBudget();
  const expenseTransactions = filteredTransactions.filter(t => t.Type === 'Expense');

  const totalSpent = expenseTransactions.reduce((sum, t) => sum + t.Amount, 0);

  const aggregatedData = useMemo(() => expenseTransactions
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
    .sort((a, b) => b.amount - a.amount), [expenseTransactions]);

  useEffect(() => {
    const newChartConfig = aggregatedData.reduce((acc, item, index) => {
      acc[item.category] = {
        label: item.category,
        color: chartColors[index % chartColors.length],
      };
      return acc;
    }, {} as ChartConfig);

    if (JSON.stringify(chartConfig) !== JSON.stringify(newChartConfig)) {
      setChartConfig(newChartConfig);
    }
  }, [aggregatedData, chartConfig]);

  const sortedTransactions = useMemo(() => [...expenseTransactions].sort((a, b) => {
    if (a.Date === null) return 1;
    if (b.Date === null) return -1;
    return new Date(b.Date).getTime() - new Date(a.Date).getTime();
  }), [expenseTransactions]);

  const transactionsToShow = sortedTransactions.slice(0, visibleTransactions);


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
            <DateFilter value={dateRange} onValueChange={setDateRange} transactions={transactions}/>
          </div>
          
          <Balance
            totalSpending={totalSpent}
            budget={scaledBudget}
          />
          <Separator />
          <TransactionsTable 
            data={transactionsToShow} 
            chartConfig={chartConfig}
            hasMore={visibleTransactions < sortedTransactions.length}
            onLoadMore={() => setVisibleTransactions(v => v + 5)}
          />
          <AiAnalysis transactions={expenseTransactions} />
        </main>
      </div>
    </div>
  );
}
