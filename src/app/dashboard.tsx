
"use client";

import { useEffect, useState, useMemo } from "react";
import { type Transaction, type Budget, type User as UserData } from "@/lib/data";
import { Balance } from "@/components/dashboard/balance";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { type DateRange } from "@/components/dashboard/date-filter";
import { AddTransactionForm } from "@/components/dashboard/add-transaction-form";
import { BudgetPage } from "@/components/dashboard/budget-page";
import { ReportsPage } from "@/components/dashboard/reports-page";
import { SetupSheet } from "@/components/dashboard/setup-sheet";
import { NotificationPermissionDialog } from "@/components/dashboard/notification-permission-dialog";
import { DeleteTransactionDialog } from "@/components/dashboard/delete-transaction-dialog";
import { UserSettingsDialog } from "@/components/dashboard/user-settings-dialog";
import { type ChartConfig } from "@/components/ui/chart";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format, getDaysInMonth, differenceInMonths, addMonths } from 'date-fns';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Plus, Settings, Wallet, User as UserIcon, LogOut, FileText } from "lucide-react";
import { SkeletonLoader } from "@/components/dashboard/skeleton-loader";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useUser, useFirestore, useMemoFirebase, useFirebaseApp, useCollection, useDoc } from "@/firebase";
import { doc, collection, setDoc, query, orderBy, limit } from 'firebase/firestore';
import { signOut, type User } from "firebase/auth";
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { requestNotificationPermission } from "@/firebase/messaging";
import { toDate } from "date-fns";
import { useRouter } from "next/navigation";


export type SortOption = 'latest' | 'highest' | 'category';

const chartColors = [
  "#2563eb", "#f97316", "#22c55e", "#ef4444", "#8b5cf6",
  "#78350f", "#ec4899", "#64748b", "#f59e0b"
];

const defaultCategories = [
  "F&B", "Shopping", "Transport", "Bills",
];

const NOTIFICATION_PROMPT_KEY = 'notificationPrompted';
const USER_ID_COPIED_KEY = 'userIdCopied';

