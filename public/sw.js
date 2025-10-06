
// Force the waiting service worker to become the active service worker.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('push', (event) => {
  const data = event.data.json();
  const { title, body, url } = data;

  const options = {
    body: body,
    icon: '/icon.png', // Path to your app's icon
    badge: '/icon.png', // Icon for the notification badge
    vibrate: [200, 100, 200], // Vibration pattern
    data: {
      url: url, // Store the URL to open on click
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Close the notification

  const urlToOpen = event.notification.data.url || '/';

  // This looks for an existing window/tab for your site and focuses it.
  // If one isn't found, it opens a new one.
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      for (const client of clientList) {
        // If a window for the app is already open, focus it.
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
