// Stripe Checkout (BLIK, Przelewy24, karty, Apple/Google Pay). Bez SDK: czyste wywołania REST.
// Przed startem sprawdź: https://docs.stripe.com/payments/checkout i włącz BLIK/P24 w panelu Stripe.
//
// Potrzebne zmienne: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET.
// Webhook w panelu Stripe: <PUBLIC_URL>/api/payments/stripe/webhook, zdarzenie checkout.session.completed.
import crypto from "node:crypto";

export function stripeProvider(cfg) {
  if (!cfg.secretKey || !cfg.webhookSecret) {
    throw new Error("Stripe: ustaw STRIPE_SECRET_KEY i STRIPE_WEBHOOK_SECRET w .env");
  }

  return {
    name: "stripe",
    needsEmail: false, // Stripe sam pyta o e-mail na stronie płatności
    async createCheckout({ payment, pkg, returnUrl }) {
      const form = new URLSearchParams({
        mode: "payment",
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": "pln",
        "line_items[0][price_data][unit_amount]": String(payment.amountGr),
        "line_items[0][price_data][product_data][name]": `Riposta: ${pkg.ripostes} ripost`,
        client_reference_id: payment.id,
        "metadata[payment_id]": payment.id,
        success_url: returnUrl,
        cancel_url: returnUrl.replace("status=ok", "status=anulowano"),
        locale: "pl",
      });
      const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: { Authorization: `Bearer ${cfg.secretKey}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(`Stripe: HTTP ${res.status} ${json?.error?.message || ""}`);
      return { redirectUrl: json.url };
    },

    async handleWebhook({ rawBody, headers, store }) {
      verifySignature(rawBody, headers["stripe-signature"], cfg.webhookSecret);
      const event = JSON.parse(rawBody);
      if (event.type !== "checkout.session.completed") return null;
      const session = event.data.object;
      if (session.payment_status !== "paid") return null;
      const payment = store.getPayment(session.metadata?.payment_id);
      if (!payment) throw new Error("Stripe: nieznana płatność");
      if (session.amount_total !== payment.amountGr) throw new Error("Stripe: kwota się nie zgadza");
      return { paymentId: payment.id, extra: { providerRef: session.id } };
    },
  };
}

function verifySignature(rawBody, header, secret, toleranceSec = 300) {
  const parts = Object.fromEntries(String(header || "").split(",").map((p) => p.split("=")));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > toleranceSec) throw new Error("Stripe: przeterminowany podpis");
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  const sigs = String(header).split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  const ok = sigs.some((s) => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
  if (!ok) throw new Error("Stripe: nieprawidłowy podpis");
}
