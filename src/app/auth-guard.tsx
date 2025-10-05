'use client';

import { useUser, useDoc, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { SkeletonLoader } from '@/components/dashboard/skeleton-loader';
import { doc, collection, setDoc, query, orderBy, limit } from 'firebase/firestore';
import { type User as UserData, type Budget, type Transaction } from '@/lib/data';
import { SetupSheet } from '@/components/dashboard/setup-sheet';
import { Dashboard } from './dashboard';

const defaultCategories = [
  "F&B", "Shopping", "Transport", "Bills",
];

export function AuthGuard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userData, isLoading: isUserDataLoading } = useDoc<UserData>(userDocRef);

  const transactionsQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, `users/${user.uid}/transactions`), orderBy('Date', 'desc'), limit(20)) : null),
    [firestore, user]
  );
  const { data: transactions, isLoading: isTransactionsLoading } = useCollection<Transaction>(transactionsQuery);

  const budgetsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, `users/${user.uid}/budgets`) : null),
    [firestore, user]
  );
  const { data: budgets, isLoading: isBudgetsLoading } = useCollection<Budget>(budgetsQuery);


  useEffect(() => {
    // If the initial auth check is done and there's no user, redirect to login.
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [isUserLoading, user, router]);

  const handleSetupSave = async (data: { name: string }) => {
    if (!userDocRef || !firestore || !user) return;
    const newUserData = {
      name: data.name,
      categories: defaultCategories,
      income: 0,
      savings: 0,
    };
    // Use await to ensure the document is created before the component re-renders.
    await setDoc(userDocRef, newUserData, { merge: true });

    // Also add default budget documents for the new user.
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
  
  const isLoading = isUserLoading || isUserDataLoading || (user && (isTransactionsLoading || isBudgetsLoading));

  if (isLoading) {
    return <SkeletonLoader />;
  }
  
  // If the user is logged in but has no user data document (it's null after loading), show the setup sheet.
  if (user && userData === null) {
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

  // If the user is logged in and has data, render the main application.
  if (user && userData && transactions !== undefined && budgets !== undefined) {
    return <Dashboard 
            user={user}
            userData={userData} 
            initialTransactions={transactions || []}
            initialBudgets={budgets || []}
           />;
  }

  // Fallback loader if the user is not yet redirected.
  return <SkeletonLoader />;
}
