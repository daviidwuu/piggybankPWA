"use client";

import { useEffect, useState, useMemo } from "react";
import { type Transaction, type Budget } from "@/lib/data";
import { Balance } from "@/components/dashboard/balance";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { AiAnalysis } from "@/components/dashboard/ai-analysis";
import { Separator } from "@/components/ui/separator";
import { DateFilter, type DateRange } from "@/components/dashboard/date-filter";
import { type ChartConfig } from "@/components/ui/chart";
import { startOfDay, subMonths, subYears, startOfWeek, endOfWeek, endOfDay } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

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
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [chartConfig, setChartConfig] = useState<ChartConfig>({});
  const [visibleTransactions, setVisibleTransactions] = useState(5);
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setLoading(false); // Initial server data is already loaded

    async function fetchData(revalidate = false) {
      if (!revalidate) return;
      
      setLoading(true);
      try {
        const res = await fetch(`/api/sheet?revalidate=true`);
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
    // Fetch fresh data in the background after initial load
    fetchData(true);
  }, []);

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
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold">
              <div>Welcome,</div>
              <div className="text-primary text-3xl">David</div>
            </h1>
            <div className="flex items-end flex-col">
              <div className="flex items-start gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="focus-visible:ring-0 focus-visible:ring-offset-0">
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <AiAnalysis transactions={expenseTransactions} />
                  </PopoverContent>
                </Popover>
                <DateFilter value={dateRange} onValueChange={setDateRange} transactions={transactions} />
              </div>
            </div>
          </div>
          
          <Balance
            totalSpending={totalSpent}
            budget={scaledBudget}
            aggregatedData={aggregatedData}
            chartConfig={chartConfig}
          />
          <Separator />
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
