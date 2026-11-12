/* The app moved to /UMKapp/. This replaces the old offline worker: it clears the old saved copy,
   removes itself and reloads any open window, which then gets the 'app has moved' page. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) await caches.delete(k);
    await self.registration.unregister();
    for (const c of await self.clients.matchAll({ type: "window" })) { try { c.navigate(c.url); } catch (e) {} }
  })());
});
self.addEventListener("fetch", () => {});
