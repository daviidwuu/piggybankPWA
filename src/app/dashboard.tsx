"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { type Transaction, type Budget } from "@/lib/data";
import { Balance } from "@/components/dashboard/balance";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { DateFilter, type DateRange } from "@/components/dashboard/date-filter";
import { AddTransactionForm } from "@/components/dashboard/add-transaction-form";
import { type ChartConfig } from "@/components/ui/chart";
import { startOfDay, subMonths, subYears, startOfWeek, endOfWeek, endOfDay, format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortOption = 'latest' | 'highest' | 'category';

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#f59e0b",
  "#10b981",
];

export function Dashboard({ initialData }: { initialData: { transactions: Transaction[], budgets: Budget[] }}) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialData.transactions);
  const [budgets, setBudgets] = useState<Budget[]>(initialData.budgets);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [chartConfig, setChartConfig] = useState<ChartConfig>({});
  const [visibleTransactions, setVisibleTransactions] = useState(5);
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [isClient, setIsClient] = useState(false);
  const [displayDate, setDisplayDate] = useState<string>("Loading...");
  const [isAddTransactionOpen, setAddTransactionOpen] = useState(false);

  const fetchData = useCallback(async (revalidate = false) => {
    if (revalidate) {
      setIsRefreshing(true);
    }
    try {
      const res = await fetch(`/api/sheet?revalidate=${revalidate}`);
      if (!res.ok) {
        throw new Error('Failed to fetch data');
      }
      const { transactions: newTransactions, budgets: newBudgets } = await res.json();
      setTransactions(newTransactions);
      setBudgets(newBudgets);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      if (revalidate) {
        setIsRefreshing(false);
      }
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
    setLoading(false);
    fetchData(true); // Initial fresh data fetch
  }, [fetchData]);

  const getDisplayDate = (range: DateRange): string => {
    if (!transactions.length && range !== 'all') return "No data";
    
    const today = new Date();
    let startDate: Date;
    let endDate: Date = today;

    switch (range) {
      case 'daily':
        return format(today, 'd MMM');
      case 'week':
        startDate = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        endDate = endOfWeek(today, { weekStartsOn: 1 }); // Sunday
        return `${format(startDate, 'd MMM')} - ${format(endDate, 'd MMM')}`;
      case 'month':
        return format(today, 'MMMM yyyy');
      case 'yearly':
        startDate = subYears(today, 1);
        return `${format(startDate, 'MMM yyyy')} - ${format(endDate, 'MMM yyyy')}`;
      case 'all':
      default:
        if (!transactions.length) return "All Time";
        const oldestDate = transactions.reduce((min, t) => {
            if (!t.Date) return min;
            const current = new Date(t.Date);
            return current < min ? current : min;
        }, new Date());
        const mostRecentDate = transactions.reduce((max, t) => {
            if (!t.Date) return max;
            const current = new Date(t.Date);
            return current > max ? current : max;
        }, new Date(0));
        return `${format(oldestDate, 'd MMM yyyy')} - ${format(mostRecentDate, 'd MMM yyyy')}`;
    }
  };

  useEffect(() => {
    if (!isClient) return;
    setDisplayDate(getDisplayDate(dateRange));
  }, [dateRange, transactions, isClient]);

  const filteredTransactions = useMemo(() => {
    if (!isClient || !transactions.length) return [];

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
        startDate = startOfDay(subMonths(today, 1));
        endDate = endOfDay(today);
        break;
      case 'yearly':
        startDate = startOfDay(subYears(today, 1));
        endDate = endOfDay(today);
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
  }, [isClient, transactions, dateRange]);
  
  const scaledBudget = useMemo(() => {
    if (!isClient) return 0;

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
        if (transactions.length === 0) return monthlyBudget;
        const dates = transactions
          .map(t => new Date(t.Date!))
          .filter(d => !isNaN(d.getTime()));
        if (dates.length === 0) return monthlyBudget;
        
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

        const monthDiff = (maxDate.getFullYear() - minDate.getFullYear()) * 12 + (maxDate.getMonth() - minDate.getMonth()) + 1;
        return monthlyBudget * monthDiff;
      default:
        return monthlyBudget;
    }
  }, [isClient, budgets, dateRange, transactions]);

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

  const sortedTransactions = useMemo(() => {
    const sorted = [...expenseTransactions];
    switch (sortOption) {
      case 'highest':
        return sorted.sort((a, b) => b.Amount - a.Amount);
      case 'category':
        return sorted.sort((a, b) => a.Category.localeCompare(b.Category));
      case 'latest':
      default:
        return sorted.sort((a, b) => {
          if (a.Date === null) return 1;
          if (b.Date === null) return -1;
          return new Date(b.Date).getTime() - new Date(a.Date).getTime();
        });
    }
  }, [expenseTransactions, sortOption]);

  const transactionsToShow = sortedTransactions.slice(0, visibleTransactions);


  if (loading && transactions.length === 0) {
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
        <main className="flex-1 p-4 space-y-4">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold">
              <div>Welcome,</div>
              <div className="text-primary text-3xl">David</div>
            </h1>
            <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                   <Dialog open={isAddTransactionOpen} onOpenChange={setAddTransactionOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" className="focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Transaction</DialogTitle>
                      </DialogHeader>
                      <AddTransactionForm 
                        setOpen={setAddTransactionOpen} 
                        onSuccess={() => fetchData(true)}
                      />
                    </DialogContent>
                  </Dialog>
                  <DateFilter value={dateRange} onValueChange={setDateRange} />
                  <Button variant="outline" size="icon" onClick={() => fetchData(true)} disabled={isRefreshing} className="focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full">
                    <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                  </Button>
                </div>
                 <span className="text-xs text-muted-foreground mt-1 min-w-max">
                  {displayDate}
                </span>
              </div>
          </div>
          
          <Balance
            totalSpending={totalSpent}
            budget={scaledBudget}
            aggregatedData={aggregatedData}
            chartConfig={chartConfig}
          />
          <TransactionsTable 
            data={transactionsToShow} 
            chartConfig={chartConfig}
            hasMore={visibleTransactions < sortedTransactions.length}
            onLoadMore={() => setVisibleTransactions(v => v + 5)}
            sortOption={sortOption}
            onSortChange={setSortOption}
          />
        </main>
      </div>
    </div>
  );
}
