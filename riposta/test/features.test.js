// Testy funkcji z kontraktu v2: zrzuty ekranu, Dekoder, kod portfela, panel właściciela, limity body, PWA.
import { test, before, after, mock } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createApp } from "../server/server.js";
import { createStore } from "../server/store.js";
import { createAi, AiError } from "../server/ai.js";
import { mockProvider } from "../server/payments/mock.js";
import { config } from "../server/config.js";

const ADMIN = "sekret-admina";
const cfg = { ...config, publicUrl: "http://localhost", rateLimitPerMinute: 1000, trustProxy: true, adminToken: ADMIN };
let failNext = false;
let lastInput = null;
const servers = [];

async function start({ store = createStore(null), cfgOver = {}, publicDir } = {}) {
  const mock = createAi({ mode: "mock", mockDelayMs: 0 });
  const wrap = (fn) => async (i) => {
    lastInput = i;
    if (failNext) { failNext = false; throw new AiError("busy", "x"); }
    return fn(i);
  };
  const ai = { mode: "mock", generate: wrap(mock.generate), decode: wrap(mock.decode) };
  const server = http.createServer(createApp({ store, ai, payments: mockProvider(), cfg: { ...cfg, ...cfgOver }, ...(publicDir ? { publicDir } : {}) }));
  await new Promise((r) => server.listen(0, r));
  servers.push(server);
  return { base: `http://127.0.0.1:${server.address().port}`, store };
}

let app;
before(async () => { app = await start(); });
after(() => servers.forEach((s) => s.close()));

let ipSeq = 0;
function client(base = app.base, { ip = `10.0.0.${++ipSeq}`, headers = {} } = {}) {
  let cookie = "";
  const c = async (p, body, extra = {}) => {
    const raw = typeof body === "string";
    const res = await fetch(base + p, {
      method: body !== undefined ? "POST" : "GET",
      headers: { "X-Forwarded-For": ip, ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers, ...extra },
      body: body === undefined ? undefined : raw ? body : JSON.stringify(body),
    });
    const set = res.headers.get("set-cookie");
    if (set) cookie = set.split(";")[0];
    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { json = text; }
    return { status: res.status, json, headers: res.headers };
  };
  c.cookie = () => cookie;
  return c;
}

// Minimalne "obrazki": liczą się tylko magiczne bajty.
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32, 1)]);
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32, 2)]);
const WEBP = Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBP"), Buffer.alloc(32, 3)]);
const img = (buf, mediaType) => ({ mediaType, data: buf.toString("base64") });

test("config: nowe pola i funkcje", async () => {
  const c = client();
  const r = (await c("/api/config")).json;
  assert.deepEqual(r.features, { images: true, dekoder: true, walletCode: true });
  assert.equal(r.dekoderPriceGr, 50);
  assert.equal(r.maxImageBytes, 1572864);
  const me = (await c("/api/me")).json;
  assert.equal(me.stats.dekoder, 0);
});

test("zrzut ekranu: walidacja typu, rozmiaru i magicznych bajtów", async () => {
  const c = client();
  const bad = async (image) => {
    const r = await c("/api/riposta", { who: "Ex", message: "hej", image });
    assert.equal(r.status, 400, JSON.stringify(r.json));
    assert.equal(r.json.error, "bad_image");
    assert.equal(r.json.message, "Obsługujemy zdjęcia JPG, PNG i WebP do 1,5 MB.");
  };
  await bad(img(PNG, "image/gif"));
  await bad(img(PNG, "image/jpeg")); // typ nie zgadza się z zawartością
  await bad(img(JPEG, "image/png"));
  await bad(img(Buffer.from("to nie jest obrazek"), "image/webp"));
  await bad({ mediaType: "image/png", data: "%%%nie-base64%%%" });
  await bad({ mediaType: "image/png" });
  await bad("obrazek");
  const big = Buffer.concat([PNG, Buffer.alloc(1572864)]); // > 1,5 MB po zdekodowaniu, ale body < 2,5 MB
  await bad(img(big, "image/png"));
  // Nic nie pobrano.
  assert.equal((await c("/api/me")).json.freeLeft, 3);
});

