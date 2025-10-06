
'use client';

import { doc, setDoc, deleteDoc, serverTimestamp, Firestore } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

type SubscriptionLike = PushSubscription | PushSubscriptionJSON;

interface NormalizedSubscription {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
}

let subscriptionChangeListener: ((event: MessageEvent) => void) | null = null;
let subscriptionListenerUserId: string | null = null;

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
 * Requests permission for push notifications and saves the subscription to Firestore.
 * This function is designed to work with the standard Web Push API for PWA compatibility.
 * @param userId The ID of the current user.
 * @param firestore The Firestore instance.
 */
function buildSubscriptionId(endpoint: string) {
  return endpoint.replace(/\//g, "_");
}

function normalizeSubscription(subscription: SubscriptionLike | null | undefined): NormalizedSubscription | null {
  if (!subscription) return null;

  const json = typeof (subscription as PushSubscription).toJSON === 'function'
    ? (subscription as PushSubscription).toJSON()
    : (subscription as PushSubscriptionJSON);

  const endpoint = json?.endpoint;
  const keys = json?.keys as Record<string, string | undefined> | undefined;

  if (!endpoint || !keys) return null;

  const auth = keys.auth;
  const p256dh = keys.p256dh;

  if (typeof auth !== 'string' || typeof p256dh !== 'string') {
    return null;
  }

  return {
    endpoint,
    keys: { auth, p256dh },
  };
}

async function persistSubscription(userId: string, firestore: Firestore, subscription: SubscriptionLike) {
  const normalized = normalizeSubscription(subscription);

  if (!normalized) {
    throw new Error('Received an invalid push subscription payload.');
  }

  const subscriptionRef = doc(
    firestore,
    `users/${userId}/pushSubscriptions`,
    buildSubscriptionId(normalized.endpoint)
  );

  await setDoc(subscriptionRef, {
    endpoint: normalized.endpoint,
    keys: normalized.keys,
    createdAt: serverTimestamp(),
  });
}

async function removeSubscription(userId: string, firestore: Firestore, endpoint: string | null | undefined) {
  if (!endpoint) return;

  const subscriptionRef = doc(
    firestore,
    `users/${userId}/pushSubscriptions`,
    buildSubscriptionId(endpoint)
  );

  await deleteDoc(subscriptionRef);
}

async function ensureActiveSubscription(
  userId: string,
  firestore: Firestore,
  registration?: ServiceWorkerRegistration
) {
  const swRegistration = registration ?? (await navigator.serviceWorker.ready);
  let subscription = await swRegistration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await subscribeWithRegistration(swRegistration, userId, firestore);
  } else {
    await persistSubscription(userId, firestore, subscription);
  }

  return subscription;
}

async function subscribeWithRegistration(
  registration: ServiceWorkerRegistration,
  userId: string,
  firestore: Firestore
) {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    throw new Error("VAPID public key is not defined in environment variables.");
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  await persistSubscription(userId, firestore, subscription);
  return subscription;
}

export function registerSubscriptionChangeListener(userId: string, firestore: Firestore) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  if (!userId) return;

  if (subscriptionChangeListener && subscriptionListenerUserId === userId) {
    return;
  }

  if (subscriptionChangeListener) {
    navigator.serviceWorker.removeEventListener('message', subscriptionChangeListener);
    subscriptionChangeListener = null;
    subscriptionListenerUserId = null;
  }

  const handler = async (event: MessageEvent) => {
    const { data } = event;
    if (!data || data.type !== 'PUSH_SUBSCRIPTION_CHANGE') return;

    const { newSubscription, oldEndpoint, shouldResubscribe } = data.payload ?? {};

    try {
      if (oldEndpoint) {
        await removeSubscription(userId, firestore, oldEndpoint);
      }

      if (newSubscription) {
        await persistSubscription(userId, firestore, newSubscription as SubscriptionLike);
        return;
      }

      if (shouldResubscribe !== false) {
        await ensureActiveSubscription(userId, firestore);
      }
    } catch (error) {
      console.error('Failed to synchronize push subscription change.', error);
    }
  };

  navigator.serviceWorker.addEventListener('message', handler);
  subscriptionChangeListener = handler;
  subscriptionListenerUserId = userId;
}

export async function requestNotificationPermission(userId: string, firestore: Firestore) {
  // Check if Push Notifications are supported
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn("Push notifications are not supported in this browser.");
    toast({
      variant: "destructive",
      title: "Notifications unsupported",
      description: "This browser does not support push notifications.",
    });
    return;
  }
  
  try {
    // Register the service worker. The browser will handle updates.
    await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered.');

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Push notification permission not granted.");
    }
    console.log('Notification permission granted.');

    // Await the service worker to be ready and active. This is crucial for iOS.
    const swRegistration = await navigator.serviceWorker.ready;
    console.log('Service Worker is ready and active:', swRegistration.active);

    registerSubscriptionChangeListener(userId, firestore);

    const subscription = await ensureActiveSubscription(userId, firestore, swRegistration);

    console.log("Push subscription synchronized:", subscription);
    toast({
      title: "Notifications enabled",
      description: "You'll receive alerts on this device.",
    });

  } catch (error) {
    console.error("An error occurred during push notification setup:", error);
    toast({
      variant: "destructive",
      title: "Failed to enable notifications",
      description: error instanceof Error ? error.message : "Unknown error",
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

    const subscriptionId = buildSubscriptionId(subscription.endpoint);
    const subscriptionRef = doc(firestore, `users/${userId}/pushSubscriptions`, subscriptionId);

    // Unsubscribe the user first
    const unsubscribed = await subscription.unsubscribe();
    if (unsubscribed) {
      console.log("Successfully unsubscribed from push manager.");
      // If successful, remove from Firestore
      await deleteDoc(subscriptionRef);
      console.log("Successfully removed subscription from Firestore.");
      toast({
        title: "Notifications disabled",
        description: "You will no longer receive alerts on this device.",
      });
    } else {
      console.error("Failed to unsubscribe.");
      throw new Error("The unsubscribe operation failed.");
    }
  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error);
    toast({
      variant: "destructive",
      title: "Failed to disable notifications",
      description: error instanceof Error ? error.message : "Unknown error",
    });
    // Re-throw so the UI can revert its state
    throw error;
  }
}
