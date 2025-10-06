
const PUSH_METADATA_CACHE = 'push-subscription-metadata';
const PUSH_METADATA_REQUEST = new Request('/__push_subscription_metadata__');

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function sanitizeVapidKey(rawKey) {
  return typeof rawKey === 'string'
    ? rawKey.trim().replace(/^['"]|['"]$/g, '').replace(/\s+/g, '')
    : '';
}

async function storeMetadata(payload) {
  if (!payload || typeof payload !== 'object') return;
  const { userId, vapidPublicKey } = payload;
  const sanitizedKey = sanitizeVapidKey(vapidPublicKey);

  if (typeof userId !== 'string' || !sanitizedKey) {
    return;
  }

  const cache = await caches.open(PUSH_METADATA_CACHE);
  await cache.put(
    PUSH_METADATA_REQUEST,
    new Response(JSON.stringify({ userId, vapidPublicKey: sanitizedKey }), {
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

async function readMetadata() {
  const cache = await caches.open(PUSH_METADATA_CACHE);
  const response = await cache.match(PUSH_METADATA_REQUEST);

  if (!response) {
    return null;
  }

  try {
    return await response.json();
  } catch (error) {
    console.error('Failed to parse stored push metadata.', error);
    return null;
  }
}

async function clearMetadata() {
  const cache = await caches.open(PUSH_METADATA_CACHE);
  await cache.delete(PUSH_METADATA_REQUEST);
}

async function persistSubscriptionToServer(metadata, subscription, oldEndpoint) {
  if (!metadata || typeof metadata.userId !== 'string') {
    throw new Error('Missing user metadata for push subscription persistence.');
  }

  const body = {
    userId: metadata.userId,
    subscription: subscription.toJSON(),
  };

  if (oldEndpoint) {
    body.oldEndpoint = oldEndpoint;
  }

  const response = await fetch('/api/push-subscriptions', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Failed to persist rotated subscription: ${response.status}`);
  }
}

async function broadcastSubscriptionChange(payload) {
  try {
    const clientsArr = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientsArr) {
      client.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGE', payload });
    }
  } catch (error) {
    console.error('Failed to broadcast push subscription change to clients.', error);
  }
}

// --- INSTALL / ACTIVATE ---
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// --- PUSH EVENT ---
self.addEventListener('push', e => {
  let data;
  try {
    data = e.data ? e.data.json() : {};
  } catch {
    data = {};
  }

  const title = data.title || 'piggybank';
  const body = data.body || 'You have a new notification.';
  const url = data.url || '/';

  const options = {
    body,
    icon: '/icon.png',
    badge: '/icon.png',
    vibrate: [100, 50, 100],
    requireInteraction: !!data.requireInteraction,
    data: { url },
    actions: [
      { action: 'open_url', title: 'View' },
      { action: 'close', title: 'Dismiss' },
    ],
  };

  e.waitUntil(self.registration.showNotification(title, options));
});

// --- CLICK EVENT ---
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const targetUrl = e.notification.data.url || '/';

  if (e.action === 'close') return;

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientsArr => {
      for (const c of clientsArr) {
        if (c.url.endsWith(targetUrl) && 'focus' in c) return c.focus();
      }
      return clients.openWindow(targetUrl);
    })
  );
});

// --- SUBSCRIPTION ROTATION ---
self.addEventListener('pushsubscriptionchange', event => {
  event.waitUntil(
    (async () => {
      const metadata = await readMetadata();
      const oldEndpoint = event.oldSubscription?.endpoint || null;
      let refreshedSubscription = event.newSubscription || null;
      let shouldResubscribe = !refreshedSubscription;
      let autoPersisted = false;

      const sanitizedKey = sanitizeVapidKey(metadata?.vapidPublicKey);

      if (!refreshedSubscription && sanitizedKey) {
        try {
          refreshedSubscription = await self.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(sanitizedKey),
          });
          shouldResubscribe = false;
        } catch (error) {
          console.error('Failed to automatically resubscribe after pushsubscriptionchange.', error);
          shouldResubscribe = true;
        }
      }

      if (refreshedSubscription && metadata?.userId) {
        try {
          await persistSubscriptionToServer(metadata, refreshedSubscription, oldEndpoint);
          autoPersisted = true;
        } catch (error) {
          console.error('Failed to persist rotated subscription from service worker.', error);
          shouldResubscribe = true;
        }
      } else if (refreshedSubscription && !metadata?.userId) {
        shouldResubscribe = true;
      }

      await broadcastSubscriptionChange({
        newSubscription: refreshedSubscription ? refreshedSubscription.toJSON() : null,
        oldEndpoint,
        shouldResubscribe,
        autoPersisted,
      });
    })()
  );
});

self.addEventListener('message', event => {
  const { data } = event;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'STORE_PUSH_METADATA') {
    event.waitUntil(storeMetadata(data.payload));
    return;
  }

  if (data.type === 'CLEAR_PUSH_METADATA') {
    event.waitUntil(clearMetadata());
  }
});
