"use client";

import { useEffect, useState, useCallback } from "react";
import { type Transaction, type Budget } from "@/lib/data";
import { Balance } from "@/components/dashboard/balance";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { AiAnalysis } from "@/components/dashboard/ai-analysis";
import { Separator } from "@/components/ui/separator";
import { DateFilter, type DateRange } from "@/components/dashboard/date-filter";
import { type ChartConfig } from "@/components/ui/chart";
import { startOfDay, subMonths, subYears, startOfWeek, endOfWeek } from 'date-fns';
import { isEqual } from 'lodash';

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [chartConfig, setChartConfig] = useState<ChartConfig>({});

  const handleChartConfigChange = useCallback((config: ChartConfig) => {
    if (!isEqual(chartConfig, config)) {
      setChartConfig(config);
    }
  }, [chartConfig]);

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
  
    switch (dateRange) {
      case 'daily':
        startDate = startOfDay(today);
        break;
      case 'week':
        startDate = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        break;
      case 'month':
        startDate = subMonths(today, 1);
        break;
      case 'yearly':
        startDate = subYears(today, 1);
        break;
      case 'all':
      default:
        return transactions;
    }
  
    let endDate: Date | null = null;
    if (dateRange === 'week') {
      endDate = endOfWeek(today, { weekStartsOn: 1 });
    }
  
    return transactions.filter(t => {
      if (!t.Date) return false;
      const transactionDate = new Date(t.Date);
      if (isNaN(transactionDate.getTime())) return false;
      
      const isAfterStart = transactionDate >= startDate;
      const isBeforeEnd = endDate ? transactionDate <= endDate : true;
      
      if (dateRange === 'daily') {
        return transactionDate.toDateString() === today.toDateString();
      }
  
      return isAfterStart && isBeforeEnd;
    });
  };

  const getScaledBudget = () => {
    const monthlyBudget = budgets.reduce((sum, b) => sum + b.Budget, 0);
    switch (dateRange) {
      case 'daily':
        return monthlyBudget / 30; // Approximation
      case 'week':
        return monthlyBudget / 4; // Approximation
      case 'yearly':
        return monthlyBudget * 12;
      case 'month':
      case 'all': // 'all' will use the monthly budget as default
      default:
        return monthlyBudget;
    }
  };

  const filteredTransactions = getFilteredTransactions();
  const scaledBudget = getScaledBudget();

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
            <DateFilter value={dateRange} onValueChange={setDateRange} transactions={transactions}/>
          </div>
          
          <Balance
            totalSpending={totalSpent}
            budget={scaledBudget}
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
