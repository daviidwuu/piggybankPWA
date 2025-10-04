
"use client";

import { useEffect, useState, useMemo } from "react";
import { type Transaction, type Budget } from "@/lib/data";
import { Balance } from "@/components/dashboard/balance";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { DateFilter, type DateRange } from "@/components/dashboard/date-filter";
import { AddTransactionForm } from "@/components/dashboard/add-transaction-form";
import { BudgetPage } from "@/components/dashboard/budget-page";
import { SetupSheet } from "@/components/dashboard/setup-sheet";
import { NotificationPermissionDialog } from "@/components/dashboard/notification-permission-dialog";
import { DeleteTransactionDialog } from "@/components/dashboard/delete-transaction-dialog";
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
import { RefreshCw, Plus, Settings, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { SkeletonLoader } from "@/components/dashboard/skeleton-loader";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useUser, useFirestore, useMemoFirebase, useFirebaseApp, useCollection, useDoc } from "@/firebase";
import { doc, collection, query, orderBy, deleteDoc, updateDoc, setDoc } from "firebase/firestore";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";
import { setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { requestNotificationPermission } from "@/firebase/messaging";
import { toDate } from "date-fns";


export type SortOption = 'latest' | 'highest' | 'category';

const chartColors = [
  "#2563eb", "#f97316", "#22c55e", "#ef4444", "#8b5cf6",
  "#78350f", "#ec4899", "#64748b", "#f59e0b"
];

export const categories = [
  "Food & Drinks", "Gambling", "Drinks", "Girlfriend",
  "Entertainment", "Shopping", "Transport", "Dad", "Others",
];

const categoryColors: { [key: string]: string } = categories.reduce((acc, category, index) => {
  acc[category] = chartColors[index % chartColors.length];
  return acc;
}, {} as { [key: string]: string });

const NOTIFICATION_PROMPT_KEY = 'notificationPrompted';
const USER_ID_COPIED_KEY = 'userIdCopied';

interface UserData {
    name: string;
}

export function Dashboard() {
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [chartConfig, setChartConfig] = useState<ChartConfig>({});
  const [visibleTransactions, setVisibleTransactions] = useState(5);
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [isClient, setIsClient] = useState(false);
  const [displayDate, setDisplayDate] = useState<string>("Loading...");
  
  const [isAddTransactionOpen, setAddTransactionOpen] = useState(false);
  const [isBudgetOpen, setBudgetOpen] = useState(false);

  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  
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
  
  const { data: userData, isLoading: isUserDataLoading } = useDoc<UserData>(userDocRef);

  const transactionsQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, `users/${user.uid}/transactions`), orderBy('Date', 'desc')) : null),
    [firestore, user]
  );
  const { data: transactions, isLoading: isTransactionsLoading } = useCollection<Transaction>(transactionsQuery);

  const budgetsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, `users/${user.uid}/budgets`) : null),
    [firestore, user]
  );
  const { data: budgets, isLoading: isBudgetsLoading } = useCollection<Budget>(budgetsQuery);

  
  useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [isUserLoading, user, auth]);

  
  useEffect(() => {
    setIsClient(true);
    if (userData) {
      const alreadyPrompted = localStorage.getItem(NOTIFICATION_PROMPT_KEY);
      if (!alreadyPrompted && Notification.permission === 'default') {
          setTimeout(() => setShowNotificationDialog(true), 2000);
      }
    }
  }, [userData]);


  const handleSetupSave = (data: { name: string; }) => {
    if (!userDocRef) return;
    const newUserData = { name: data.name };
    setDocumentNonBlocking(userDocRef, newUserData, { merge: true });
    
    // Add default budgets
    if (firestore && user) {
        const budgetsCollection = collection(firestore, `users/${user.uid}/budgets`);
        const defaultBudgets = [
            { Category: "Food & Drinks", MonthlyBudget: 500 },
            { Category: "Shopping", MonthlyBudget: 300 },
            { Category: "Transport", MonthlyBudget: 100 },
            { Category: "Entertainment", MonthlyBudget: 150 },
            { Category: "Others", MonthlyBudget: 200 },
        ];
        defaultBudgets.forEach(budget => {
            setDocumentNonBlocking(doc(budgetsCollection, budget.Category), budget, { merge: true });
        })
    }
  };

  const handleEditClick = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setAddTransactionOpen(true);
  };
  
  const handleDeleteClick = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
  };

  const handleConfirmDelete = () => {
    if (!transactionToDelete || !user || !firestore) return;
    const docRef = doc(firestore, `users/${user.uid}/transactions`, transactionToDelete.id);
    deleteDocumentNonBlocking(docRef);
    setTransactionToDelete(null);
    toast({
      title: "Transaction Deleted",
      description: "The transaction has been successfully removed.",
    });
  };

  const handleUpdateBudget = (category: string, newBudget: number) => {
    if (!user || !firestore) return;
    const budgetRef = doc(firestore, `users/${user.uid}/budgets`, category);
    const budgetData = { Category: category, MonthlyBudget: newBudget };
    setDocumentNonBlocking(budgetRef, budgetData, { merge: true });
    toast({
        title: "Budget Updated",
        description: `Budget for ${category} has been set to $${newBudget.toFixed(2)}.`,
    });
  };

  const handleResetSettings = () => {
    if (userDocRef) {
        setDocumentNonBlocking(userDocRef, { name: null }, { merge: true });
    }
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

  const handleCopyUserId = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.uid);
    toast({
        title: "User ID Copied!",
        description: "You can now paste this into your Apple Shortcut.",
    });
    localStorage.setItem(USER_ID_COPIED_KEY, 'true');
  };

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
    if (!transactions?.length && range !== 'all') return "No data";
    
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
        if (!transactions?.length) return "All Time";
        const oldestDate = transactions.reduce((min, t) => {
            if (!t.Date) return min;
            const current = toDate(t.Date.seconds * 1000);
            return current < min ? current : min;
        }, new Date());
        const mostRecentDate = transactions.reduce((max, t) => {
            if (!t.Date) return max;
            const current = toDate(t.Date.seconds * 1000);
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
    if (!isClient || !transactions) return [];
    
    const { start, end } = dateFilterRange;

    if (dateRange === 'all' || !start || !end) {
      return transactions;
    }

    return transactions.filter(t => {
      if (!t.Date) return false;
      const transactionDate = toDate(t.Date.seconds * 1000);
      if (isNaN(transactionDate.getTime())) return false;
      
      const isAfterStart = transactionDate >= start;
      const isBeforeEnd = transactionDate <= end;
      
      return isAfterStart && isBeforeEnd;
    });
  }, [isClient, transactions, dateRange, dateFilterRange]);
  
  const scaledBudget = useMemo(() => {
    if (!isClient || !budgets?.length) return 0;

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
        if (!transactions?.length) return monthlyBudget;
        const dates = transactions
          .map(t => toDate(t.Date!.seconds * 1000))
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
    if (!expenseTransactions) return [];
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
          return b.Date.seconds - a.Date.seconds;
        });
    }
  }, [expenseTransactions, sortOption]);

  const transactionsToShow = sortedTransactions.slice(0, visibleTransactions);

  useEffect(() => {
    // When the dialog closes, reset the transaction to edit
    if (!isAddTransactionOpen) {
      setTransactionToEdit(null);
    }
  }, [isAddTransactionOpen]);

  const mainContentUser = userData;

  if (isUserLoading || isUserDataLoading || (mainContentUser && (isTransactionsLoading || isBudgetsLoading))) {
    return <SkeletonLoader />;
  }
  
  if (!mainContentUser?.name) {
    return (
        <div className="flex flex-col min-h-screen bg-background items-center">
            <div className="w-full max-w-[428px] border-x border-border p-6">
                <SetupSheet 
                  onSave={handleSetupSave} 
                  onCopyUserId={handleCopyUserId}
                  userId={user?.uid}
                />
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
           <DeleteTransactionDialog
              open={!!transactionToDelete}
              onOpenChange={() => setTransactionToDelete(null)}
              onConfirm={handleConfirmDelete}
              transaction={transactionToDelete}
           />
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold">Welcome,</h1>
              <h1 className="text-primary text-3xl font-bold">{mainContentUser.name}</h1>
            </div>
            <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <Dialog open={isBudgetOpen} onOpenChange={setBudgetOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" className="focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full">
                        <Wallet className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                       <DialogHeader>
                        <DialogTitle>Manage Budgets</DialogTitle>
                      </DialogHeader>
                      <BudgetPage budgets={budgets || []} onUpdateBudget={handleUpdateBudget} />
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="icon" onClick={() => {}} disabled={true} className="focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full">
                    <RefreshCw className={cn("h-4 w-4", (isTransactionsLoading || isBudgetsLoading) && "animate-spin")} />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleResetSettings} className="focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
          </div>
          
          <Balance
            totalSpending={totalSpent}
            budget={scaledBudget}
            aggregatedData={aggregatedData}
            chartConfig={chartConfig}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            displayDate={displayDate}
          />
          <TransactionsTable 
            data={transactionsToShow} 
            chartConfig={chartConfig}
            hasMore={visibleTransactions < sortedTransactions.length}
            onLoadMore={() => setVisibleTransactions(v => v + 5)}
            sortOption={sortOption}
            onSortChange={setSortOption}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        </main>

        <Dialog open={isAddTransactionOpen} onOpenChange={setAddTransactionOpen}>
            <DialogTrigger asChild>
                <Button 
                    variant="default"
                    className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90"
                >
                    <Plus className="h-8 w-8" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>{transactionToEdit ? 'Edit Transaction' : 'Add New Transaction'}</DialogTitle>
                </DialogHeader>
                <AddTransactionForm 
                userId={user?.uid}
                setOpen={setAddTransactionOpen}
                transactionToEdit={transactionToEdit}
                />
            </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}

    