export function Dashboard() {
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [chartConfig, setChartConfig] = useState<ChartConfig>({});
  const [visibleTransactions, setVisibleTransactions] = useState(20);
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [isClient, setIsClient] = useState(false);
  const [displayDate, setDisplayDate] = useState<string>("Loading...");
  
  const [isAddTransactionOpen, setAddTransactionOpen] = useState(false);
  const [isBudgetOpen, setBudgetOpen] = useState(false);
  const [isReportsOpen, setReportsOpen] = useState(false);

  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isUserSettingsOpen, setUserSettingsOpen] = useState(false);
  
  const { toast } = useToast();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();
  const router = useRouter();

  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userData, isLoading: isUserDataLoading } = useDoc<UserData>(userDocRef);

  const transactionsQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, `users/${user.uid}/transactions`), orderBy('Date', 'desc'), limit(visibleTransactions)) : null),
    [firestore, user, visibleTransactions]
  );
  const { data: transactions, isLoading: isTransactionsLoading } = useCollection<Transaction>(transactionsQuery);

  const budgetsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, `users/${user.uid}/budgets`) : null),
    [firestore, user]
  );
  const { data: budgets, isLoading: isBudgetsLoading } = useCollection<Budget>(budgetsQuery);

  const finalUserData = userData;
  
  useEffect(() => {
    setIsClient(true);
    if (finalUserData && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      const alreadyPrompted = localStorage.getItem(NOTIFICATION_PROMPT_KEY);
      if (!alreadyPrompted) {
          setTimeout(() => setShowNotificationDialog(true), 2000);
      }
    }
  }, [finalUserData]);

  const handleSetupSave = async (data: { name: string }) => {
    if (!userDocRef || !firestore || !user) return;
    const newUserData = {
      name: data.name,
      categories: defaultCategories,
      income: 0,
      savings: 0,
    };
    await setDoc(userDocRef, newUserData, { merge: true });

    const budgetsCollection = collection(firestore, `users/${user.uid}/budgets`);
    const budgetPromises = defaultCategories.map(category =>
      setDoc(doc(budgetsCollection, category), { Category: category, MonthlyBudget: 0 }, { merge: true })
    );
    await Promise.all(budgetPromises);
  };
  
  const handleCopyUserId = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.uid);
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
  };

  const handleUpdateIncome = (newIncome: number) => {
    if (!userDocRef) return;
    updateDocumentNonBlocking(userDocRef, { income: newIncome });
  };

  const handleUpdateSavings = (newSavings: number) => {
    if (!userDocRef) return;
    updateDocumentNonBlocking(userDocRef, { savings: newSavings });
  };

  const handleUpdateBudget = (category: string, newBudget: number) => {
    if (!user || !firestore) return;
    const budgetRef = doc(firestore, `users/${user.uid}/budgets`, category);
    const budgetData = { Category: category, MonthlyBudget: newBudget };
    setDoc(budgetRef, budgetData, { merge: true });
  };

  const handleAddCategory = (category: string) => {
    if (!userDocRef || !finalUserData) return;
    const updatedCategories = [...(finalUserData.categories || []), category];
    updateDocumentNonBlocking(userDocRef, { categories: updatedCategories });
    handleUpdateBudget(category, 0); // Initialize with 0 budget
  };

  const handleDeleteCategory = (category: string) => {
    if (!userDocRef || !user || !firestore || !finalUserData) return;
    const updatedCategories = (finalUserData.categories || []).filter(c => c !== category);
    updateDocumentNonBlocking(userDocRef, { categories: updatedCategories });

    const budgetRef = doc(firestore, `users/${user.uid}/budgets`, category);
    deleteDocumentNonBlocking(budgetRef);
  };


  const handleUpdateUser = (name: string) => {
    if (userDocRef) {
      updateDocumentNonBlocking(userDocRef, { name });
      setUserSettingsOpen(false);
    }
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Logout Error: ", error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "Could not log you out. Please try again.",
      });
    }
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

  const handleCopyUserIdToast = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.uid);
    localStorage.setItem(USER_ID_COPIED_KEY, 'true');
    toast({
        title: "User ID Copied!",
        description: "You can now paste this into your Apple Shortcut.",
    });
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
    if (!transactions?.length && range !== 'all') return "No data for this period";
    
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
        const oldestLoaded = transactions[transactions.length - 1]?.Date;
        const mostRecentLoaded = transactions[0]?.Date;

        if (!oldestLoaded || !mostRecentLoaded) return "All Time";
        
        const oldestDate = toDate(oldestLoaded.seconds * 1000);
        const mostRecentDate = toDate(mostRecentLoaded.seconds * 1000);

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
  
  const totalBudget = useMemo(() => {
    if (!finalUserData) return 0;
    const monthlyBudget = (finalUserData.income || 0) - (finalUserData.savings || 0);
    const now = new Date();

    switch (dateRange) {
      case 'daily':
        return monthlyBudget / getDaysInMonth(now);
      case 'week':
        return (monthlyBudget / getDaysInMonth(now)) * 7;
      case 'month':
        return monthlyBudget;
      case 'yearly':
        return monthlyBudget * 12;
      case 'all':
         if (!transactions || transactions.length === 0) return monthlyBudget;
        const oldestLoaded = transactions[transactions.length - 1]?.Date;
        if (!oldestLoaded) return monthlyBudget;
        const oldestDate = toDate(oldestLoaded.seconds * 1000);
        const monthSpan = differenceInMonths(now, oldestDate) + 1;
        return monthlyBudget * Math.max(1, monthSpan);
      default:
        return monthlyBudget;
    }
  }, [finalUserData, dateRange, transactions]);

  const expenseTransactions = useMemo(() => 
    filteredTransactions.filter(t => t.Type === 'Expense'),
    [filteredTransactions]
  );

  const totalSpent = useMemo(() => 
    expenseTransactions.reduce((sum, t) => sum + t.Amount, 0),
    [expenseTransactions]
  );

  const categories = finalUserData?.categories || [];
  const categoryColors: { [key: string]: string } = categories.reduce((acc, category, index) => {
    acc[category] = chartColors[index % chartColors.length];
    return acc;
  }, {} as { [key: string]: string });

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
  }, [chartConfig, categoryColors]);

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
        // Data is already sorted by date descending from Firestore
        return sorted;
    }
  }, [expenseTransactions, sortOption]);

  useEffect(() => {
    // When the dialog closes, reset the transaction to edit
    if (!isAddTransactionOpen) {
      setTransactionToEdit(null);
    }
  }, [isAddTransactionOpen]);

  const isLoading = isUserLoading || isUserDataLoading || (user && finalUserData !== null && (isTransactionsLoading || isBudgetsLoading));

  if (isLoading) {
    return <SkeletonLoader />;
  }

  // If user is authenticated but has no profile data (it's null after loading), show setup sheet
  if (user && finalUserData === null) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
          <div className="w-full max-w-[428px] p-6">
              <SetupSheet 
                onSave={handleSetupSave} 
                onCopyUserId={handleCopyUserId}
                userId={user.uid}
              />
          </div>
      </div>
    );
  }

  if (!user || !finalUserData || transactions === undefined || budgets === undefined) {
    return <SkeletonLoader />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background items-center">
      <div className="w-full max-w-[428px] pt-[env(safe-area-inset-top)]">
        <main className="flex-1 p-4 space-y-4 pb-[calc(env(safe-area-inset-bottom)+4rem)]">
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
           <UserSettingsDialog
              open={isUserSettingsOpen}
              onOpenChange={setUserSettingsOpen}
              user={finalUserData}
              userId={user?.uid}
              onSave={handleUpdateUser}
              onCopyUserId={handleCopyUserIdToast}
            />
            <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will be signed out of your account. You can sign back in at any time.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Log Out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold">Welcome,</h1>
              <h1 className="text-primary text-3xl font-bold">{finalUserData.name}</h1>
            </div>
            <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <Dialog open={isBudgetOpen} onOpenChange={setBudgetOpen}>
                    <DialogContent className="max-w-[400px]" onOpenAutoFocus={(e) => e.preventDefault()}>
                       <DialogHeader>
                        <DialogTitle>Wallet</DialogTitle>
                      </DialogHeader>
                      <BudgetPage 
                        user={finalUserData}
                        budgets={budgets || []} 
                        onUpdateIncome={handleUpdateIncome}
                        onUpdateSavings={handleUpdateSavings}
                        onUpdateBudget={handleUpdateBudget} 
                        onAddCategory={handleAddCategory}
                        onDeleteCategory={handleDeleteCategory}
                      />
                    </DialogContent>
                  </Dialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Settings</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setUserSettingsOpen(true)}>
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>User Profile</span>
                      </DropdownMenuItem>
                       <DropdownMenuItem onSelect={() => setBudgetOpen(true)}>
                        <Wallet className="mr-2 h-4 w-4" />
                        <span>Wallet</span>
                      </DropdownMenuItem>
                       <DropdownMenuItem onSelect={() => setReportsOpen(true)}>
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Reports</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setShowLogoutConfirm(true)} className="text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
          </div>
          
          <Balance
            totalSpending={totalSpent}
            budget={totalBudget}
            aggregatedData={aggregatedData}
            chartConfig={chartConfig}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            displayDate={displayDate}
          />
          <TransactionsTable 
            data={sortedTransactions} 
            chartConfig={chartConfig}
            hasMore={transactions ? transactions.length === visibleTransactions : false}
            onLoadMore={() => setVisibleTransactions(v => v + 20)}
            sortOption={sortOption}
            onSortChange={setSortOption}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        </main>

        <Drawer open={isAddTransactionOpen} onOpenChange={setAddTransactionOpen}>
            <DrawerTrigger asChild>
                <Button 
                    variant="default"
                    className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-6 h-16 w-16 rounded-full shadow-lg z-50"
                    style={{ backgroundColor: 'hsl(var(--primary))' }}
                >
                    <Plus className="h-8 w-8" />
                </Button>
            </DrawerTrigger>
            <DrawerContent>
                <AddTransactionForm 
                  userId={user?.uid}
                  setOpen={setAddTransactionOpen}
                  transactionToEdit={transactionToEdit}
                  categories={categories}
                />
            </DrawerContent>
        </Drawer>
        
        <Drawer open={isReportsOpen} onOpenChange={setReportsOpen}>
          <DrawerContent>
            <ReportsPage allTransactions={transactions || []} categories={categories} />
          </DrawerContent>
        </Drawer>

      </div>
    </div>
  );
}
