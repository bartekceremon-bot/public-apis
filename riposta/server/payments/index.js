// Wspólny interfejs bramek płatniczych. Wybór przez PAYMENT_PROVIDER w .env.
//
// Każdy dostawca ma:
//   createCheckout({ payment, pkg, email, returnUrl, notifyUrl }) -> { redirectUrl }
//   handleWebhook({ rawBody, headers, store }) -> { paymentId, extra } | null (gdy zdarzenie nas nie dotyczy)
//     (rzuca błąd, gdy podpis jest nieprawidłowy)
//
// Zasada bezpieczeństwa: portfel doładowujemy WYŁĄCZNIE po zweryfikowanym powiadomieniu od bramki,
// nigdy na podstawie tego, że użytkownik wrócił na stronę "sukcesu".
import { mockProvider } from "./mock.js";
import { przelewy24Provider } from "./przelewy24.js";
import { stripeProvider } from "./stripe.js";

export function createPayments(paymentsConfig) {
  switch (paymentsConfig.provider) {
    case "mock":
      return mockProvider();
    case "przelewy24":
      return przelewy24Provider(paymentsConfig.p24);
    case "stripe":
      return stripeProvider(paymentsConfig.stripe);
    default:
      throw new Error(`Nieznany PAYMENT_PROVIDER: ${paymentsConfig.provider}`);
  }
}
