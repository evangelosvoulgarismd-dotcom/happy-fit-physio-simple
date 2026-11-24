// Happy Fit Physio service worker: receives push notifications and opens the right screen when tapped.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { title: 'Happy Fit Physio', body: event.data ? event.data.text() : '' }; }
  const title = data.title || 'Happy Fit Physio';
  const options = {
    body: data.body || '',
    icon: data.icon || 'icon-192.png',
    badge: data.badge || 'icon-192.png',
    // Same tag = a new message from the same conversation replaces the previous one instead of piling up.
    tag: data.tag || undefined,
    renotify: !!data.tag,
    data: { url: data.url || 'app.html' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const raw = (event.notification.data && event.notification.data.url) || 'app.html';
  // Resolve against the worker's scope so it also works in a sub-folder (GitHub Pages /happy-fit-physio-simple/).
  const target = new URL(String(raw).replace(/^\//, ''), self.registration.scope).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('app.html') && 'focus' in client) {
          try { if ('navigate' in client) await client.navigate(target); } catch (e) {}
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});
