
'use client';

import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { SkeletonLoader } from '@/components/dashboard/skeleton-loader';
import { doc, setDoc, collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { type User as UserData } from '@/lib/data';
import { SetupSheet } from '@/components/dashboard/setup-sheet';
import { Dashboard } from './dashboard';

const defaultCategories = [
  "F&B", "Shopping", "Transport", "Bills",
];

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userData, isLoading: isUserDataLoading } = useDoc<UserData>(userDocRef);

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

  // This condition is the key to fixing the flicker.
  // It ensures we show the loader until we have a definitive answer on userData.
  // We check `userData === undefined` because the `useDoc` hook initializes data to `undefined`.
  // This prevents the brief moment where `isUserDataLoading` is false but `userData` is not yet `null` or an object.
  if (isUserLoading || (user && userData === undefined)) {
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
  if (user && userData) {
    return <>{children}</>;
  }

  // Fallback loader if the user is not yet redirected.
  return <SkeletonLoader />;
}
