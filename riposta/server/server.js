// Serwer Riposty: zero frameworków, sam Node. Uruchom: npm start
import http from "node:http";
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config, ROOT } from "./config.js";
import { createStore, today } from "./store.js";
import { createAi, AiError, WHO } from "./ai.js";
import { createPayments } from "./payments/index.js";

const PUBLIC_DIR = path.join(ROOT, "public");
const MAX_BODY = 16 * 1024;
const MAX_BODY_IMAGE = Math.floor(2.5 * 1024 * 1024); // trasy przyjmujące zrzut ekranu
const IMAGE_ROUTES = new Set(["/api/riposta", "/api/dekoder"]);
const MAX_MESSAGE = 1500;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const HTML_HEAD = '<!doctype html><html lang="pl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#2E46F0">\n';

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".json": "application/json", ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json", ".xml": "application/xml; charset=utf-8",
  ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".woff2": "font/woff2",
};

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; manifest-src 'self'; worker-src 'self'; frame-ancestors 'none'; form-action 'self' https://*.przelewy24.pl https://checkout.stripe.com",
};

// Magiczne bajty: deklarowany typ musi zgadzać się z zawartością pliku.
function magicMatches(buf, mediaType) {
  if (mediaType === "image/jpeg") return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (mediaType === "image/png") return buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mediaType === "image/webp") return buf.length > 12 && buf.toString("latin1", 0, 4) === "RIFF" && buf.toString("latin1", 8, 12) === "WEBP";
  return false;
}

// Zwraca { mediaType, data } (kanoniczny base64) albo null, gdy obraz jest niepoprawny.
export function parseImage(image, maxBytes) {
  if (!image || typeof image !== "object") return null;
  const mediaType = String(image.mediaType || "").toLowerCase();
  if (!IMAGE_TYPES.has(mediaType) || typeof image.data !== "string") return null;
  const b64 = image.data.replace(/^data:[^,]*;base64,/, "").replace(/\s+/g, "");
  if (!b64 || b64.length > Math.ceil(maxBytes / 3) * 4 + 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) return null;
  const buf = Buffer.from(b64, "base64");
  if (!buf.length || buf.length > maxBytes || !magicMatches(buf, mediaType)) return null;
  return { mediaType, data: buf.toString("base64") };
}

