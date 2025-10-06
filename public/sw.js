// Listen for the 'install' event, which fires when the service worker is installing.
self.addEventListener('install', (event) => {
  // skipWaiting() forces the waiting service worker to become the active service worker.
  // This is crucial for ensuring updates are applied quickly.
  self.skipWaiting();
  console.log('Service Worker: Installed');
});

// Listen for the 'activate' event, which fires when the service worker is activated.
self.addEventListener('activate', (event) => {
  // clients.claim() allows an active service worker to take control of all clients
  // (open tabs/windows) that are in its scope. This ensures that the updated
  // service worker is active for all open pages of your app.
  event.waitUntil(self.clients.claim());
  console.log('Service Worker: Activated and claimed clients');
});

// Listen for the 'push' event, which is triggered when a push message is received from a server.
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push Received.');

  // The data sent from the server is in event.data. We try to parse it as JSON.
  let pushData;
  try {
    pushData = event.data.json();
  } catch (e) {
    console.error('Push event data parsing error:', e);
    pushData = {
      title: 'piggybank',
      body: 'You have a new notification.',
    };
  }
  
  const { title, body, url, interaction = false } = pushData;

  const options = {
    body: body,
    // Use an absolute path for the icon, using self.location.origin to be safe.
    icon: self.location.origin + '/icon-192.png',
    badge: self.location.origin + '/icon-192.png',
    vibrate: [100, 50, 100], // Vibration pattern
    data: { 
      url: url || '/', // Store the URL to open on click
      dateOfArrival: Date.now() 
    },
    // On desktop, this makes the notification stay until the user interacts with it.
    requireInteraction: interaction,
    // Add actions for more interactivity
    actions: [
      { action: 'open_app', title: 'View App' },
      { action: 'dismiss', title: 'Dismiss' },
    ]
  };

  // waitUntil() ensures that the browser does not terminate the service worker
  // until the promise passed to it has resolved. Here, it waits for the notification to be shown.
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Listen for the 'notificationclick' event, which fires when a user clicks on a notification.
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked.');

  const notification = event.notification;
  const action = event.action;

  // Close the notification
  notification.close();

  if (action === 'dismiss') {
    // If dismiss was clicked, do nothing further.
    return;
  }

  // This code handles opening the app. It checks if there's already an open window
  // for your app. If so, it focuses it. If not, it opens a new one.
  const urlToOpen = notification.data.url || '/';

  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      // Check if there's a window open with the same URL.
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is found, open a new one.
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
