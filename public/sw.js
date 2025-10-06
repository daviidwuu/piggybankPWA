
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
