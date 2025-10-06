
'use server';

import { type NextRequest, NextResponse } from "next/server";
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import webpush from 'web-push';
import { type PushSubscription } from "web-push";

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const firestore = admin.firestore();

// Configure web-push with VAPID details from environment variables
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT,
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
} else {
    console.warn("VAPID keys not configured. Push notifications will not work.");
}

async function sendPushNotification(userId: string, messageBody: string, url: string) {
    try {
        const subscriptionsSnapshot = await firestore
            .collection('users')
            .doc(userId)
            .collection('pushSubscriptions')
            .get();

        if (subscriptionsSnapshot.empty) {
            console.log("No push subscriptions found for user:", userId);
            return;
        }
        
        const payload = JSON.stringify({
            title: 'piggybank',
            body: messageBody,
            url: url,
        });

        const sendPromises = subscriptionsSnapshot.docs.map(doc => {
            const data = doc.data() as {
                endpoint?: unknown;
                keys?: { [key: string]: unknown };
                expirationTime?: unknown;
            };

            const endpoint = typeof data.endpoint === 'string' ? data.endpoint : undefined;
            const keys = data.keys || {};
            const auth = typeof keys.auth === 'string' ? keys.auth : undefined;
            const p256dh = typeof keys.p256dh === 'string' ? keys.p256dh : undefined;
            const expirationTime = typeof data.expirationTime === 'number' ? data.expirationTime : null;

            if (!endpoint || !auth || !p256dh) {
                console.warn("Skipping malformed push subscription document:", doc.id);
                return Promise.resolve();
            }

            const subscription: PushSubscription = {
                endpoint,
                keys: { auth, p256dh },
            };

            if (expirationTime !== null) {
                subscription.expirationTime = expirationTime;
            }

            return webpush.sendNotification(subscription, payload).catch(error => {
                // If subscription is expired or invalid, delete it
                if (error.statusCode === 410 || error.statusCode === 404) {
                    console.log("Subscription expired or invalid, deleting:", doc.id);
                    return doc.ref.delete();
                } else {
                    console.error("Error sending push notification, status code:", error.statusCode, error.body);
                }
            });
        });

        await Promise.all(sendPromises);

    } catch (error) {
        console.error("Failed to send push notifications:", error);
    }
}


export async function POST(request: NextRequest) {
  try {
    const { userId, ...newEntry } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 }
      );
    }
    
    const { Amount, Category, Notes, Type, Date: transactionDate } = newEntry.data || {};

    if (!Amount || !Category || !Notes || !Type) {
        return NextResponse.json(
            { error: "Incomplete transaction data provided. Required fields: Amount, Category, Notes, Type." },
            { status: 400 }
        );
    }

    if (typeof Category !== 'string') {
        return NextResponse.json(
            { error: "Category must be a string." },
            { status: 400 }
        );
    }

    const numericAmount = Number(Amount);
    if (isNaN(numericAmount)) {
         return NextResponse.json(
            { error: "Amount must be a valid number." },
            { status: 400 }
        );
    }

    const transactionData = {
        Amount: numericAmount,
        Category,
        Notes,
        Type,
        Date: transactionDate ? new Date(transactionDate) : FieldValue.serverTimestamp(),
        userId: userId,
    };
    
    // Add the new transaction to the user's transactions subcollection
    const docRef = await firestore
      .collection('users')
      .doc(userId)
      .collection('transactions')
      .add(transactionData);

    // Send a web push notification
    try {
        const message = `New transaction: ${transactionData.Notes} for $${transactionData.Amount.toFixed(2)}`;
        await sendPushNotification(userId, message, '/');
    } catch (pushError) {
        // Log the error but don't fail the transaction request
        console.error("Failed to send web push notification:", pushError);
    }

    return NextResponse.json({ success: true, id: docRef.id });

  } catch (error) {
    console.error("Failed to add transaction to Firestore:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: "Failed to add transaction to Firestore.", details: errorMessage },
      { status: 500 }
    );
  }
}
