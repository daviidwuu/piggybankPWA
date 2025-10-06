'use server';

import { NextResponse, type NextRequest } from 'next/server';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { buildSubscriptionId, normalizeSubscriptionPayload } from '@/lib/push-subscriptions';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const firestore = admin.firestore();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, subscription, oldEndpoint } = body ?? {};

    if (typeof userId !== 'string' || !userId.trim()) {
      return NextResponse.json(
        { error: 'User ID is required.' },
        { status: 400 }
      );
    }

    const normalized = normalizeSubscriptionPayload(subscription);

    if (!normalized) {
      return NextResponse.json(
        { error: 'Invalid subscription payload.' },
        { status: 400 }
      );
    }

    const subscriptionRef = firestore
      .collection('users')
      .doc(userId)
      .collection('pushSubscriptions')
      .doc(buildSubscriptionId(normalized.endpoint));

    await subscriptionRef.set(
      {
        endpoint: normalized.endpoint,
        keys: normalized.keys,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    if (typeof oldEndpoint === 'string' && oldEndpoint && oldEndpoint !== normalized.endpoint) {
      const oldRef = firestore
        .collection('users')
        .doc(userId)
        .collection('pushSubscriptions')
        .doc(buildSubscriptionId(oldEndpoint));

      try {
        await oldRef.delete();
      } catch (error) {
        console.warn('Failed to delete stale subscription during rotation.', error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to persist push subscription.', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to persist push subscription.', details: message },
      { status: 500 }
    );
  }
}
