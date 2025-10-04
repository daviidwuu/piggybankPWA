
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { type Transaction, type Budget } from "@/lib/data";
import { Balance } from "@/components/dashboard/balance";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { DateFilter, type DateRange } from "@/components/dashboard/date-filter";
import { AddTransactionForm } from "@/components/dashboard/add-transaction-form";
import { SetupSheet } from "@/components/dashboard/setup-sheet";
import { NotificationPermissionDialog } from "@/components/dashboard/notification-permission-dialog";
import { type ChartConfig } from "@/components/ui/chart";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format, getDaysInMonth } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { SkeletonLoader } from "@/components/dashboard/skeleton-loader";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useUser, useFirestore, useMemoFirebase, useFirebaseApp } from "@/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { requestNotificationPermission } from "@/firebase/messaging";


export type SortOption = 'latest' | 'highest' | 'category';

const chartColors = [
  "#2563eb", "#f97316", "#22c55e", "#ef4444", "#8b5cf6",
  "#78350f", "#ec4899", "#64748b", "#f59e0b"
];

const categories = [
  "Food & Drinks", "Gambling", "Drinks", "Girlfriend",
  "Entertainment", "Shopping", "Transport", "Dad", "Others",
];

const categoryColors: { [key: string]: string } = categories.reduce((acc, category, index) => {
  acc[category] = chartColors[index % chartColors.length];
  return acc;
}, {} as { [key: string]: string });


const CACHE_KEY = 'finTrackMiniCache';
const NOTIFICATION_PROMPT_KEY = 'notificationPrompted';

interface UserData {
    name: string;
    googleSheetUrl: string;
}