test("zrzut ekranu: sam obraz wystarczy (JPG, PNG, WebP), obraz trafia do AI", async () => {
  const c = client();
  for (const [buf, type] of [[PNG, "image/png"], [JPEG, "image/jpeg"], [WEBP, "image/webp"]]) {
    const r = await c("/api/riposta", { who: "Ex", spice: 2, image: img(buf, type) });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(r.json.replies.length, 3);
    assert.equal(lastInput.message, "");
    assert.equal(lastInput.image.mediaType, type);
    assert.equal(lastInput.image.data, buf.toString("base64"));
  }
  // Prefiks data: jest tolerowany.
  const r = await client()("/api/riposta", { who: "Ex", image: { mediaType: "image/png", data: "data:image/png;base64," + PNG.toString("base64") } });
  assert.equal(r.status, 200);
  // Bez wiadomości i bez obrazu: błąd.
  assert.equal((await c("/api/riposta", { who: "Ex", message: "  " })).json.error, "empty");
});

test("limity body: 2,5 MB dla riposty i Dekodera, 16 KB gdzie indziej", async () => {
  const c = client();
  await c("/api/me");
  // ~2 MB body z obrazem 1,4 MB: przechodzi.
  const okImg = Buffer.concat([PNG, Buffer.alloc(1_400_000)]);
  const ok = await c("/api/dekoder", { who: "Ex", image: img(okImg, "image/png") });
  assert.equal(ok.status, 200, JSON.stringify(ok.json).slice(0, 200));
  // 3 MB: 413 na obu trasach z obrazkiem.
  const huge = JSON.stringify({ who: "Ex", message: "hej", pad: "x".repeat(3 * 1024 * 1024) });
  for (const p of ["/api/riposta", "/api/dekoder"]) {
    const r = await c(p, huge);
    assert.equal(r.status, 413, p);
    assert.equal(r.json.error, "too_large");
  }
  // 20 KB na innych trasach: 413.
  const mid = JSON.stringify({ code: "x".repeat(20 * 1024) });
  assert.equal((await c("/api/referral", mid)).status, 413);
  assert.equal((await c("/api/wallet/restore", mid)).status, 413);
  // ...ale 20 KB na riposcie jest OK (dalej walidacja treści).
  const r = await c("/api/riposta", JSON.stringify({ who: "Ex", message: "hej", pad: "x".repeat(20 * 1024) }));
  assert.equal(r.status, 200);
});

test("Dekoder: analiza zgodna z kontraktem, darmowe, potem portfel, zwrot przy błędzie AI", async () => {
  const c = client();
  for (let i = 0; i < 3; i++) {
    const r = await c("/api/dekoder", { who: "Randka", message: "ok." });
    assert.equal(r.status, 200);
    assert.equal(r.json.paidWith, "free");
    const a = r.json.analysis;
    assert.deepEqual(Object.keys(a).sort(), ["czerwoneFlagi", "nastroj", "poziomDramy", "rada", "werdykt", "znaczenie", "zieloneFlagi"].sort());
    assert.ok(Number.isInteger(a.poziomDramy) && a.poziomDramy >= 1 && a.poziomDramy <= 10);
    assert.ok(a.czerwoneFlagi.length <= 3 && a.zieloneFlagi.length <= 3);
    assert.equal(r.json.me.stats.dekoder, i + 1);
  }
  assert.equal((await c("/api/dekoder", { who: "Randka", message: "ok." })).json.error, "no_funds");

  // Doładowanie i płatność z portfela.
  const t = await c("/api/topup", { packageId: "maly", acceptTerms: true, waiveWithdrawal: true });
  await c("/api/payments/mock/webhook", { paymentId: t.json.paymentId, blik: "123456" });
  const paid = await c("/api/dekoder", { who: "Szef", message: "Musimy porozmawiać." });
  assert.equal(paid.json.paidWith, "wallet");
  assert.equal(paid.json.me.balanceGr, 450);
  assert.equal(paid.json.me.stats.spentGr, 50);

  // Błąd AI: pieniądze wracają.
  failNext = true;
  const err = await c("/api/dekoder", { who: "Szef", message: "?" });
  assert.equal(err.status, 503);
  assert.equal((await c("/api/me")).json.balanceGr, 450);

  // Walidacja jak w riposcie.
  assert.equal((await c("/api/dekoder", { who: "Ex", message: "" })).json.error, "empty");
  assert.equal((await c("/api/dekoder", { who: "Ex", image: img(PNG, "image/webp") })).json.error, "bad_image");
});

