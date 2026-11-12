/* The app moved to /UMKapp/. This replaces the old offline worker: it clears the old saved copy,
   removes itself and sends any open app window to the new address. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) await caches.delete(k);
    await self.registration.unregister();
    for (const c of await self.clients.matchAll({ type: "window" })) {
      const u = new URL(c.url);
      try { c.navigate("https://bradphilpotumk.github.io/UMKapp" + u.pathname.replace(/^\/season-planner/i, "") + u.search + u.hash); } catch (e) {}
    }
  })());
});
self.addEventListener("fetch", () => {});
