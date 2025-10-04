'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { SkeletonLoader } from '@/components/dashboard/skeleton-loader';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [isUserLoading, user, router]);

  if (isUserLoading || !user) {
    return <SkeletonLoader />;
  }

  return <>{children}</>;
}
