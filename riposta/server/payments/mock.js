// Symulacja płatności do testów: udaje bramkę z ekranem BLIK. Nie pobiera pieniędzy.
// Automatycznie wyłączona, gdy PAYMENT_PROVIDER jest inny niż "mock".
export function mockProvider() {
  return {
    name: "mock",
    needsEmail: false,
    async createCheckout({ payment }) {
      return { redirectUrl: `/platnosc-mock.html?pid=${encodeURIComponent(payment.id)}` };
    },
    // "Powiadomienie" z udawanej bramki: wysyła je strona platnosc-mock.html.
    async handleWebhook({ rawBody }) {
      const { paymentId, blik } = JSON.parse(rawBody || "{}");
      if (!/^\d{6}$/.test(String(blik || ""))) throw new Error("Kod BLIK ma 6 cyfr.");
      if (String(blik) === "000000") throw new Error("Bank odrzucił płatność (testowy kod 000000).");
      return { paymentId, extra: { providerRef: "mock_" + Date.now() } };
    },
  };
}
