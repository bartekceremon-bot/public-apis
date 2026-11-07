// Serwer Riposty: zero frameworków, sam Node. Uruchom: npm start
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config, ROOT } from "./config.js";
import { createStore } from "./store.js";
import { createAi, AiError, WHO } from "./ai.js";
import { createPayments } from "./payments/index.js";

const PUBLIC_DIR = path.join(ROOT, "public");
const MAX_BODY = 16 * 1024;
const MAX_MESSAGE = 1500;
const HTML_HEAD = '<!doctype html><html lang="pl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#2E46F0">\n';

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".json": "application/json", ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; form-action 'self' https://*.przelewy24.pl https://checkout.stripe.com",
};

export function createApp({ store, ai, payments, cfg = config }) {
  const hits = new Map(); // limit zapytań: klucz -> [znaczniki czasu]

  function rateLimited(key) {
    const now = Date.now();
    const arr = (hits.get(key) || []).filter((t) => now - t < 60_000);
    arr.push(now);
    hits.set(key, arr);
    return arr.length > cfg.rateLimitPerMinute;
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

  function readBody(req) {
    return new Promise((resolve, reject) => {
      let size = 0;
      const chunks = [];
      req.on("data", (c) => {
        size += c.length;
        if (size > MAX_BODY) { reject(Object.assign(new Error("too_large"), { status: 413 })); req.destroy(); return; }
        chunks.push(c);
      });
      req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      req.on("error", reject);
    });
  }
  async function readJson(req) {
    const raw = await readBody(req);
    try { return raw ? JSON.parse(raw) : {}; } catch { throw Object.assign(new Error("bad_json"), { status: 400 }); }
  }

  function cookies(req) {
    return Object.fromEntries(
      String(req.headers.cookie || "").split(";").map((c) => c.trim().split("=")).filter((p) => p[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join("="))]),
    );
  }

  // Anonimowy użytkownik rozpoznawany po ciasteczku (bez zakładania konta).
  function getOrCreateUser(req, res) {
    const rid = cookies(req).rid;
    let user = rid && store.getUser(rid);
    if (!user) {
      user = store.createUser(cfg.freeOnStart);
      const secure = cfg.publicUrl.startsWith("https://") ? "; Secure" : "";
      res.setHeader("Set-Cookie", `rid=${user.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=63072000${secure}`);
    }
    return user;
  }

  const publicUser = (u) => ({
    balanceGr: u.balanceGr,
    freeLeft: u.freeLeft,
    ripostesLeft: u.freeLeft + Math.floor(u.balanceGr / cfg.priceGr),
    referralCode: u.referralCode,
    referredBy: Boolean(u.referredBy),
    stats: u.stats,
  });

  function serveStatic(req, res, pathname) {
    let rel = decodeURIComponent(pathname);
    if (rel === "/") rel = "/index.html";
    const file = path.normalize(path.join(PUBLIC_DIR, rel));
    if (!file.startsWith(PUBLIC_DIR + path.sep)) return fail(res, 403, "forbidden", "Brak dostępu.");
    fs.readFile(file, (err, data) => {
      if (err) {
        return fs.readFile(path.join(PUBLIC_DIR, "404.html"), (e2, d2) =>
          send(res, 404, e2 ? "Nie ma takiej strony." : d2, { "Content-Type": TYPES[".html"] }));
      }
      const type = TYPES[path.extname(file)] || "application/octet-stream";
      // Strony w public/ są pisane bez szkieletu (żeby ten sam plik działał też jako artefakt na claude.ai).
      if (type.startsWith("text/html") && !/^\s*<!doctype/i.test(data.toString("utf8", 0, 32))) {
        data = Buffer.concat([Buffer.from(HTML_HEAD), data]);
      }
      send(res, 200, data, { "Content-Type": type, "Cache-Control": type.startsWith("text/html") ? "no-cache" : "public, max-age=3600" });
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
      });
    }

    if (method === "GET" && pathname === "/api/me") {
      return send(res, 200, publicUser(getOrCreateUser(req, res)));
    }

    if (method === "POST" && pathname === "/api/riposta") {
      const user = getOrCreateUser(req, res);
      const ip = req.socket.remoteAddress || "?";
      if (rateLimited("u:" + user.id) || rateLimited("ip:" + ip)) return fail(res, 429, "rate_limited", "Za szybko! Odczekaj minutę.");

      const body = await readJson(req);
      const message = String(body.message || "").trim();
      const who = WHO.includes(body.who) ? body.who : "Znajomy";
      const goal = String(body.goal || "").slice(0, 120);
      const spice = Math.min(5, Math.max(1, Number.parseInt(body.spice, 10) || 3));
      if (!message) return fail(res, 400, "empty", "Wklej wiadomość, na którą chcesz odpisać.");
      if (message.length > MAX_MESSAGE) return fail(res, 400, "too_long", `Maksymalnie ${MAX_MESSAGE} znaków.`);

      // 1) Rezerwujemy opłatę (najpierw darmowe, potem portfel).
      let paidWith;
      if (user.freeLeft > 0) paidWith = "free";
      else if (user.balanceGr >= cfg.priceGr) paidWith = "wallet";
      else return fail(res, 402, "no_funds", "Brakuje środków. Doładuj portfel.");
      store.updateUser(user.id, (u) => { if (paidWith === "free") u.freeLeft -= 1; else u.balanceGr -= cfg.priceGr; });

      // 2) Generujemy. 3) Przy błędzie zwracamy opłatę.
      try {
        const { replies, usage } = await ai.generate({ who, goal, message, spice });
        const updated = store.updateUser(user.id, (u) => {
          u.stats.ripostes += 1;
          if (paidWith === "wallet") u.stats.spentGr += cfg.priceGr;
          u.stats.maxSpice = Math.max(u.stats.maxSpice || 0, spice);
        });
        // Log bez treści wiadomości (prywatność).
        console.log(JSON.stringify({ ev: "riposta", paidWith, spice, who, model: usage.model, in: usage.input, out: usage.output }));
        return send(res, 200, { replies, paidWith, me: publicUser(updated) });
      } catch (err) {
        store.updateUser(user.id, (u) => { if (paidWith === "free") u.freeLeft += 1; else u.balanceGr += cfg.priceGr; });
        const code = err instanceof AiError ? err.code : "failed";
        console.error(JSON.stringify({ ev: "riposta_error", code, msg: String(err?.message || err).slice(0, 200) }));
        const msg = { refused: "Tej wiadomości Riposta nie obsłuży. Zmień treść.", busy: "AI ma chwilę zadyszki. Spróbuj za moment." }[code]
          || "Coś poszło nie tak. Nic nie pobraliśmy.";
        return fail(res, code === "refused" ? 422 : 503, code, msg + (code !== "failed" ? " Nic nie pobraliśmy." : ""));
      }
    }

    if (method === "POST" && pathname === "/api/referral") {
      const user = getOrCreateUser(req, res);
      const { code } = await readJson(req);
      const ownerId = store.userIdByReferral(code);
      if (!ownerId) return fail(res, 404, "bad_code", "Nie ma takiego kodu.");
      if (ownerId === user.id) return fail(res, 400, "own_code", "Sprytne, ale własnego kodu nie wpiszesz 😏");
      if (user.referredBy) return fail(res, 409, "already", "Kod polecający można użyć tylko raz.");
      if (user.stats.ripostes > 0 || user.balanceGr > 0) return fail(res, 409, "not_new", "Kod działa tylko dla nowych osób.");
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

  return async function handler(req, res) {
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
      return fail(res, status, err.message || "error", status === 413 ? "Za dużo tekstu." : "Błąd serwera.");
    }
  };
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