export function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [chartConfig, setChartConfig] = useState<ChartConfig>({});
  const [visibleTransactions, setVisibleTransactions] = useState(5);
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [isClient, setIsClient] = useState(false);
  const [displayDate, setDisplayDate] = useState<string>("Loading...");
  const [isAddTransactionOpen, setAddTransactionOpen] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  
  const { toast } = useToast();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();

  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, "users", user.uid) : null),
    [firestore, user]
  );
  
  useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [isUserLoading, user, auth]);

  const fetchUserData = useCallback(async () => {
    if (!userDocRef) return;
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data() as UserData;
            setUserData(data);
            
            // Check if we should prompt for notifications
            const alreadyPrompted = localStorage.getItem(NOTIFICATION_PROMPT_KEY);
            if (!alreadyPrompted && Notification.permission === 'default') {
                setTimeout(() => setShowNotificationDialog(true), 2000); // Delay for better UX
            }
            
            return data;
        } else {
            console.log("No such document!");
            setUserData(null);
            return null;
        }
    } catch (error) {
        console.error("Error getting user data:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load user profile.",
        });
        return null;
    }
  }, [userDocRef, toast]);


  const fetchData = useCallback(async (revalidate = false, url: string | undefined) => {
    if (!url) return;
    if (revalidate) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const res = await fetch(`/api/sheet?url=${encodeURIComponent(url)}`);
      
      const resJson = await res.json();

      if (!res.ok) {
        // Use the detailed error message from the API if available
        const errorMessage = resJson.details || resJson.error || 'An unexpected error occurred while fetching data.';
        throw new Error(errorMessage);
      }
      const { transactions: newTransactions, budgets: newBudgets } = resJson;
      setTransactions(newTransactions);
      setBudgets(newBudgets);
      if (typeof window !== 'undefined') {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ transactions: newTransactions, budgets: newBudgets, timestamp: Date.now() }));
      }
    } catch (err) {
      console.error("Error loading data:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      toast({
        variant: "destructive",
        title: "Data Load Error",
        description: errorMessage,
      });
    } finally {
      if (revalidate) {
        setIsRefreshing(false);
      }
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    setIsClient(true);
    if (user) {
        setLoading(true);
        fetchUserData().then((fetchedUserData) => {
            if (fetchedUserData?.googleSheetUrl) {
                 const cachedData = localStorage.getItem(CACHE_KEY);
                 if (cachedData) {
                    const { transactions, budgets } = JSON.parse(cachedData);
                    setTransactions(transactions);
                    setBudgets(budgets);
                    setLoading(false);
                 }
                 fetchData(!cachedData, fetchedUserData.googleSheetUrl);
            } else {
                setLoading(false);
            }
        });
    } else if (!isUserLoading) {
        setLoading(false);
    }
  }, [user, isUserLoading, fetchUserData, fetchData]);

  const handleSetupSave = (data: { name: string; url: string }) => {
    if (!userDocRef) return;
    const newUserData = { name: data.name, googleSheetUrl: data.url };
    setDocumentNonBlocking(userDocRef, newUserData, { merge: true });
    setUserData(newUserData);
    fetchData(true, data.url);
  };

  const handleResetSettings = () => {
    setUserData(null);
    setTransactions([]);
    setBudgets([]);
    localStorage.removeItem(CACHE_KEY);
    toast({
        title: "Settings Reset",
        description: "Please enter your new configuration.",
    });
  };
  
  const handlePermissionRequest = async () => {
    if (user && firestore && firebaseApp) {
      await requestNotificationPermission(user.uid, firestore, firebaseApp);
    }
    setShowNotificationDialog(false);
    localStorage.setItem(NOTIFICATION_PROMPT_KEY, 'true');
  };

  const handlePermissionDenial = () => {
    setShowNotificationDialog(false);
    localStorage.setItem(NOTIFICATION_PROMPT_KEY, 'true');
  }

  const dateFilterRange = useMemo(() => {
    const today = new Date();
    switch (dateRange) {
      case 'daily':
        return { start: startOfDay(today), end: endOfDay(today) };
      case 'week':
        return { start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) };
      case 'month':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case 'yearly':
        return { start: startOfYear(today), end: endOfYear(today) };
      case 'all':
      default:
        return { start: null, end: null };
    }
  }, [dateRange]);

  const getDisplayDate = (range: DateRange): string => {
    if (!transactions.length && range !== 'all') return "No data";
    
    const { start, end } = dateFilterRange;

    switch (range) {
      case 'daily':
        return start ? format(start, 'd MMM yyyy') : "Today";
      case 'week':
        return (start && end) ? `${format(start, 'd MMM')} - ${format(end, 'd MMM yyyy')}` : "This Week";
      case 'month':
        return start ? format(start, 'MMMM yyyy') : "This Month";
      case 'yearly':
        return start ? format(start, 'yyyy') : "This Year";
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
        if (isNaN(oldestDate.getTime()) || isNaN(mostRecentDate.getTime())) return "All Time";
        return `${format(oldestDate, 'd MMM yyyy')} - ${format(mostRecentDate, 'd MMM yyyy')}`;
    }
  };

  useEffect(() => {
    if (!isClient) return;
    setDisplayDate(getDisplayDate(dateRange));
  }, [dateRange, transactions, isClient, dateFilterRange]);

  const filteredTransactions = useMemo(() => {
    if (!isClient) return [];
    
    const { start, end } = dateFilterRange;

    if (dateRange === 'all' || !start || !end) {
      return transactions;
    }

    return transactions.filter(t => {
      if (!t.Date) return false;
      const transactionDate = new Date(t.Date);
      if (isNaN(transactionDate.getTime())) return false;
      
      const isAfterStart = transactionDate >= start;
      const isBeforeEnd = transactionDate <= end;
      
      return isAfterStart && isBeforeEnd;
    });
  }, [isClient, transactions, dateRange, dateFilterRange]);
  
  const scaledBudget = useMemo(() => {
    if (!isClient || !budgets.length) return 0;

    const monthlyBudget = budgets.reduce((sum, b) => sum + b.MonthlyBudget, 0);
    if (monthlyBudget === 0) return 0;
  
    const today = new Date();
    switch (dateRange) {
      case 'daily':
        return monthlyBudget / getDaysInMonth(today);
      case 'week':
        return monthlyBudget / 4; // Approximation for a week
      case 'yearly':
        return monthlyBudget * 12;
      case 'month':
        return monthlyBudget;
      case 'all': {
        if (!transactions.length) return monthlyBudget;
        const dates = transactions
          .map(t => new Date(t.Date!))
          .filter(d => !isNaN(d.getTime()));
        if (dates.length < 2) return monthlyBudget;
        
        const minDate = dates.reduce((min, d) => d < min ? d : min);
        const maxDate = dates.reduce((max, d) => d > max ? d : max);

        const monthDiff = (maxDate.getFullYear() - minDate.getFullYear()) * 12 + (maxDate.getMonth() - minDate.getMonth()) + 1;
        return monthlyBudget * Math.max(1, monthDiff);
      }
      default:
        return monthlyBudget;
    }
  }, [isClient, budgets, dateRange, transactions]);

  const expenseTransactions = useMemo(() => 
    filteredTransactions.filter(t => t.Type === 'Expense'),
    [filteredTransactions]
  );

  const totalSpent = useMemo(() => 
    expenseTransactions.reduce((sum, t) => sum + t.Amount, 0),
    [expenseTransactions]
  );

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
    const newChartConfig: ChartConfig = Object.keys(categoryColors).reduce((acc, category) => {
      acc[category] = {
        label: category,
        color: categoryColors[category],
      };
      return acc;
    }, {} as ChartConfig);

    if (JSON.stringify(chartConfig) !== JSON.stringify(newChartConfig)) {
        setChartConfig(newChartConfig);
    }
  }, [chartConfig]);

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


  if (loading || isUserLoading) {
    return <SkeletonLoader />;
  }

  if (!userData?.googleSheetUrl || !userData?.name) {
    return (
        <div className="flex flex-col min-h-screen bg-background items-center">
            <div className="w-full max-w-[428px] border-x border-border p-6">
                <SetupSheet onSave={handleSetupSave} />
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background items-center">
      <div className="w-full max-w-[428px] border-x border-border pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <main className="flex-1 p-4 space-y-4">
           <NotificationPermissionDialog
              open={showNotificationDialog}
              onAllow={handlePermissionRequest}
              onDeny={handlePermissionDenial}
           />
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold">Welcome,</h1>
              <h1 className="text-primary text-3xl font-bold">{userData.name}</h1>
            </div>
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
                        googleSheetUrl={userData.googleSheetUrl}
                        userId={user?.uid}
                        setOpen={setAddTransactionOpen} 
                        onSuccess={() => fetchData(true, userData.googleSheetUrl)}
                      />
                    </DialogContent>
                  </Dialog>
                  <DateFilter value={dateRange} onValueChange={setDateRange} />
                  <Button variant="outline" size="icon" onClick={() => fetchData(true, userData.googleSheetUrl)} disabled={isRefreshing} className="focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full">
                    <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleResetSettings} className="focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full">
                    <Settings className="h-4 w-4" />
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
