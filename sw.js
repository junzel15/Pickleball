// The game that used to live here installed this service worker for offline play.
// The site is now a landing page, so this version removes itself and clears the
// old cached game files, so returning visitors get the new page.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => clients.forEach((c) => c.navigate(c.url)))
  );
});
