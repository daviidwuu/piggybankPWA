
// Listen to install event
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  // Activate the new service worker immediately
  self.skipWaiting();
});

// Listen to activate event
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  // Take immediate control of all open pages
  event.waitUntil(self.clients.claim());
});

// Listen to push event
self.addEventListener('push', event => {
  console.log('Service Worker: Push Received.');

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    console.error('Service Worker: Could not parse push data.', e);
    payload = {
      title: 'piggybank',
      body: 'You have a new notification.',
      url: '/',
      requireInteraction: false,
    };
  }

  const { title, body, url, requireInteraction } = payload;
  
  const options = {
    body: body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: { 
      url: url || '/' // Fallback to root URL
    },
    actions: [
      { action: 'open_app', title: 'View App' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    requireInteraction: !!requireInteraction,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Listen to notification click event
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked.');
  
  const notificationUrl = event.notification.data.url || '/';

  // Dismiss the notification
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  // This looks for an existing window and focuses it.
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url === self.location.origin + notificationUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(notificationUrl);
      }
    })
  );
});