test("Dekoder: błąd AI przy darmowej próbie zwraca darmową", async () => {
  const c = client();
  failNext = true;
  assert.equal((await c("/api/dekoder", { who: "Ex", message: "hej" })).status, 503);
  const me = (await c("/api/me")).json;
  assert.equal(me.freeLeft, 3);
  assert.equal(me.stats.dekoder, 0);
});

test("kod portfela: format, stały, rotacja unieważnia stary, przywrócenie przełącza portfel", async () => {
  const a = client();
  await a("/api/me");
  const t = await a("/api/topup", { packageId: "maly", acceptTerms: true, waiveWithdrawal: true });
  await a("/api/payments/mock/webhook", { paymentId: t.json.paymentId, blik: "123456" });

  const code1 = (await a("/api/wallet/code")).json.code;
  assert.match(code1, /^RIP-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  assert.equal((await a("/api/wallet/code")).json.code, code1);

  // Nowy telefon: przywraca kod (małe litery, bez myślników).
  const b = client();
  await b("/api/me");
  const r = await b("/api/wallet/restore", { code: code1.toLowerCase().replace(/-/g, "") });
  assert.equal(r.status, 200);
  assert.equal(r.json.me.balanceGr, 500);
  assert.equal(r.json.mergedGr, 0);
  assert.match(r.json.newCode, /^RIP-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  assert.notEqual(r.json.newCode, code1);
  assert.equal((await a("/api/wallet/code")).json.code, r.json.newCode); // automatyczna rotacja po przywróceniu
  assert.equal((await b("/api/me")).json.balanceGr, 500); // ciasteczko wskazuje już ten portfel
  assert.equal((await b("/api/me")).json.referralCode, (await a("/api/me")).json.referralCode);

  // Rotacja: stary kod przestaje działać, nowy działa.
  const code2 = (await a("/api/wallet/code/rotate", {})).json.code;
  assert.notEqual(code2, code1);
  assert.equal((await a("/api/wallet/code")).json.code, code2);
  const c = client();
  const old = await c("/api/wallet/restore", { code: code1 });
  assert.equal(old.status, 404);
  assert.equal(old.json.error, "bad_code");
  assert.equal((await c("/api/wallet/restore", { code: " " + code2.replace(/-/g, " ") + " " })).status, 200);
  // Śmieci i obce klucze obiektu nie przechodzą.
  for (const code of ["", "__proto__", "RIP-0000-0000-0000", null, 123]) {
    assert.equal((await client()("/api/wallet/restore", { code })).status, 404);
  }
});

test("przywracanie portfela: limit 5 prób na minutę na IP", async () => {
  const c = client(app.base, { ip: "10.9.9.9" });
  for (let i = 0; i < 5; i++) assert.equal((await c("/api/wallet/restore", { code: "RIP-AAAA-BBBB-CCCC" })).status, 404);
  const r = await c("/api/wallet/restore", { code: "RIP-AAAA-BBBB-CCCC" });
  assert.equal(r.status, 429);
  assert.equal(r.json.error, "rate_limited");
  // Inne IP nie jest blokowane.
  assert.equal((await client(app.base, { ip: "10.9.9.10" })("/api/wallet/restore", { code: "RIP-AAAA-BBBB-CCCC" })).status, 404);
});

test("panel właściciela: 404 bez tokenu w env, 401 zły token, 200 ze statystykami", async () => {
  const off = await start({ cfgOver: { adminToken: "" } });
  assert.equal((await client(off.base)("/api/admin/stats", undefined, { Authorization: "Bearer cokolwiek" })).status, 404);

  const { base } = await start();
  assert.equal((await client(base)("/api/admin/stats")).status, 401);
  assert.equal((await client(base)("/api/admin/stats", undefined, { Authorization: "Bearer zly" })).status, 401);
  assert.equal((await client(base)("/api/admin/stats", undefined, { Authorization: ADMIN })).status, 401);

  const u = client(base);
  await u("/api/riposta", { who: "Ex", message: "hej", spice: 5 });
  await u("/api/riposta", { who: "Szef", message: "hej", spice: 2 });
  await u("/api/dekoder", { who: "Ex", message: "ok." });
  const t = await u("/api/topup", { packageId: "pakiet", acceptTerms: true, waiveWithdrawal: true });
  await u("/api/payments/mock/webhook", { paymentId: t.json.paymentId, blik: "123456" });
  failNext = true;
  await u("/api/riposta", { who: "Ex", message: "hej" });

  const r = await client(base)("/api/admin/stats", undefined, { Authorization: "Bearer " + ADMIN });
  assert.equal(r.status, 200);
  const s = r.json;
  assert.equal(s.users, 1);
  assert.equal(s.ripostes, 2);
  assert.equal(s.dekoder, 1);
  assert.equal(s.freeUsed, 3);
  assert.equal(s.paymentsPaid, 1);
  assert.equal(s.revenueGr, 900);
  assert.equal(s.aiErrors, 1);
  assert.equal(s.bySpice["5"], 1);
  assert.equal(s.bySpice["2"], 1);
  assert.deepEqual(s.byWho, { Ex: 2, Szef: 1 });
  assert.equal(s.days.length, 30);
  const dates = s.days.map((d) => d.date);
  assert.deepEqual([...dates].sort(), dates); // najstarszy pierwszy
  assert.equal(new Set(dates).size, 30);
  const last = s.days.at(-1);
  assert.deepEqual(last, { date: last.date, ripostes: 2, dekoder: 1, newUsers: 1, revenueGr: 900 });
  assert.deepEqual(s.days[0], { date: s.days[0].date, ripostes: 0, dekoder: 0, newUsers: 0, revenueGr: 0 });
  assert.equal(r.headers.get("cache-control"), "no-store");
  assert.ok(!JSON.stringify(s).includes("hej")); // żadnej treści
});

test("migracja: stare db.json bez nowych pól", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "riposta-"));
  const file = path.join(dir, "db.json");
  fs.writeFileSync(file, JSON.stringify({
    users: { u1: { id: "u1", createdAt: "2026-01-01T00:00:00Z", balanceGr: 100, freeLeft: 0, referralCode: "ABCDEF", referredBy: null, stats: { ripostes: 4, spentGr: 50, maxSpice: 3 } } },
    payments: {}, referralCodes: { ABCDEF: "u1" },
  }));
  const s = createStore(file);
  assert.equal(s.getUser("u1").stats.dekoder, 0);
  assert.equal(s.adminStats().ripostes, 4);
  const code = s.getWalletCode("u1");
  assert.equal(s.userIdByWalletCode(code), "u1");
  await s.flush();
  const s2 = createStore(file); // kod przetrwał restart
  assert.equal(s2.userIdByWalletCode(code), "u1");
  fs.rmSync(dir, { recursive: true, force: true });
});

