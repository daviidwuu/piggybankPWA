
'use server';
/**
 * @fileOverview A flow to send push notifications to a user's devices.
 * 
 * - sendPushNotification - A function that sends a push notification.
 * - PushNotificationInput - The input type for the sendPushNotification function.
 * - PushNotificationOutput - The return type for the sendPushNotification function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  // This will use the GOOGLE_APPLICATION_CREDENTIALS environment variable
  // or the default service account in the App Hosting environment.
  admin.initializeApp();
}

const firestore = admin.firestore();
const messaging = admin.messaging();

export const PushNotificationInputSchema = z.object({
  userId: z.string().describe("The ID of the user to send the notification to."),
  message: z.string().describe("The content of the notification message."),
});
export type PushNotificationInput = z.infer<typeof PushNotificationInputSchema>;

export const PushNotificationOutputSchema = z.object({
  successCount: z.number().describe("The number of messages that were sent successfully."),
  failureCount: z.number().describe("The number of messages that failed to be sent."),
  errors: z.array(z.string()).describe("A list of error messages for failed deliveries."),
});
export type PushNotificationOutput = z.infer<typeof PushNotificationOutputSchema>;

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
        title: 'New Transaction Added',
        body: message,
        icon: '/icon.png', // Optional: path to an icon
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
