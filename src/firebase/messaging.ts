
'use client';

import { collection, doc, setDoc, deleteDoc, serverTimestamp, Firestore } from "firebase/firestore";

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
export async function requestNotificationPermission(userId: string, firestore: Firestore) {
  // Check if Push Notifications are supported
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn("Push notifications are not supported in this browser.");
    alert("Push notifications are not supported on this device or browser.");
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

    // Use a stable identifier for the document ID. The endpoint is a good candidate.
    // Use btoa to create a filesystem-safe ID from the endpoint URL.
    const subscriptionId = btoa(subscription.endpoint);
    const subscriptionRef = doc(firestore, `users/${userId}/pushSubscriptions`, subscriptionId);
    
    await setDoc(subscriptionRef, {
      endpoint: subscription.endpoint,
      keys: subscription.toJSON().keys,
      createdAt: serverTimestamp(),
    });

    console.log("Push subscription saved to Firestore.");
    alert("Push notifications have been enabled!");

  } catch (error) {
    console.error("An error occurred during push notification setup:", error);
    alert(`Failed to enable push notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

    const subscriptionId = btoa(subscription.endpoint);
    const subscriptionRef = doc(firestore, `users/${userId}/pushSubscriptions`, subscriptionId);

    // Unsubscribe the user first
    const unsubscribed = await subscription.unsubscribe();
    if (unsubscribed) {
      console.log("Successfully unsubscribed from push manager.");
      // If successful, remove from Firestore
      await deleteDoc(subscriptionRef);
      console.log("Successfully removed subscription from Firestore.");
      alert("Push notifications have been disabled.");
    } else {
      console.error("Failed to unsubscribe.");
      throw new Error("The unsubscribe operation failed.");
    }
  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error);
    alert(`Failed to disable push notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    // Re-throw so the UI can revert its state
    throw error;
  }
}
