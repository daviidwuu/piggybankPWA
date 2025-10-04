
'use client';

import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { collection, addDoc, serverTimestamp, Firestore } from "firebase/firestore";
import { type FirebaseApp } from "firebase/app";

// This is the VAPID key for your Firebase project. It is required for Web Push notifications.
const VAPID_KEY = "BBglrgnvLgJ4NVE_A8YSYoIAG9lvRVYQQaZanKuyiDyNzzhlIyQ39lES8VsePTKekVsrczEO2KlBf37JOFlD-RY"; 

/**
 * Requests permission to send push notifications and saves the token to Firestore.
 * @param userId The ID of the current user.
 * @param firestore The Firestore instance.
 * @param app The FirebaseApp instance.
 */
export async function requestNotificationPermission(userId: string, firestore: Firestore, app: FirebaseApp) {
  try {
    const supported = await isSupported();
    if (!supported) {
        console.log("Firebase Messaging is not supported in this browser.");
        return;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === "granted") {
      console.log("Notification permission granted.");
      
      const messaging = getMessaging(app);

      // Get the token, providing the VAPID key which is crucial for web push.
      const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });

      if (currentToken) {
        console.log("Push token received:", currentToken);
        // Save the token to Firestore
        const subscriptionsRef = collection(firestore, "users", userId, "pushSubscriptions");
        await addDoc(subscriptionsRef, {
          token: currentToken,
          createdAt: serverTimestamp(),
        });
        console.log("Push token saved to Firestore.");
      } else {
        // This can happen if the service worker isn't ready or there's a configuration issue.
        console.log("No registration token available. Request permission to generate one or check service worker.");
      }
    } else {
      console.log("Unable to get permission to notify.");
    }
  } catch (error) {
    console.error("An error occurred while requesting notification permission.", error);
  }
}
