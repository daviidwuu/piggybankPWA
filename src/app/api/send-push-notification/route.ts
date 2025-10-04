// IMPORTANT: This file is a simplified wrapper for the Genkit flow.
// The main logic is in src/ai/send-push-notification.ts
'use server';

import { sendPushNotification } from '@/ai/flows/send-push-notification';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { userId, message } = await req.json();

    if (!userId || !message) {
      return NextResponse.json(
        { success: false, error: 'userId and message are required.' },
        { status: 400 }
      );
    }

    const result = await sendPushNotification({ userId, message });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Error in send-push-notification route:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unknown error occurred.' },
      { status: 500 }
    );
  }
}
