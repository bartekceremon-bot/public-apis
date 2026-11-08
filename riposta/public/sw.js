/* Riposta: service worker.
 * - pliki strony z tego samego źródła (HTML, JS, CSS, manifest, ikony): najpierw sieć, kopia trafia do pamięci;
 *   bez sieci odpowiedź z pamięci podręcznej (dokładne dopasowanie adresu, bez ignoreSearch),
 * - /api/*, panel właściciela i symulator płatności: zawsze tylko sieć (portfel i płatności nigdy z pamięci).
 * Zmiana VERSION = nowa pamięć podręczna, stare są usuwane przy aktywacji.
 */
const VERSION = "riposta-v3-1";
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

  // Najpierw sieć: nowa wersja strony jest widoczna od razu; kopia w pamięci tylko na wypadek braku sieci.
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && res.type === "basic") {
          const copy = res.clone();
          e.waitUntil(caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {}));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || (req.mode === "navigate" ? caches.match("./") : undefined))
          .then((hit) => hit || Response.error())
      )
  );
});
