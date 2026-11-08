/* Riposta: service worker.
 * - pliki strony (powłoka): najpierw z pamięci podręcznej, w tle odświeżane z sieci,
 * - nawigacja (HTML): najpierw sieć, bez sieci kopia z pamięci,
 * - /api/*: zawsze tylko sieć (portfel i płatności nigdy z pamięci).
 * Zmiana VERSION = nowa pamięć podręczna, stare są usuwane przy aktywacji.
 */
const VERSION = "riposta-v2-1";
const SHELL = [
  "./", "index.html", "styles.css", "app.js", "favicon.svg", "manifest.webmanifest",
  "icon-192.png", "icon-512.png", "icon-maskable-512.png", "regulamin.html", "prywatnosc.html",
];
const NEVER = /\/(api\/|healthz|admin\.html|admin\.js|platnosc-mock\.html|mock-pay\.js|sw\.js)/;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("riposta-") && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // np. Google Fonts: przeglądarka sama
  if (NEVER.test(url.pathname)) return;            // tylko sieć

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && url.pathname.endsWith("/")) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put("./", copy)); }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("./")))
    );
    return;
  }

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res.ok && res.type === "basic") { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      });
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
      return net;
    })
  );
});