test("PWA: sw.js z nagłówkami, typy plików, CSP", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "riposta-pub-"));
  fs.writeFileSync(path.join(dir, "sw.js"), "self.addEventListener('fetch', () => {});");
  fs.writeFileSync(path.join(dir, "manifest.webmanifest"), "{}");
  fs.writeFileSync(path.join(dir, "sitemap.xml"), "<urlset/>");
  fs.writeFileSync(path.join(dir, "robots.txt"), "User-agent: *");
  fs.writeFileSync(path.join(dir, "og.png"), PNG);
  fs.writeFileSync(path.join(dir, "a.webp"), WEBP);
  fs.writeFileSync(path.join(dir, "a.jpg"), JPEG);
  fs.writeFileSync(path.join(dir, "admin.html"), "<main>panel</main>");
  const { base } = await start({ publicDir: dir });

  const sw = await fetch(base + "/sw.js");
  assert.equal(sw.status, 200);
  assert.equal(sw.headers.get("service-worker-allowed"), "/");
  assert.equal(sw.headers.get("cache-control"), "no-cache");
  assert.match(sw.headers.get("content-type"), /javascript/);
  const csp = sw.headers.get("content-security-policy");
  assert.match(csp, /manifest-src 'self'/);
  assert.match(csp, /worker-src 'self'/);
  assert.doesNotMatch(csp, /unsafe-inline/);

  const types = {
    "/manifest.webmanifest": "application/manifest+json", "/sitemap.xml": "application/xml", "/robots.txt": "text/plain",
    "/og.png": "image/png", "/a.webp": "image/webp", "/a.jpg": "image/jpeg",
  };
  for (const [p, t] of Object.entries(types)) {
    const r = await fetch(base + p);
    assert.equal(r.status, 200, p);
    assert.ok(r.headers.get("content-type").startsWith(t), p);
  }
  const admin = await (await fetch(base + "/admin.html")).text();
  assert.match(admin, /^<!doctype html>/);
  fs.rmSync(dir, { recursive: true, force: true });
});

// ---------------------------------------------------------------- poprawki z przeglądu kodu

