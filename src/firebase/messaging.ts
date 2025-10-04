
'use client';

import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { collection, addDoc, serverTimestamp, Firestore } from "firebase/firestore";
import { type FirebaseApp } from "firebase/app";

// This is a placeholder for your VAPID key.
// You need to generate this in your Firebase project settings.
// Go to Project settings > Cloud Messaging > Web configuration > Generate key pair
const VAPID_KEY = "YOUR_VAPID_KEY_HERE"; 

/**
 * Requests permission to send push notifications and saves the token to Firestore.
 * @param userId The ID of the current user.
 * @param firestore The Firestore instance.
 * @param app The FirebaseApp instance.
 */
export async function requestNotificationPermission(userId: string, firestore: Firestore, app: FirebaseApp) {
  try {
    const supported = await isSupported();
    if (!supported || typeof window === 'undefined') {
        console.log("Firebase Messaging is not supported in this browser.");
        return;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === "granted") {
      console.log("Notification permission granted.");
      
      const messaging = getMessaging(app);

      // Get the token
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
        console.log("No registration token available. Request permission to generate one.");
      }
    } else {
      console.log("Unable to get permission to notify.");
    }
  } catch (error) {
    console.error("An error occurred while requesting notification permission.", error);
  }
}

    