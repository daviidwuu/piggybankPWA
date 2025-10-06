
'use client';

import { collection, doc, setDoc, deleteDoc, serverTimestamp, Firestore } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

/**
 * Converts a VAPID key from a URL-safe base64 string to a Uint8Array.
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Gets the current push subscription.
 */
export async function getSubscription(): Promise<PushSubscription | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return null;
    }
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return null;
    return registration.pushManager.getSubscription();
}

/**
 * Creates a Firestore-safe document ID from a subscription endpoint.
 * Replaces illegal characters like '/' with a safe character.
 * @param endpoint The subscription endpoint URL.
 */
function createSubscriptionId(endpoint: string): string {
    // btoa can produce characters that are illegal in Firestore document paths ('/').
    // We replace them with a safe character.
    return btoa(endpoint).replace(/\//g, '_');
}


/**
 * Requests permission for push notifications and saves the subscription to Firestore.
 * This function is designed to work with the standard Web Push API for PWA compatibility.
 * @param userId The ID of the current user.
 * @param firestore The Firestore instance.
 */
export async function requestNotificationPermission(userId: string, firestore: Firestore) {
  // Check if Push Notifications are supported
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn("Push notifications are not supported in this browser.");
    toast({
        variant: "destructive",
        title: "Unsupported Browser",
        description: "Push notifications are not supported on this device or browser.",
    });
    return;
  }
  
  try {
    // Register the service worker. The browser will handle updates.
    await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered.');

    // Await the service worker to be ready and active. This is crucial for iOS.
    const swRegistration = await navigator.serviceWorker.ready;
    console.log('Service Worker is ready and active:', swRegistration.active);

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Push notification permission not granted.");
    }
    console.log('Notification permission granted.');

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      throw new Error("VAPID public key is not defined in environment variables.");
    }
    console.log('VAPID key found.');

    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    console.log("Push subscription successful:", subscription);

    const subscriptionId = createSubscriptionId(subscription.endpoint);
    const subscriptionRef = doc(firestore, `users/${userId}/pushSubscriptions`, subscriptionId);
    
    await setDoc(subscriptionRef, {
      endpoint: subscription.endpoint,
      keys: subscription.toJSON().keys,
      createdAt: serverTimestamp(),
    });

    console.log("Push subscription saved to Firestore.");
    toast({
        title: "Notifications Enabled!",
        description: "You will now receive alerts for new transactions.",
    });

  } catch (error) {
    console.error("An error occurred during push notification setup:", error);
    toast({
        variant: "destructive",
        title: "Subscription Failed",
        description: error instanceof Error ? error.message : 'Could not enable push notifications.',
    });
    // Re-throw the error so the calling component can handle UI state if needed
    throw error;
  }
}

/**
 * Unsubscribes the user from push notifications and removes the subscription from Firestore.
 * @param userId The ID of the current user.
 * @param firestore The Firestore instance.
 */
export async function unsubscribeFromNotifications(userId: string, firestore: Firestore) {
  try {
    const subscription = await getSubscription();
    if (!subscription) {
      console.log("No active subscription to unsubscribe from.");
      return;
    }

    const subscriptionId = createSubscriptionId(subscription.endpoint);
    const subscriptionRef = doc(firestore, `users/${userId}/pushSubscriptions`, subscriptionId);

    // Unsubscribe the user first
    const unsubscribed = await subscription.unsubscribe();
    if (unsubscribed) {
      console.log("Successfully unsubscribed from push manager.");
      // If successful, remove from Firestore
      await deleteDoc(subscriptionRef);
      console.log("Successfully removed subscription from Firestore.");
      toast({
        title: "Notifications Disabled",
        description: "You will no longer receive push notifications.",
      });
    } else {
      console.error("Failed to unsubscribe.");
      throw new Error("The unsubscribe operation failed.");
    }
  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error);
    toast({
        variant: "destructive",
        title: "Unsubscribe Failed",
        description: error instanceof Error ? error.message : 'Could not disable notifications.',
    });
    // Re-throw so the UI can revert its state
    throw error;
  }
}