test("TRUST_PROXY: IP z ostatniego wpisu X-Forwarded-For (lewego nie da się podrobić)", async () => {
  const { base } = await start();
  const real = "10.77.0.1";
  // Klient podrabia lewy wpis przy każdej próbie; proxy dopisuje prawdziwy adres na końcu.
  for (let i = 0; i < 5; i++) {
    const r = await client(base, { ip: `6.6.6.${i}, ${real}` })("/api/wallet/restore", { code: "RIP-AAAA-BBBB-CCCC" });
    assert.equal(r.status, 404);
  }
  const blocked = await client(base, { ip: `6.6.6.99, ${real}` })("/api/wallet/restore", { code: "RIP-AAAA-BBBB-CCCC" });
  assert.equal(blocked.status, 429);
  // Ten sam podrobiony lewy wpis, ale inne prawdziwe IP: przechodzi.
  assert.equal((await client(base, { ip: `6.6.6.99, 10.77.0.2` })("/api/wallet/restore", { code: "RIP-AAAA-BBBB-CCCC" })).status, 404);
});

test("darmowe riposty: max N nowych portfeli z darmowymi na IP dziennie, kolejne z freeLeft = 0", async () => {
  const { base } = await start({ cfgOver: { freeWalletsPerIpPerDay: 5 } });
  const ip = "10.55.0.1";
  for (let i = 0; i < 5; i++) assert.equal((await client(base, { ip })("/api/me")).json.freeLeft, 3, `portfel ${i + 1}`);
  const capped = client(base, { ip });
  const me = (await capped("/api/me")).json;
  assert.equal(me.freeLeft, 0);
  assert.equal(me.ripostesLeft, 0);
  // Portfel ponad limit nie może "dofarmić" darmowych przez kod polecający.
  const ownerCode = (await client(base, { ip: "10.55.0.9" })("/api/me")).json.referralCode;
  const ref = await capped("/api/referral", { code: ownerCode });
  assert.equal(ref.status, 409);
  assert.equal(ref.json.error, "not_eligible");
  // Portfel działa z płatnym doładowaniem.
  assert.equal((await capped("/api/riposta", { who: "Ex", message: "hej" })).json.error, "no_funds");
  const t = await capped("/api/topup", { packageId: "maly", acceptTerms: true, waiveWithdrawal: true });
  await capped("/api/payments/mock/webhook", { paymentId: t.json.paymentId, blik: "123456" });
  const r = await capped("/api/riposta", { who: "Ex", message: "hej" });
  assert.equal(r.status, 200);
  assert.equal(r.json.paidWith, "wallet");
  // Ten sam portfel (ciasteczko) nie traci nic przy kolejnych wejściach; inne IP dalej dostaje darmowe.
  assert.equal((await client(base, { ip: "10.55.0.2" })("/api/me")).json.freeLeft, 3);
  // Konfigurowalne: 0 = brak darmowych w ogóle.
  const off = await start({ cfgOver: { freeWalletsPerIpPerDay: 0 } });
  assert.equal((await client(off.base)("/api/me")).json.freeLeft, 0);
});

test("kod polecający: Dekoder, saldo albo płatność = nie nowy użytkownik", async () => {
  const owner = client();
  const code = (await owner("/api/me")).json.referralCode;

  const dek = client();
  await dek("/api/dekoder", { who: "Ex", message: "ok." });
  const r1 = await dek("/api/referral", { code });
  assert.equal(r1.status, 409);
  assert.equal(r1.json.error, "not_new");

  // Rozpoczęta (nawet nieopłacona) płatność też wyklucza.
  const pay = client();
  await pay("/api/me");
  await pay("/api/topup", { packageId: "maly", acceptTerms: true, waiveWithdrawal: true });
  assert.equal((await pay("/api/referral", { code })).json.error, "not_new");

  // Riposta też (jak dotąd).
  const rip = client();
  await rip("/api/riposta", { who: "Ex", message: "hej" });
  assert.equal((await rip("/api/referral", { code })).json.error, "not_new");

  // Naprawdę nowy: działa.
  const fresh = client();
  await fresh("/api/me");
  assert.equal((await fresh("/api/referral", { code })).status, 200);
});

