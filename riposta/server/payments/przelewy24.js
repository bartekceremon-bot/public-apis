// Przelewy24 (BLIK, szybkie przelewy, karty). REST API v1.
// Przed startem sprawdź zgodność z aktualną dokumentacją: https://developers.przelewy24.pl/
//
// Potrzebne zmienne: P24_MERCHANT_ID, P24_POS_ID, P24_API_KEY (klucz do raportów/REST), P24_CRC, P24_SANDBOX.
import crypto from "node:crypto";

const sha384 = (obj) => crypto.createHash("sha384").update(JSON.stringify(obj)).digest("hex");

export function przelewy24Provider(cfg) {
  if (!cfg.merchantId || !cfg.apiKey || !cfg.crc) {
    throw new Error("Przelewy24: ustaw P24_MERCHANT_ID, P24_API_KEY i P24_CRC w .env");
  }
  const base = cfg.sandbox ? "https://sandbox.przelewy24.pl" : "https://secure.przelewy24.pl";
  const auth = "Basic " + Buffer.from(`${cfg.posId}:${cfg.apiKey}`).toString("base64");

  async function call(method, pathname, body) {
    const res = await fetch(base + pathname, {
      method,
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Przelewy24 ${pathname}: HTTP ${res.status} ${JSON.stringify(json)}`);
    return json;
  }

  return {
    name: "przelewy24",
    needsEmail: true, // P24 wymaga adresu e-mail płacącego (wysyła potwierdzenie)
    async createCheckout({ payment, pkg, email, returnUrl, notifyUrl }) {
      const body = {
        merchantId: cfg.merchantId,
        posId: cfg.posId,
        sessionId: payment.id,
        amount: payment.amountGr,
        currency: "PLN",
        description: `Riposta: ${pkg.ripostes} ripost`,
        email,
        country: "PL",
        language: "pl",
        urlReturn: returnUrl,
        urlStatus: notifyUrl,
        sign: sha384({ sessionId: payment.id, merchantId: cfg.merchantId, amount: payment.amountGr, currency: "PLN", crc: cfg.crc }),
      };
      const { data } = await call("POST", "/api/v1/transaction/register", body);
      return { redirectUrl: `${base}/trnRequest/${data.token}` };
    },

    async handleWebhook({ rawBody, store }) {
      const n = JSON.parse(rawBody);
      const expected = sha384({
        merchantId: n.merchantId, posId: n.posId, sessionId: n.sessionId, amount: n.amount,
        originAmount: n.originAmount, currency: n.currency, orderId: n.orderId,
        methodId: n.methodId, statement: n.statement, crc: cfg.crc,
      });
      if (!safeEqual(expected, String(n.sign || ""))) throw new Error("Przelewy24: nieprawidłowy podpis powiadomienia");

      const payment = store.getPayment(n.sessionId);
      if (!payment) throw new Error("Przelewy24: nieznana płatność");
      if (Number(n.amount) !== payment.amountGr || n.currency !== "PLN") throw new Error("Przelewy24: kwota się nie zgadza");

      // Bez weryfikacji (PUT /transaction/verify) P24 nie przekaże nam pieniędzy.
      await call("PUT", "/api/v1/transaction/verify", {
        merchantId: cfg.merchantId, posId: cfg.posId, sessionId: n.sessionId,
        amount: n.amount, currency: "PLN", orderId: n.orderId,
        sign: sha384({ sessionId: n.sessionId, orderId: n.orderId, amount: n.amount, currency: "PLN", crc: cfg.crc }),
      });
      return { paymentId: payment.id, extra: { providerRef: String(n.orderId) } };
    },
  };
}

function safeEqual(a, b) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
