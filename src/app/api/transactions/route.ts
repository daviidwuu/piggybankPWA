
'use server';

import { type NextRequest, NextResponse } from "next/server";
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  // This will use the GOOGLE_APPLICATION_CREDENTIALS environment variable
  // or the default service account in the App Hosting environment.
  admin.initializeApp();
}

const firestore = admin.firestore();
const messaging = admin.messaging();

async function sendPushNotification(userId: string, message: string) {
    // 1. Get push tokens from Firestore
    const tokens: string[] = [];
    const subscriptionsSnapshot = await firestore
      .collection('users')
      .doc(userId)
      .collection('pushSubscriptions')
      .get();
      
    if (subscriptionsSnapshot.empty) {
      console.log("No push subscription tokens found for user:", userId);
      return { success: false, error: "No push subscription tokens found for user." };
    }
      
    subscriptionsSnapshot.forEach(doc => {
      tokens.push(doc.data().token);
    });

    if (tokens.length === 0) {
      console.log("No valid tokens found for user:", userId);
      return { success: false, error: "No valid tokens found." };
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
      
    if (errors.length > 0) {
        console.error("Push notification failures:", errors);
    }

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      errors: errors,
    };
}


export async function POST(request: NextRequest) {
  try {
    // Note: We are not validating the user with a token here.
    // This is a simplified example. In a production app, you would
    // verify an auth token from the Apple Shortcut.
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

    // Send a push notification
    try {
        const message = `New transaction added: ${transactionData.Notes} for $${transactionData.Amount.toFixed(2)}`;
        await sendPushNotification(userId, message);
    } catch (pushError) {
        // Log the error but don't fail the transaction request
        console.error("Failed to send push notification:", pushError);
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