test("przywracanie portfela: płatne saldo z tego telefonu przechodzi, darmowe nie; kod się zmienia", async () => {
  const topup = async (c, pkg) => {
    const t = await c("/api/topup", { packageId: pkg, acceptTerms: true, waiveWithdrawal: true });
    await c("/api/payments/mock/webhook", { paymentId: t.json.paymentId, blik: "123456" });
  };
  const a = client();
  await a("/api/me");
  await topup(a, "maly"); // 500 gr
  const code = (await a("/api/wallet/code")).json.code;

  const b = client();
  await b("/api/me");
  await topup(b, "pakiet"); // 1000 gr na drugim telefonie (+3 darmowe, które nie przechodzą)
  const ridB = b.cookie().split("=")[1];
  const r = await b("/api/wallet/restore", { code });
  assert.equal(r.status, 200);
  assert.equal(r.json.mergedGr, 1000);
  assert.equal(r.json.me.balanceGr, 1500);
  assert.equal(r.json.me.freeLeft, 3); // darmowe portfela A, bez dodanych z B
  assert.notEqual(r.json.newCode, code);
  const oldB = app.store.getUser(ridB); // stary portfel B: płatne saldo wyzerowane, darmowe zostają
  assert.equal(oldB.balanceGr, 0);
  assert.equal(oldB.freeLeft, 3);
  assert.equal((await a("/api/me")).json.balanceGr, 1500); // A widzi scalone saldo

  // Użyty kod nie działa drugi raz, nowy działa.
  const c = client();
  assert.equal((await c("/api/wallet/restore", { code })).status, 404);
  const again = await c("/api/wallet/restore", { code: r.json.newCode });
  assert.equal(again.status, 200);
  assert.equal(again.json.mergedGr, 0);

  // Ten sam portfel: bez scalania, ale z rotacją.
  const self = await a("/api/wallet/restore", { code: again.json.newCode });
  assert.equal(self.status, 200);
  assert.equal(self.json.mergedGr, 0);
  assert.equal(self.json.me.balanceGr, 1500);
  assert.notEqual(self.json.newCode, again.json.newCode);
});

test("panel właściciela: 10 nieudanych prób na minutę na IP, potem 429", async () => {
  const { base } = await start();
  const ip = "10.66.0.1";
  for (let i = 0; i < 10; i++) {
    assert.equal((await client(base, { ip })("/api/admin/stats", undefined, { Authorization: "Bearer zly" + i })).status, 401);
  }
  const r = await client(base, { ip })("/api/admin/stats", undefined, { Authorization: "Bearer zly" });
  assert.equal(r.status, 429);
  assert.equal(r.json.error, "rate_limited");
  // Zablokowane IP nie może też zgadywać dalej poprawnym tokenem w tej minucie.
  assert.equal((await client(base, { ip })("/api/admin/stats", undefined, { Authorization: "Bearer " + ADMIN })).status, 429);
  // Inne IP z dobrym tokenem: OK. Udane logowania nie liczą się do limitu.
  const other = client(base, { ip: "10.66.0.2" });
  for (let i = 0; i < 12; i++) assert.equal((await other("/api/admin/stats", undefined, { Authorization: "Bearer " + ADMIN })).status, 200);
});

test("limit zapytań: okno 60 s, po minucie znowu można; stare klucze sprząta timer", async () => {
  mock.timers.enable({ apis: ["setInterval", "Date"], now: Date.now() });
  try {
    const handler = createApp({ store: createStore(null), ai: { mode: "mock", ...createAi({ mode: "mock", mockDelayMs: 0 }) }, payments: mockProvider(), cfg: { ...cfg, rateLimitPerMinute: 3 } });
    const server = http.createServer(handler);
    await new Promise((r) => server.listen(0, r));
    servers.push(server);
    const c = client(`http://127.0.0.1:${server.address().port}`);
    for (let i = 0; i < 3; i++) assert.equal((await c("/api/riposta", { who: "Ex", message: "hej" })).status, 200);
    const r = await c("/api/riposta", { who: "Ex", message: "hej" });
    assert.equal(r.status, 429);
    assert.equal(r.json.error, "rate_limited");
    assert.ok(handler.rateLimitKeys() >= 2); // u:<id> i ip:<ip>
    mock.timers.tick(60_000); // timer sprzątający: okna starsze niż minuta znikają
    assert.equal(handler.rateLimitKeys(), 0);
    assert.equal((await c("/api/riposta", { who: "Ex", message: "hej" })).status, 402); // limit minął (darmowe zużyte)
  } finally {
    mock.timers.reset();
  }
});
