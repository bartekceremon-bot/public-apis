import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import crypto from "node:crypto";
import { createApp } from "../server/server.js";
import { createStore } from "../server/store.js";
import { createAi, AiError } from "../server/ai.js";
import { mockProvider } from "../server/payments/mock.js";
import { stripeProvider } from "../server/payments/stripe.js";
import { config } from "../server/config.js";

let server, base, store, failNext = false;
const cfg = { ...config, publicUrl: "http://localhost", rateLimitPerMinute: 1000 };

before(async () => {
  store = createStore(null);
  const mock = createAi({ mode: "mock", mockDelayMs: 0 });
  const ai = { mode: "mock", generate: async (i) => { if (failNext) { failNext = false; throw new AiError("busy", "x"); } return mock.generate(i); } };
  server = http.createServer(createApp({ store, ai, payments: mockProvider(), cfg }));
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

function client() {
  let cookie = "";
  return async (path, body) => {
    const res = await fetch(base + path, {
      method: body ? "POST" : "GET",
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.get("set-cookie");
    if (set) cookie = set.split(";")[0];
    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { json = text; }
    return { status: res.status, json, headers: res.headers };
  };
}
const ask = { who: "Ex", message: "hej", spice: 3 };

test("nowy użytkownik ma 3 darmowe riposty, potem płaci z portfela", async () => {
  const c = client();
  const me = (await c("/api/me")).json;
  assert.equal(me.freeLeft, 3);
  assert.equal(me.balanceGr, 0);
  for (let i = 0; i < 3; i++) {
    const r = await c("/api/riposta", ask);
    assert.equal(r.status, 200);
    assert.equal(r.json.replies.length, 3);
    assert.equal(r.json.paidWith, "free");
  }
  const broke = await c("/api/riposta", ask);
  assert.equal(broke.status, 402);
  assert.equal(broke.json.error, "no_funds");
});

test("doładowanie przez webhook, idempotencja i pobranie 50 gr", async () => {
  const c = client();
  await c("/api/me");
  const noConsent = await c("/api/topup", { packageId: "pakiet" });
  assert.equal(noConsent.status, 400);
  const t = await c("/api/topup", { packageId: "pakiet", acceptTerms: true, waiveWithdrawal: true });
  assert.equal(t.status, 200);
  assert.match(t.json.redirectUrl, /platnosc-mock\.html\?pid=pay_/);
  const pid = t.json.paymentId;

  const bad = await c("/api/payments/mock/webhook", { paymentId: pid, blik: "000000" });
  assert.equal(bad.status, 400);
  assert.equal((await c("/api/payments/" + pid)).json.status, "pending");

  const ok = await c("/api/payments/mock/webhook", { paymentId: pid, blik: "123456" });
  assert.equal(ok.status, 200);
  await c("/api/payments/mock/webhook", { paymentId: pid, blik: "123456" }); // drugi raz nic nie dodaje
  const p = (await c("/api/payments/" + pid)).json;
  assert.equal(p.status, "paid");
  assert.equal(p.me.balanceGr, 1000); // 20 ripost * 50 gr

  for (let i = 0; i < 3; i++) await c("/api/riposta", ask); // zużyj darmowe
  const r = await c("/api/riposta", ask);
  assert.equal(r.json.paidWith, "wallet");
  assert.equal(r.json.me.balanceGr, 950);
});

test("błąd AI zwraca opłatę", async () => {
  const c = client();
  await c("/api/me");
  failNext = true;
  const r = await c("/api/riposta", ask);
  assert.equal(r.status, 503);
  assert.equal((await c("/api/me")).json.freeLeft, 3);
});

test("cudza płatność jest niewidoczna", async () => {
  const a = client(), b = client();
  await a("/api/me"); await b("/api/me");
  const t = await a("/api/topup", { packageId: "maly", acceptTerms: true, waiveWithdrawal: true });
  assert.equal((await b("/api/payments/" + t.json.paymentId)).status, 404);
});

test("kod polecający: obie strony +5, jednorazowo, nie własny", async () => {
  const a = client(), b = client();
  const codeA = (await a("/api/me")).json.referralCode;
  const own = await a("/api/referral", { code: codeA });
  assert.equal(own.json.error, "own_code");
  await b("/api/me");
  const r = await b("/api/referral", { code: codeA.toLowerCase() });
  assert.equal(r.status, 200);
  assert.equal(r.json.me.freeLeft, 8);
  assert.equal((await a("/api/me")).json.freeLeft, 8);
  assert.equal((await b("/api/referral", { code: codeA })).json.error, "already");
});

test("walidacja wejścia i nieaktywne bramki", async () => {
  const c = client();
  assert.equal((await c("/api/riposta", { who: "Ex", message: "   " })).status, 400);
  assert.equal((await c("/api/riposta", { who: "Ex", message: "x".repeat(1501) })).status, 400);
  assert.equal((await c("/api/payments/stripe/webhook", {})).status, 404);
});

test("pliki statyczne: szkielet HTML, brak wyjścia poza public/", async () => {
  const c = client();
  const home = await c("/");
  assert.equal(home.status, 200);
  assert.match(home.json, /^<!doctype html>/);
  assert.match(home.headers.get("content-security-policy"), /default-src 'self'/);
  const trav = await fetch(base + "/..%2fpackage.json");
  assert.notEqual(trav.status, 200);
});

test("stripe: weryfikacja podpisu webhooka", async () => {
  const p = stripeProvider({ secretKey: "sk_test", webhookSecret: "whsec_test" });
  const s = createStore(null);
  const u = s.createUser(3);
  const pay = s.createPayment({ userId: u.id, amountGr: 900, creditGr: 1000 });
  const body = JSON.stringify({ type: "checkout.session.completed", data: { object: { id: "cs_1", payment_status: "paid", amount_total: 900, metadata: { payment_id: pay.id } } } });
  const t = Math.floor(Date.now() / 1000);
  const sig = crypto.createHmac("sha256", "whsec_test").update(`${t}.${body}`).digest("hex");
  const r = await p.handleWebhook({ rawBody: body, headers: { "stripe-signature": `t=${t},v1=${sig}` }, store: s });
  assert.equal(r.paymentId, pay.id);
  await assert.rejects(p.handleWebhook({ rawBody: body, headers: { "stripe-signature": `t=${t},v1=${"0".repeat(64)}` }, store: s }));
});
