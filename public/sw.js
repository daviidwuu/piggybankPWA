
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'piggybank', body: 'You have a new notification.' };
  
  const options = {
    body: data.body,
    icon: '/icon.png',
    badge: '/icon.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      url: data.url || '/',
    },
    actions: [
      { action: 'open_url', title: 'View' },
      { action: 'close', title: 'Dismiss' },
    ],
    requireInteraction: true, 
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open_url') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else {
    // Default action (if no button is clicked) or 'close' action
    // You can add logic here if you want the default click to also open a window
    if(event.notification.data.url) {
        clients.openWindow(event.notification.data.url);
    }
  }
}, false);
