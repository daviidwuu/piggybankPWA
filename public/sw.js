// public/sw.js

self.addEventListener('push', (event) => {
  const data = event.data.json();
  const title = data.title || 'piggybank';
  const options = {
    body: data.body,
    icon: '/icon.png', // Main app icon
    badge: '/icon.png', // A smaller icon for the notification bar
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus().then(client => client.navigate(urlToOpen));
      }
      return clients.openWindow(urlToOpen);
    })
  );
});
