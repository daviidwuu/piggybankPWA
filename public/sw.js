
// This is the service worker file for handling push notifications.

// Listen for the 'push' event.
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');
  
  // Default data if payload is empty
  let data = {
    title: 'piggybank',
    body: 'You have a new notification.',
    url: '/',
  };

  // Try to parse the payload from the push event
  if (event.data) {
    try {
      const payload = event.data.json();
      data.title = payload.title || data.title;
      data.body = payload.body || data.body;
      data.url = payload.url || data.url;
    } catch (e) {
      console.error('[Service Worker] Push event payload is not valid JSON:', e);
      // Fallback to text if JSON parsing fails
      try {
        data.body = event.data.text();
      } catch (e2) {
        console.error('[Service Worker] Could not get text from push data:', e2);
      }
    }
  }

  const options = {
    body: data.body,
    icon: '/icon.png', // Path to your app icon
    badge: '/icon.png', // Path to a badge icon (often monochrome)
    data: {
      url: data.url, // Store the URL to open on click
    },
  };

  // Show the notification.
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Listen for the 'notificationclick' event.
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');

  // Close the notification.
  event.notification.close();

  // Get the URL from the notification data and open a new window/tab.
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a window open at the target URL.
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// This is a basic service worker. It's often enhanced with caching strategies for PWA offline capability.
// The `next-pwa` package handles this for you, but this basic setup is good for push notifications.

self.addEventListener('install', (event) => {
    console.log('[Service Worker] Install');
    // Skip waiting to ensure the new service worker activates immediately.
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activate');
    // Take control of all pages under this service worker's scope immediately.
    event.waitUntil(clients.claim());
});
