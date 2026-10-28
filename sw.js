/* Season Planner offline support.
   Pages and race data: try the network first (so updates show straight away), fall back to the saved copy when offline.
   Logos, icons and fonts: use the saved copy, refresh it in the background. */
const CACHE = "umk-planner-v1";
const CORE = [
  "./", "index.html", "manifest.webmanifest", "version.json",
  "data/races.json", "data/brad.json",
  "favicon.png", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "logo.png",
  "logos/sponsors/helmet28.png", "logos/sponsors/xenduri.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(new Request(u, {cache: "reload"})).catch(() => {})))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("umk-planner-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

function fresh(req, key) {
  /* network first with a time limit, then the saved copy */
  return new Promise(resolve => {
    let done = false;
    const fallback = () => caches.match(key, {ignoreSearch: true}).then(r => r || (req.mode === "navigate" ? caches.match("index.html") : null));
    const t = setTimeout(() => fallback().then(r => { if (r && !done) { done = true; resolve(r); } }), 4000);
    fetch(req.url, {cache: "no-store", credentials: "same-origin"}).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
      clearTimeout(t); if (!done) { done = true; resolve(res); }
    }).catch(() => fallback().then(r => { clearTimeout(t); if (!done) { done = true; resolve(r || Response.error()); } }));
  });
}

function saved(req) {
  /* saved copy straight away, refreshed in the background */
  return caches.match(req).then(hit => {
    const net = fetch(req).then(res => {
      if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => hit || Response.error());
    return hit || net;
  });
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (url.pathname.startsWith("/_blob/")) return;
    const p = url.pathname.replace(/^\/+/, "");
    if (req.mode === "navigate" || p === "" || p === "index.html") { e.respondWith(fresh(req, "index.html")); return; }
    if (p === "version.json" || p.startsWith("data/")) { e.respondWith(fresh(req, url.pathname.slice(1))); return; }
    e.respondWith(saved(req));
    return;
  }
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") e.respondWith(saved(req));
});
