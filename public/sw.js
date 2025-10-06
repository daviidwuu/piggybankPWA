// This is the service worker file for handling push notifications.

// Listen for push events from the server.
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.error('Push event but no data');
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    // If the payload is not JSON, treat it as text.
    payload = {
      title: 'piggybank',
      body: event.data.text(),
      url: '/', // Default URL
    };
  }

  const options = {
    body: payload.body,
    icon: '/icon.png', // App icon
    badge: '/icon.png', // Icon for the notification shade
    requireInteraction: true, // Keep notification visible until interacted with
    data: {
      url: payload.url || '/', // URL to open on click
    },
    // Example actions
    actions: [
      { action: 'view_app', title: 'Open App' },
    ],
  };

  const promiseChain = self.registration.showNotification(payload.title, options);
  event.waitUntil(promiseChain);
});

// Listen for clicks on the notification.
self.addEventListener('notificationclick', (event) => {
  const clickedNotification = event.notification;
  clickedNotification.close();

  // Decide what to do based on the action button clicked.
  const promiseChain = clients.openWindow(clickedNotification.data.url);
  event.waitUntil(promiseChain);
});
