// Testowa bramka płatności (działa tylko przy PAYMENT_PROVIDER=mock).
(function () {
  const $ = (id) => document.getElementById(id);
  const pid = new URLSearchParams(location.search).get("pid") || "";
  const fmt = (gr) => (gr / 100).toFixed(2).replace(".", ",") + " zł";
  const LINES = ["Potwierdź płatność w aplikacji banku…", "Bank sprawdza, czy to na pewno Ty…", "Bank pyta kota o zgodę…", "Prawie gotowe…"];
  $("cancel").href = "./?platnosc=" + encodeURIComponent(pid) + "&status=anulowano";

  fetch("/api/payments/" + encodeURIComponent(pid), { credentials: "same-origin" })
    .then((r) => r.json())
    .then((p) => {
      if (p.error) throw new Error(p.message);
      $("amount").textContent = fmt(p.amountGr);
      $("what").textContent = "Riposta: " + p.ripostes + " ripost do portfela";
      if (p.status === "paid") { $("msg").textContent = "Ta płatność jest już opłacona."; $("pay").disabled = true; }
    })
    .catch((e) => { $("what").textContent = e.message || "Nie znaleziono płatności."; $("pay").disabled = true; });

  $("blik").addEventListener("input", (e) => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6); });

  $("bank").addEventListener("submit", async (e) => {
    e.preventDefault();
    const blik = $("blik").value;
    if (!/^\d{6}$/.test(blik)) { $("msg").textContent = "Kod BLIK ma 6 cyfr."; return; }
    $("pay").disabled = true; $("wait").hidden = false; $("msg").textContent = "";
    for (const line of LINES) { $("waitText").textContent = line; await new Promise((r) => setTimeout(r, 650)); }
    const res = await fetch("/api/payments/mock/webhook", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentId: pid, blik }),
    });
    const json = await res.json().catch(() => ({}));
    $("wait").hidden = true;
    if (!res.ok) { $("msg").textContent = json.message || "Płatność odrzucona."; $("pay").disabled = false; return; }
    $("msg").textContent = "Zapłacono! Wracam do Riposty…";
    setTimeout(() => (location.href = "./?platnosc=" + encodeURIComponent(pid) + "&status=ok"), 700);
  });
})();
