
self.addEventListener('push', event => {
  const data = event.data.json();
  const { title, body, url } = data;

  const options = {
    body: body,
    icon: '/icon.png', // App icon
    badge: '/icon.png', // Icon for notification tray
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      url: url || '/', // Fallback to the root URL
    },
    actions: [
      {
        action: 'open_url',
        title: 'View Details'
      },
      {
        action: 'close',
        title: 'Close'
      },
    ],
    requireInteraction: true, // Make notification persistent
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close(); // Close the notification

  if (event.action === 'open_url') {
    // Open the URL specified in the push data
    clients.openWindow(event.notification.data.url);
  } else if (event.action === 'close') {
    // Just close the notification, do nothing else
  } else {
    // Default action (if user clicks the notification body)
    clients.openWindow(event.notification.data.url);
  }
}, false);
