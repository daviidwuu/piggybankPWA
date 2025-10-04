
'use server';
/**
 * @fileOverview A flow to send push notifications to a user's devices.
 * 
 * - sendPushNotification - A function that sends a push notification.
 */

import { ai } from '@/ai/genkit';
import * as admin from 'firebase-admin';
import { PushNotificationInputSchema, PushNotificationOutputSchema, type PushNotificationInput, type PushNotificationOutput } from './types';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  // This will use the GOOGLE_APPLICATION_CREDENTIALS environment variable
  // or the default service account in the App Hosting environment.
  admin.initializeApp();
}

const firestore = admin.firestore();
const messaging = admin.messaging();

// This is the exported wrapper function.
export async function sendPushNotification(input: PushNotificationInput): Promise<PushNotificationOutput> {
  return sendPushNotificationFlow(input);
}

const sendPushNotificationFlow = ai.defineFlow(
  {
    name: 'sendPushNotificationFlow',
    inputSchema: PushNotificationInputSchema,
    outputSchema: PushNotificationOutputSchema,
  },
  async (input) => {
    const { userId, message } = input;
    
    // 1. Get push tokens from Firestore
    const tokens: string[] = [];
    const subscriptionsSnapshot = await firestore
      .collection('users')
      .doc(userId)
      .collection('pushSubscriptions')
      .get();
      
    if (subscriptionsSnapshot.empty) {
      return { successCount: 0, failureCount: 0, errors: ["No push subscription tokens found for user."] };
    }
      
    subscriptionsSnapshot.forEach(doc => {
      tokens.push(doc.data().token);
    });

    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0, errors: ["No valid tokens found."] };
    }

    // 2. Construct the push message payload
    const payload: admin.messaging.MessagingPayload = {
      notification: {
        title: 'piggybank',
        body: message,
        icon: '/icon.png',
      },
    };

    // 3. Send the message to all tokens
    const response = await messaging.sendToDevice(tokens, payload);

    const errors = response.results
      .map((r, i) => r.error ? `Token ${i}: ${r.error.message}`: null)
      .filter((e): e is string => e !== null);

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      errors: errors,
    };
  }
);
