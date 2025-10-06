
'use client';

import { doc, setDoc, deleteDoc, serverTimestamp, Firestore } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import {
  buildSubscriptionId,
  normalizeSubscriptionPayload,
  type SubscriptionRecord,
} from "@/lib/push-subscriptions";

type SubscriptionLike = PushSubscription | PushSubscriptionJSON;

let subscriptionChangeListener: ((event: MessageEvent) => void) | null = null;
let subscriptionListenerUserId: string | null = null;

async function sendMessageToServiceWorker(message: unknown) {
  const registration = await navigator.serviceWorker.ready;
  const recipient = registration.active || navigator.serviceWorker.controller;

  if (!recipient) {
    throw new Error('No active service worker available to receive messages.');
  }

  recipient.postMessage(message);
}

let cachedVapidKey: { raw: string; keyBytes: Uint8Array } | null = null;

function sanitizeVapidKey(rawKey: string | undefined) {
  return rawKey?.trim().replace(/^['"]|['"]$/g, '').replace(/\s+/g, '') ?? '';
}

function resolveVapidKey() {
  if (cachedVapidKey) {
    return cachedVapidKey;
  }

  const sanitized = sanitizeVapidKey(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);

  if (!sanitized) {
    throw new Error('VAPID public key is not defined in environment variables.');
  }

  let keyBytes: Uint8Array;

  try {
    keyBytes = urlBase64ToUint8Array(sanitized);
  } catch (error) {
    console.error('Failed to decode the configured VAPID public key.', error);
    throw new Error(
      'The configured VAPID public key is malformed. Update NEXT_PUBLIC_VAPID_PUBLIC_KEY with a valid Base64 URL-encoded value.'
    );
  }

  if (keyBytes.length < 32) {
    console.warn(
      `The decoded VAPID public key is unexpectedly short (length: ${keyBytes.length}). Double-check that NEXT_PUBLIC_VAPID_PUBLIC_KEY is correct.`
    );
  }

  cachedVapidKey = { raw: sanitized, keyBytes };

  return cachedVapidKey;
}

async function syncServiceWorkerMetadata(userId: string) {
  if (!userId) return;

  try {
    const { raw } = resolveVapidKey();

    await sendMessageToServiceWorker({
      type: 'STORE_PUSH_METADATA',
      payload: { userId, vapidPublicKey: raw },
    });
  } catch (error) {
    console.error('Failed to propagate push metadata to the service worker.', error);
  }
}

async function clearServiceWorkerMetadata() {
  try {
    await sendMessageToServiceWorker({ type: 'CLEAR_PUSH_METADATA' });
  } catch (error) {
    console.error('Failed to clear push metadata from the service worker.', error);
  }
}

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
    try {
      const pushManager = assertPushManager(registration);
      return pushManager.getSubscription();
    } catch (error) {
      console.error('Unable to inspect push subscription:', error);
      return null;
    }
}

/**
 * Requests permission for push notifications and saves the subscription to Firestore.
 * This function is designed to work with the standard Web Push API for PWA compatibility.
 * @param userId The ID of the current user.
 * @param firestore The Firestore instance.
 */
function normalizeSubscription(subscription: SubscriptionLike | null | undefined): SubscriptionRecord | null {
  if (!subscription) return null;

  const json = typeof (subscription as PushSubscription).toJSON === 'function'
    ? (subscription as PushSubscription).toJSON()
    : (subscription as PushSubscriptionJSON);

  return normalizeSubscriptionPayload(json);
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

function assertPushManager(registration: ServiceWorkerRegistration) {
  const { pushManager } = registration;

  if (!pushManager || typeof pushManager.subscribe !== "function") {
    throw new Error(
      "This browser does not expose the Push API on the active service worker registration."
    );
  }

  return pushManager;
}

async function ensureActiveSubscription(
  userId: string,
  firestore: Firestore,
  registration?: ServiceWorkerRegistration
) {
  const swRegistration = registration ?? (await navigator.serviceWorker.ready);
  const pushManager = assertPushManager(swRegistration);
  let subscription = await pushManager.getSubscription();

  const permission = typeof Notification !== 'undefined' ? Notification.permission : 'default';

  if (permission !== 'granted') {
    if (subscription) {
      await persistSubscription(userId, firestore, subscription);
    }

    return subscription;
  }

  if (!subscription) {
    subscription = await subscribeWithRegistration(swRegistration, pushManager, userId, firestore);
  } else {
    await persistSubscription(userId, firestore, subscription);
  }

  return subscription;
}

async function subscribeWithRegistration(
  registration: ServiceWorkerRegistration,
  pushManager: PushManager,
  userId: string,
  firestore: Firestore
) {
  const { keyBytes } = resolveVapidKey();

  const subscription = await pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: keyBytes,
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

    const { newSubscription, oldEndpoint, shouldResubscribe, autoPersisted } = data.payload ?? {};
    const newEndpoint =
      newSubscription && typeof newSubscription.endpoint === 'string'
        ? newSubscription.endpoint
        : null;

    try {
      if (oldEndpoint && (!newEndpoint || oldEndpoint !== newEndpoint)) {
        await removeSubscription(userId, firestore, oldEndpoint);
      }

      if (newSubscription) {
        await persistSubscription(userId, firestore, newSubscription as SubscriptionLike);
        return;
      }

      if (autoPersisted) {
        await ensureActiveSubscription(userId, firestore);
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

  void syncServiceWorkerMetadata(userId);
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
    assertPushManager(swRegistration);
    console.log('Service Worker is ready and active:', swRegistration.active);

    registerSubscriptionChangeListener(userId, firestore);
    await syncServiceWorkerMetadata(userId);

    const subscription = await ensureActiveSubscription(userId, firestore, swRegistration);

    console.log("Push subscription synchronized:", subscription);
    toast({
      title: "Notifications enabled",
      description: "You'll receive alerts on this device.",
    });

  } catch (error) {
    console.error("An error occurred during push notification setup:", error);
    const isPushServiceError =
      error instanceof DOMException &&
      typeof error.message === 'string' &&
      /push service error/i.test(error.message);

    const description = isPushServiceError
      ? 'The push service rejected the registration. Verify that your VAPID public key matches the server configuration and try again.'
      : error instanceof Error
        ? error.message
        : 'Unknown error';

    toast({
      variant: "destructive",
      title: "Failed to enable notifications",
      description,
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
      await clearServiceWorkerMetadata();
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
      await clearServiceWorkerMetadata();
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

export async function syncSubscriptionWithFirestore(userId: string, firestore: Firestore) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  if (!userId) return;

  try {
    registerSubscriptionChangeListener(userId, firestore);
    await ensureActiveSubscription(userId, firestore);
    await syncServiceWorkerMetadata(userId);
  } catch (error) {
    console.error('Failed to synchronize push subscription with Firestore on load.', error);
  }
}
