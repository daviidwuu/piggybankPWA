
import { firestore, messaging } from "@/firebase/server";
import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { headers } from 'next/headers';

// Helper function to extract the bearer token
function getBearerToken(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }
  return null;
}


async function sendPushNotification(userId: string, message: string) {
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
        console.error("User not found for push notification:", userId);
        return;
    }
    const userData = userDoc.data();
    const tokens = userData?.fcmTokens || [];
    const pushoverKey = userData?.pushoverKey;

    let webPushSent = false;
    let pushoverSent = false;

    // --- Existing Web Push Logic ---
    if (tokens.length > 0) {
        try {
            await messaging.sendToDevice(tokens, {
                notification: {
                    title: 'New Transaction',
                    body: message,
                },
            });
            console.log("Successfully sent Web Push notification to", tokens.length, "devices.");
            webPushSent = true;
        } catch (error) {
            console.error("Error sending Web Push notification:", error);
            // In a production app, you might want to clean up invalid tokens here
        }
    }

    // --- NEW: Pushover Logic ---
    // Make sure you have PUSHOVER_API_TOKEN in your environment variables
    if (pushoverKey && process.env.PUSHOVER_API_TOKEN) {
        try {
            const response = await fetch('https://api.pushover.net/1/messages.json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: process.env.PUSHOVER_API_TOKEN, // Your app's API token
                    user: pushoverKey, // The user's key
                    message: message,
                    title: 'New Transaction',
                }),
            });
            const result = await response.json();
            if (result.status === 1) {
                console.log("Successfully sent Pushover notification.");
                pushoverSent = true;
            } else {
                 console.error("Error sending Pushover notification:", result.errors);
            }
        } catch (error) {
            console.error("Error sending Pushover notification:", error);
        }
    }

    if (!webPushSent && !pushoverSent) {
        console.log("No push notification tokens or keys found for user:", userId);
    }
}


export async function POST(request: NextRequest) {
    try {
        const headersList = headers();
        const authHeader = headersList.get('authorization');
        const userId = getBearerToken(authHeader);

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { Amount, Category, Notes, Type, Date: transactionDate } = await request.json();

        // Basic validation
        if (!Amount || !Category || !Notes || !Type) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }
        
        const numericAmount = parseFloat(Amount);
        if (isNaN(numericAmount)) {
            return NextResponse.json({ success: false, error: "Invalid Amount" }, { status: 400 });
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
        console.error("Error adding transaction:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
