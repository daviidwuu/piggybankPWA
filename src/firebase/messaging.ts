
'use client';

import { collection, doc, setDoc, serverTimestamp, Firestore } from "firebase/firestore";

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
    // Register the service worker
    const swRegistration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered:', swRegistration);
    
    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('Service Worker is ready.');

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Push notification permission not granted.");
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      throw new Error("VAPID public key is not defined in environment variables.");
    }

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
  }
}