// Porównanie tokenów w stałym czasie (hasze mają zawsze tę samą długość).
function safeEqual(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function createApp({ store, ai, payments, cfg = config, publicDir = PUBLIC_DIR }) {
  // Limit zapytań: okno 60 s na klucz, { start, n }. Koszt na zapytanie O(1);
  // przeterminowane klucze sprząta timer co minutę (unref: nie blokuje wyjścia procesu ani testów).
  const WINDOW_MS = 60_000;
  const hits = new Map();
  // Darmowe riposty dla nowych portfeli: ile portfeli z darmowymi dostało dziś (dzień w Warszawie) dane IP.
  const freeGrants = new Map();
  let freeGrantsDay = today();
  const freeWalletsPerIpPerDay = cfg.freeWalletsPerIpPerDay ?? 5;
  const pruneTimer = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (now - v.start >= WINDOW_MS) hits.delete(k);
    if (today() !== freeGrantsDay) { freeGrants.clear(); freeGrantsDay = today(); }
  }, WINDOW_MS);
  pruneTimer.unref?.();
  const maxImageBytes = cfg.maxImageBytes || 1572864;
  const dekoderPriceGr = cfg.dekoderPriceGr ?? cfg.priceGr;

  function windowFor(key, now = Date.now()) {
    let w = hits.get(key);
    if (!w || now - w.start >= WINDOW_MS) { w = { start: now, n: 0 }; hits.set(key, w); }
    return w;
  }
  // Liczy zapytanie i zwraca true, gdy przekroczono limit.
  function rateLimited(key, limit = cfg.rateLimitPerMinute) {
    const w = windowFor(key);
    w.n += 1;
    return w.n > limit;
  }
  // Tylko sprawdza (bez liczenia), np. dla limitu nieudanych logowań.
  function overLimit(key, limit) {
    const w = hits.get(key);
    return Boolean(w && Date.now() - w.start < WINDOW_MS && w.n >= limit);
  }

  // Za reverse proxy bierzemy OSTATNI wpis X-Forwarded-For: dopisuje go nasze (zaufane) proxy.
  // Wcześniejsze wpisy przysyła klient i można je podrobić. Zakładamy dokładnie jeden skok proxy.
  function clientIp(req) {
    if (cfg.trustProxy) {
      const parts = String(req.headers["x-forwarded-for"] || "").split(",").map((s) => s.trim()).filter(Boolean);
      if (parts.length) return parts[parts.length - 1];
    }
    return req.socket.remoteAddress || "?";
  }

  // Czy to IP może dziś jeszcze dostać portfel z darmowymi ripostami? (liczy przyznanie)
  function grantFree(ip) {
    const day = today();
    if (day !== freeGrantsDay) { freeGrants.clear(); freeGrantsDay = day; }
    const n = freeGrants.get(ip) || 0;
    if (n >= freeWalletsPerIpPerDay) return false;
    freeGrants.set(ip, n + 1);
    return true;
  }

  function send(res, status, body, headers = {}) {
    const isJson = typeof body !== "string" && !Buffer.isBuffer(body);
    res.writeHead(status, {
      ...SECURITY_HEADERS,
      ...(isJson ? { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } : {}),
      ...headers,
    });
    res.end(isJson ? JSON.stringify(body) : body);
  }
  const fail = (res, status, code, message) => send(res, status, { error: code, message });

  // Za duże body: przestajemy zbierać dane, ale (do rozsądnej granicy) doczytujemy je do końca,
  // żeby klient dostał czytelne 413 zamiast zerwanego połączenia. Bardzo duże body ucinamy od razu.
  function readBody(req, limit = MAX_BODY) {
    return new Promise((resolve, reject) => {
      const tooLarge = () => Object.assign(new Error("too_large"), { status: 413 });
      const declared = Number(req.headers["content-length"] || 0);
      if (declared > limit * 4) { reject(tooLarge()); req.destroy(); return; }
      let size = 0;
      let over = false;
      const chunks = [];
      req.on("data", (c) => {
        size += c.length;
        if (size > limit) {
          over = true;
          chunks.length = 0;
          if (size > limit * 4) { reject(tooLarge()); req.destroy(); }
          return;
        }
        chunks.push(c);
      });
      req.on("end", () => (over ? reject(tooLarge()) : resolve(Buffer.concat(chunks).toString("utf8"))));
      req.on("error", reject);
    });
  }
  async function readJson(req, limit) {
    const raw = await readBody(req, limit);
    try { return raw ? JSON.parse(raw) : {}; } catch { throw Object.assign(new Error("bad_json"), { status: 400 }); }
  }

  function cookies(req) {
    return Object.fromEntries(
      String(req.headers.cookie || "").split(";").map((c) => c.trim().split("=")).filter((p) => p[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join("="))]),
    );
  }

  function setRidCookie(res, userId) {
    const secure = cfg.publicUrl.startsWith("https://") ? "; Secure" : "";
    res.setHeader("Set-Cookie", `rid=${userId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=63072000${secure}`);
  }

  // Anonimowy użytkownik rozpoznawany po ciasteczku (bez zakładania konta).
  function getOrCreateUser(req, res) {
    const rid = cookies(req).rid;
    let user = rid && store.getUser(rid);
    if (!user) {
      // Limit darmowych na IP i dzień: kolejne portfele działają, ale tylko z płatnym doładowaniem.
      const capped = cfg.freeOnStart > 0 && !grantFree(clientIp(req));
      user = store.createUser(capped ? 0 : cfg.freeOnStart, { capped });
      setRidCookie(res, user.id);
    }
    return user;
  }

  const publicUser = (u) => ({
    balanceGr: u.balanceGr,
    freeLeft: u.freeLeft,
    ripostesLeft: u.freeLeft + Math.floor(u.balanceGr / cfg.priceGr),
    referralCode: u.referralCode,
    referredBy: Boolean(u.referredBy),
    stats: { ripostes: 0, dekoder: 0, spentGr: 0, maxSpice: 0, ...u.stats },
  });

  // Wspólne wejście riposty i Dekodera: kto, treść i opcjonalny zrzut ekranu.
  // Zwraca { who, message, image } albo { error: [status, code, message] }.
  function parseAsk(body) {
    const message = String(body.message || "").trim();
    const who = WHO.includes(body.who) ? body.who : "Znajomy";
    let image = null;
    if (body.image != null) {
      image = parseImage(body.image, maxImageBytes);
      if (!image) return { error: [400, "bad_image", "Obsługujemy zdjęcia JPG, PNG i WebP do 1,5 MB."] };
    }
    if (!message && !image) return { error: [400, "empty", "Wklej wiadomość albo dodaj zrzut ekranu."] };
    if (message.length > MAX_MESSAGE) return { error: [400, "too_long", `Maksymalnie ${MAX_MESSAGE} znaków.`] };
    return { who, message, image };
  }

  // Wspólne rozliczenie płatnych produktów (riposta, Dekoder):
  // 1) rezerwujemy opłatę (najpierw darmowe, potem portfel), 2) generujemy, 3) przy błędzie AI zwracamy opłatę.
  // stat: zagregowane liczniki (np. { who, spice }); nigdy treść.
  async function paidAiCall(res, user, { kind, priceGr, stat, run, onSuccess, respond }) {
    let paidWith;
    if (user.freeLeft > 0) paidWith = "free";
    else if (user.balanceGr >= priceGr) paidWith = "wallet";
    else return fail(res, 402, "no_funds", "Brakuje środków. Doładuj portfel.");
    store.updateUser(user.id, (u) => { if (paidWith === "free") u.freeLeft -= 1; else u.balanceGr -= priceGr; });

    let result;
    try {
      result = await run();
    } catch (err) {
      store.updateUser(user.id, (u) => { if (paidWith === "free") u.freeLeft += 1; else u.balanceGr += priceGr; });
      store.recordAiError();
      const code = err instanceof AiError ? err.code : "failed";
      // Log bez treści wiadomości i bez obrazu.
      console.error(JSON.stringify({ ev: `${kind}_error`, code, msg: String(err?.message || err).slice(0, 200) }));
      const msg = { refused: "Tej wiadomości Riposta nie obsłuży. Zmień treść.", busy: "AI ma chwilę zadyszki. Spróbuj za moment." }[code]
        || "Coś poszło nie tak. Nic nie pobraliśmy.";
      return fail(res, code === "refused" ? 422 : 503, code, msg + (code !== "failed" ? " Nic nie pobraliśmy." : ""));
    }
    const updated = store.updateUser(user.id, (u) => {
      onSuccess(u);
      if (paidWith === "wallet") u.stats.spentGr = (u.stats.spentGr || 0) + priceGr;
    });
    store.recordUsage({ kind, paidWith, ...stat });
    return send(res, 200, { ...respond(result), paidWith, me: publicUser(updated) });
  }

  function serveStatic(req, res, pathname) {
    let rel = decodeURIComponent(pathname);
    if (rel === "/") rel = "/index.html";
    const file = path.normalize(path.join(publicDir, rel));
    if (!file.startsWith(publicDir + path.sep)) return fail(res, 403, "forbidden", "Brak dostępu.");
    fs.readFile(file, (err, data) => {
      if (err) {
        return fs.readFile(path.join(publicDir, "404.html"), (e2, d2) => {
          if (!e2 && !/^\s*<!doctype/i.test(d2.toString("utf8", 0, 32))) d2 = Buffer.concat([Buffer.from(HTML_HEAD), d2]);
          send(res, 404, e2 ? "Nie ma takiej strony." : d2, { "Content-Type": TYPES[".html"] });
        });
      }
      const type = TYPES[path.extname(file)] || "application/octet-stream";
      // Strony w public/ są pisane bez szkieletu (żeby ten sam plik działał też jako artefakt na claude.ai).
      if (type.startsWith("text/html") && !/^\s*<!doctype/i.test(data.toString("utf8", 0, 32))) {
        data = Buffer.concat([Buffer.from(HTML_HEAD), data]);
      }
      const headers = { "Content-Type": type, "Cache-Control": type.startsWith("text/html") ? "no-cache" : "public, max-age=3600" };
      // Service worker: zawsze świeży i z zasięgiem na cały serwis.
      if (rel === "/sw.js") Object.assign(headers, { "Cache-Control": "no-cache", "Service-Worker-Allowed": "/" });
      if (rel === "/manifest.webmanifest") headers["Cache-Control"] = "no-cache";
      send(res, 200, data, headers);
    });
  }

  async function handleApi(req, res, url) {
    const { pathname } = url;
    const method = req.method;

    if (method === "GET" && pathname === "/api/config") {
      return send(res, 200, {
        priceGr: cfg.priceGr, freeOnStart: cfg.freeOnStart, referralBonus: cfg.referralBonus,
        packages: cfg.packages, who: WHO, paymentProvider: payments.name, needsEmail: payments.needsEmail,
        aiMode: ai.mode,
        features: { images: true, dekoder: true, walletCode: true },
        dekoderPriceGr, maxImageBytes,
      });
    }

    if (method === "GET" && pathname === "/api/me") {
      return send(res, 200, publicUser(getOrCreateUser(req, res)));
    }

    if (method === "POST" && (pathname === "/api/riposta" || pathname === "/api/dekoder")) {
      const isDekoder = pathname === "/api/dekoder";
      const user = getOrCreateUser(req, res);
      const ip = clientIp(req);
      if (rateLimited("u:" + user.id) || rateLimited("ip:" + ip)) return fail(res, 429, "rate_limited", "Za szybko! Odczekaj minutę.");

      const body = await readJson(req, MAX_BODY_IMAGE);
      const ask = parseAsk(body);
      if (ask.error) return fail(res, ...ask.error);
      const { who, message, image } = ask;

      if (isDekoder) {
        return paidAiCall(res, user, {
          kind: "dekoder",
          priceGr: dekoderPriceGr,
          stat: { who },
          run: () => ai.decode({ who, message, image }),
          onSuccess: (u) => { u.stats.dekoder = (u.stats.dekoder || 0) + 1; },
          respond: ({ analysis, usage }) => {
            console.log(JSON.stringify({ ev: "dekoder", who, image: Boolean(image), model: usage.model, in: usage.input, out: usage.output }));
            return { analysis };
          },
        });
      }

      const goal = String(body.goal || "").slice(0, 120);
      const spice = Math.min(5, Math.max(1, Number.parseInt(body.spice, 10) || 3));
      return paidAiCall(res, user, {
        kind: "riposta",
        priceGr: cfg.priceGr,
        stat: { who, spice },
        run: () => ai.generate({ who, goal, message, spice, image }),
        onSuccess: (u) => {
          u.stats.ripostes += 1;
          u.stats.maxSpice = Math.max(u.stats.maxSpice || 0, spice);
        },
        respond: ({ replies, usage }) => {
          // Log bez treści wiadomości i bez obrazu (prywatność).
          console.log(JSON.stringify({ ev: "riposta", spice, who, image: Boolean(image), model: usage.model, in: usage.input, out: usage.output }));
          return { replies };
        },
      });
    }

    if (method === "GET" && pathname === "/api/wallet/code") {
      const user = getOrCreateUser(req, res);
      return send(res, 200, { code: store.getWalletCode(user.id) });
    }

    if (method === "POST" && pathname === "/api/wallet/code/rotate") {
      const user = getOrCreateUser(req, res);
      return send(res, 200, { code: store.rotateWalletCode(user.id) });
    }

    if (method === "POST" && pathname === "/api/wallet/restore") {
      if (rateLimited("restore:" + clientIp(req), cfg.walletRestorePerMinute ?? 5)) {
        return fail(res, 429, "rate_limited", "Za dużo prób. Odczekaj minutę.");
      }
      const { code } = await readJson(req);
      const userId = store.userIdByWalletCode(code);
      if (!userId) return fail(res, 404, "bad_code", "Nie ma portfela z takim kodem.");
      // Płatne saldo z tego telefonu (bez darmowych) przechodzi do przywracanego portfela, żeby nic nie przepadło.
      const current = store.getUser(cookies(req).rid);
      const mergedGr = current && current.id !== userId ? store.moveBalance(current.id, userId) : 0;
      // Kod widziany na ekranie mógł ktoś podejrzeć: po przywróceniu od razu go wymieniamy.
      const newCode = store.rotateWalletCode(userId);
      setRidCookie(res, userId);
      console.log(JSON.stringify({ ev: "wallet_restore", merged: mergedGr > 0 }));
      return send(res, 200, { me: publicUser(store.getUser(userId)), newCode, mergedGr });
    }

    if (method === "GET" && pathname === "/api/admin/stats") {
      if (!cfg.adminToken) return fail(res, 404, "not_found", "Nie ma takiego adresu API.");
      const failKey = "adminfail:" + clientIp(req);
      const failLimit = cfg.adminFailPerMinute ?? 10;
      if (overLimit(failKey, failLimit)) return fail(res, 429, "rate_limited", "Za dużo prób. Odczekaj minutę.");
      const m = String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i);
      if (!m || !safeEqual(m[1].trim(), cfg.adminToken)) {
        rateLimited(failKey, failLimit);
        return fail(res, 401, "unauthorized", "Zły token.");
      }
      return send(res, 200, store.adminStats(30));
    }

    if (method === "POST" && pathname === "/api/referral") {
      const user = getOrCreateUser(req, res);
      const { code } = await readJson(req);
      const ownerId = store.userIdByReferral(code);
      if (!ownerId) return fail(res, 404, "bad_code", "Nie ma takiego kodu.");
      if (ownerId === user.id) return fail(res, 400, "own_code", "Sprytne, ale własnego kodu nie wpiszesz 😏");
      if (user.referredBy) return fail(res, 409, "already", "Kod polecający można użyć tylko raz.");
      const used = user.stats.ripostes > 0 || (user.stats.dekoder || 0) > 0 || (user.stats.spentGr || 0) > 0
        || user.balanceGr > 0 || store.hasPayments(user.id);
      if (used) return fail(res, 409, "not_new", "Kod działa tylko dla nowych osób.");
      // Portfele ponad limit darmowych nie odbierają bonusu (inaczej dałoby się "farmić" polecenia).
      if (user.capped) return fail(res, 409, "not_eligible", "Bonus z polecenia jest już wykorzystany z tej sieci. Doładuj portfel, żeby ripostować dalej.");
      store.updateUser(user.id, (u) => { u.referredBy = ownerId; u.freeLeft += cfg.referralBonus; });
      store.updateUser(ownerId, (u) => { u.freeLeft += cfg.referralBonus; });
      return send(res, 200, { me: publicUser(store.getUser(user.id)), bonus: cfg.referralBonus });
    }

    if (method === "POST" && pathname === "/api/topup") {
      const user = getOrCreateUser(req, res);
      const { packageId, email, acceptTerms, waiveWithdrawal } = await readJson(req);
      const pkg = cfg.packages.find((p) => p.id === packageId);
      if (!pkg) return fail(res, 400, "bad_package", "Wybierz pakiet.");
      if (!acceptTerms || !waiveWithdrawal) return fail(res, 400, "consents", "Zaznacz wymagane zgody.");
      if (payments.needsEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""))) return fail(res, 400, "email", "Podaj poprawny e-mail do potwierdzenia płatności.");
      const payment = store.createPayment({
        userId: user.id, packageId: pkg.id, amountGr: pkg.priceGr, creditGr: pkg.ripostes * cfg.priceGr,
        provider: payments.name, consents: { terms: true, waiveWithdrawal: true, at: new Date().toISOString() },
      });
      try {
        const { redirectUrl } = await payments.createCheckout({
          payment, pkg, email,
          returnUrl: `${cfg.publicUrl}/?platnosc=${payment.id}&status=ok`,
          notifyUrl: `${cfg.publicUrl}/api/payments/${payments.name}/webhook`,
        });
        return send(res, 200, { paymentId: payment.id, redirectUrl });
      } catch (err) {
        console.error(JSON.stringify({ ev: "checkout_error", msg: String(err?.message || err).slice(0, 300) }));
        return fail(res, 502, "checkout_failed", "Bramka płatności nie odpowiada. Spróbuj za chwilę.");
      }
    }

    let m;
    if (method === "GET" && (m = pathname.match(/^\/api\/payments\/(pay_[a-f0-9]+)$/))) {
      const user = getOrCreateUser(req, res);
      const p = store.getPayment(m[1]);
      if (!p || p.userId !== user.id) return fail(res, 404, "not_found", "Nie znaleziono płatności.");
      const pkg = cfg.packages.find((x) => x.id === p.packageId);
      return send(res, 200, { id: p.id, status: p.status, amountGr: p.amountGr, ripostes: pkg?.ripostes, me: publicUser(user) });
    }

    if (method === "POST" && (m = pathname.match(/^\/api\/payments\/([a-z0-9]+)\/webhook$/))) {
      if (m[1] !== payments.name) return fail(res, 404, "not_found", "Nieaktywna bramka.");
      const rawBody = await readBody(req);
      try {
        const result = await payments.handleWebhook({ rawBody, headers: req.headers, store });
        if (result) {
          const r = store.markPaid(result.paymentId, result.extra);
          if (!r.ok) throw new Error(r.reason);
          console.log(JSON.stringify({ ev: "payment_paid", id: result.paymentId, already: Boolean(r.already) }));
        }
        return send(res, 200, { received: true });
      } catch (err) {
        console.error(JSON.stringify({ ev: "webhook_rejected", provider: m[1], msg: String(err?.message || err).slice(0, 200) }));
        return fail(res, 400, "webhook_rejected", String(err?.message || "Odrzucono."));
      }
    }

    return fail(res, 404, "not_found", "Nie ma takiego adresu API.");
  }

  async function handler(req, res) {
    const url = new URL(req.url, "http://localhost");
    try {
      if (url.pathname === "/healthz") return send(res, 200, { ok: true });
      if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url);
      if (req.method !== "GET" && req.method !== "HEAD") return fail(res, 405, "method", "Niedozwolona metoda.");
      if (url.pathname === "/platnosc-mock.html" && payments.name !== "mock") return fail(res, 404, "not_found", "Nie ma takiej strony.");
      return serveStatic(req, res, url.pathname);
    } catch (err) {
      const status = err.status || 500;
      if (status === 500) console.error(err);
      const tooLargeMsg = IMAGE_ROUTES.has(url.pathname) ? "Za duży plik. Obsługujemy zdjęcia do 1,5 MB." : "Za dużo tekstu.";
      if (!res.headersSent && !res.destroyed) return fail(res, status, err.message || "error", status === 413 ? tooLargeMsg : "Błąd serwera.");
    }
  }
  handler.rateLimitKeys = () => hits.size; // do testów
  return handler;
}

// Start serwera, gdy plik uruchomiono bezpośrednio.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const store = createStore(config.dataFile);
  const ai = createAi(config.ai);
  const payments = createPayments(config.payments);
  http.createServer(createApp({ store, ai, payments })).listen(config.port, () => {
    console.log(`Riposta działa: ${config.publicUrl}  (AI: ${ai.mode}${ai.mode === "claude" ? ", " + config.ai.model : ""}, płatności: ${payments.name})`);
    if (ai.mode === "mock") console.log("Uwaga: AI w trybie testowym. Ustaw ANTHROPIC_API_KEY w .env, żeby generować prawdziwe riposty.");
    if (payments.name === "mock") console.log("Uwaga: płatności są symulowane (PAYMENT_PROVIDER=mock).");
  });
}
