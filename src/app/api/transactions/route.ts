
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
        await fetch(`${request.nextUrl.origin}/api/send-push-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                message: `New transaction added: ${transactionData.Notes} for $${transactionData.Amount.toFixed(2)}`
            })
        });
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
