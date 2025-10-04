'use client';

import { useState } from 'react';
import { useAuth, initiateAnonymousSignIn, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { signInWithCustomToken } from 'firebase/auth';

export default function LoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  if (isUserLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (user) {
    router.replace('/');
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'User ID cannot be empty.',
      });
      return;
    }
    setIsLoading(true);

    try {
      const userDocRef = doc(firestore, 'users', userId.trim());
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: 'No user found with that ID.',
        });
        setIsLoading(false);
        return;
      }
      
      // Since we can't "log in" as an existing anonymous user directly,
      // we'll sign in a new anonymous user and then just route to the main page.
      // The AuthGuard will see the new user, and the dashboard will load data for the provided UID.
      // This is a workaround for the user's request. A real app would use a proper auth provider.
      // A better flow would be to create a custom token on a server and use signInWithCustomToken.
      // For this environment, we will just create a new anonymous user to satisfy the auth guard.
      await signInAnonymously(auth);

      // We are not actually using the credentials of the user with 'userId',
      // but we need to signal to the app that we intend to use this user's data.
      // A robust way is to store this in session storage and have the dashboard read it.
      sessionStorage.setItem('targetedUserId', userId.trim());

      toast({
        title: 'Success',
        description: `Welcome back!`,
      });

      router.push('/');

    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    setIsLoading(true);
    try {
      const userCredential = await signInAnonymously(auth);
      const newUserId = userCredential.user.uid;
      
      // Store the new ID so the setup sheet knows who to create the document for.
      sessionStorage.setItem('targetedUserId', newUserId);
      
      toast({
        title: 'Account Created',
        description: 'You can now set up your profile.',
      });
      router.push('/'); // Redirect to the setup page (which is the root page for new users)
    } catch (error) {
        console.error('Anonymous sign-in error:', error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not create a guest account.',
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">piggybank</CardTitle>
          <CardDescription className="text-center">
            Enter your User ID to log in or create a new account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                type="text"
                placeholder="Your unique User ID"
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log In
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don't have an account?{' '}
            <Button variant="link" className="p-0 h-auto" onClick={handleCreateAccount} disabled={isLoading}>
              Create one
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
