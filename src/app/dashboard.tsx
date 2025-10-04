
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/firebase/provider";
import { useDoc as useDocument, useCollection } from "@/firebase";
import { doc } from "firebase/firestore";
import { Sidebar } from "@/components/ui/sidebar";
import { Balance } from "@/components/dashboard/balance";
import { AddTransactionForm } from "@/components/dashboard/add-transaction-form";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { BudgetPage } from "@/components/dashboard/budget-page";
import { ReportsPage } from "@/components/dashboard/reports-page";
import { DateFilter, DateRange } from "@/components/dashboard/date-filter";
import { useToast } from "@/hooks/use-toast";
import { UserData, Transaction } from "@/lib/data";
import { SkeletonLoader } from "@/components/dashboard/skeleton-loader";
import { deleteDocumentNonBlocking, updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { DeleteTransactionDialog } from "@/components/dashboard/delete-transaction-dialog";
import { UserSettingsDialog } from "@/components/dashboard/user-settings-dialog";
import { NotificationPermissionDialog } from "@/components/dashboard/notification-permission-dialog";
import { requestNotificationPermission } from "@/firebase/messaging";
import { SetupSheet } from "@/components/dashboard/setup-sheet";
import { Button } from "./ui/button";
import { LayoutGrid, List, Settings, LogOut, BellRing } from "lucide-react";


type View = 'dashboard' | 'budget' | 'reports';

export default function Dashboard() {
    const { user, firestore, signOut } = useAuth();
    const { toast } = useToast();
    const [view, setView] = useState<View>('dashboard');
    const [dateRange, setDateRange] = useState<DateRange>('month');
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const [isNotificationModalOpen, setNotificationModalOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
    const [isSetupSheetOpen, setSetupSheetOpen] = useState(false);


    const userDocRef = user ? doc(firestore, `users/${user.uid}`) : null;
    const { data: userData, loading: userLoading } = useDocument<UserData>(userDocRef);

    const { data: transactions, loading: transactionsLoading } = useCollection<Transaction>(
        user ? `users/${user.uid}/transactions` : null,
        {
            orderBy: ["Date", "desc"],
        }
    );
    
    useEffect(() => {
        if (!userLoading && userData) {
            // Check if income is 0 or not set, and if there are no transactions
            const isNewUser = (!userData.income || userData.income === 0) && transactions?.length === 0;
            setSetupSheetOpen(isNewUser);
        }
    }, [userLoading, userData, transactions]);

    const handleAddTransaction = async (data: Omit<Transaction, 'id' | 'Date'>) => {
        if (!user || !firestore) return;
        
        const newTransaction = {
            ...data,
            Date: new Date(),
            userId: user.uid,
        };

        const { id, error } = await addDocumentNonBlocking(
            `users/${user.uid}/transactions`,
            newTransaction
        );

        if (error) {
            toast({
                title: "Error",
                description: "Failed to add transaction.",
                variant: "destructive",
            });
        } else {
            toast({
                title: "Transaction Added",
                description: "Your transaction has been successfully recorded.",
            });

             // Check for notification permission after first transaction
            const permission = typeof window !== 'undefined' ? Notification.permission : 'default';
            if (permission === 'default') {
                setNotificationModalOpen(true);
            }
        }
    };

    const handleDeleteRequest = (transaction: Transaction) => {
        setTransactionToDelete(transaction);
        setDeleteModalOpen(true);
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
    
      const handleUpdateIncome = (newIncome: number) => {
        if (!userDocRef) return;
        updateDocumentNonBlocking(userDocRef, { income: newIncome });
        toast({
            title: "Income Updated",
            description: `Your monthly income has been set to $${newIncome.toFixed(2)}.`
        });
      };
    
      const handleUpdateSavings = (newSavings: number) => {
        if (!userDocRef) return;
        updateDocumentNonBlocking(userDocRef, { savings: newSavings });
         toast({
            title: "Savings Goal Updated",
            description: `Your monthly savings goal has been set to $${newSavings.toFixed(2)}.`
        });
      };

      const handleUpdatePushoverKey = (newPushoverKey: string | undefined) => {
        if (!userDocRef) return;
        updateDocumentNonBlocking(userDocRef, { pushoverKey: newPushoverKey || "" });
         toast({
            title: "Pushover Key Updated",
            description: `Your Pushover key has been saved.`
        });
    };

      const handleAllowNotifications = async () => {
        setNotificationModalOpen(false);
        if (!user) return;
        try {
            await requestNotificationPermission(user.uid);
            toast({
                title: "Notifications Enabled",
                description: "You'll now receive push notifications for new transactions."
            });
        } catch (error) {
            toast({
                title: "Notification Error",
                description: "Could not enable notifications. Please check your browser settings.",
                variant: "destructive"
            });
        }
      };
    
    if (userLoading || !userData || !transactions) {
        return <SkeletonLoader />;
    }

    const filteredTransactions = transactions.filter(t => {
        if (dateRange === 'all') return true;
        const now = new Date();
        const transactionDate = t.Date.toDate();
        if (dateRange === 'daily') {
            return transactionDate.toDateString() === now.toDateString();
        }
        if (dateRange === 'week') {
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
            startOfWeek.setHours(0, 0, 0, 0);
            return transactionDate >= startOfWeek;
        }
        if (dateRange === 'month') {
            return transactionDate.getMonth() === now.getMonth() && transactionDate.getFullYear() === now.getFullYear();
        }
        if (dateRange === 'yearly') {
            return transactionDate.getFullYear() === now.getFullYear();
        }
        return true;
    });

    const sidebarItems = [
        { icon: LayoutGrid, label: "Dashboard", onClick: () => setView('dashboard'), active: view === 'dashboard' },
        { icon: List, label: "Budget", onClick: () => setView('budget'), active: view === 'budget' },
        { icon: BellRing, label: "Notifications", onClick: () => setNotificationModalOpen(true) },
        { icon: Settings, label: "Settings", onClick: () => setSettingsModalOpen(true) },
        { icon: LogOut, label: "Sign Out", onClick: signOut },
    ];

    return (
        <div className="flex h-screen bg-background">
            <Sidebar items={sidebarItems} user={user} />
            
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">
                        {view === 'dashboard' ? 'Dashboard' : view === 'budget' ? 'Budget' : 'Reports'}
                    </h1>
                    <DateFilter value={dateRange} onValueChange={setDateRange} />
                </div>

                {view === 'dashboard' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                           <Balance transactions={filteredTransactions} income={userData?.income || 0} />
                           <TransactionsTable transactions={filteredTransactions} onDelete={handleDeleteRequest} />
                        </div>
                        <div className="lg:col-span-1">
                           <AddTransactionForm 
                                onSubmit={handleAddTransaction} 
                                savingsGoal={userData?.savings} 
                                transactions={filteredTransactions} 
                            />
                        </div>
                    </div>
                )}
                 {view === 'budget' && (
                    <BudgetPage 
                        transactions={filteredTransactions} 
                        savingsGoal={userData.savings || 0} 
                        income={userData.income || 0} 
                    />
                 )}

                {view === 'reports' && <ReportsPage transactions={transactions} />}
            </main>
            
            <DeleteTransactionDialog
                open={isDeleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                onConfirm={handleConfirmDelete}
            />

            <UserSettingsDialog
                open={isSettingsModalOpen}
                onOpenChange={setSettingsModalOpen}
                user={userData}
                onUpdateIncome={handleUpdateIncome}
                onUpdateSavings={handleUpdateSavings}
                onUpdatePushoverKey={handleUpdatePushoverKey}
            />

            <NotificationPermissionDialog
                open={isNotificationModalOpen}
                onOpenChange={setNotificationModalOpen}
                onAllow={handleAllowNotifications}
            />
             <SetupSheet 
                open={isSetupSheetOpen}
                onOpenChange={setSetupSheetOpen}
                onSave={(income, savings) => {
                    handleUpdateIncome(income);
                    handleUpdateSavings(savings);
                    setSetupSheetOpen(false);
                }}
            />
        </div>
    );
}
