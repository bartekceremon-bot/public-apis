/* Riposta: panel właściciela. Dane z GET /api/admin/stats (Bearer ADMIN_TOKEN).
 * Wykresy to SVG rysowane tutaj; kolory wyłącznie z tokenów CSS (--viz-*), więc działają w obu motywach.
 */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const NS = "http://www.w3.org/2000/svg";
  const KEY = "riposta.adminToken";
  const ss = {
    get() { try { return sessionStorage.getItem(KEY) || ""; } catch { return ""; } },
    set(v) { try { sessionStorage.setItem(KEY, v); } catch { /* prywatne okno */ } },
    del() { try { sessionStorage.removeItem(KEY); } catch { /* nic */ } },
  };
  const zl = (gr) => (gr / 100).toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " zł";
  const zlShort = (gr) => (gr / 100).toLocaleString("pl-PL", { maximumFractionDigits: 0 }) + " zł";
  const int = (n) => Number(n || 0).toLocaleString("pl-PL");
  const day = (iso, long) => {
    const d = new Date(iso + "T12:00:00");
    return isNaN(d) ? iso : d.toLocaleDateString("pl-PL", long ? { weekday: "short", day: "numeric", month: "long" } : { day: "numeric", month: "short" });
  };
  const SPICE = { 1: "😇 Anioł", 2: "🙂 Grzecznie", 3: "😏 Zadziornie", 4: "😈 Diabeł", 5: "🔥 Bez litości" };
  let data = null;

  // ---------------------------------------------------------------- logowanie
  function loginStatus(t, err) { $("loginStatus").textContent = t; $("loginStatus").className = "status" + (err ? " err" : ""); }
  async function load(token) {
    $("dash").setAttribute("aria-busy", "true");
    $("dash").classList.add("loading");
    let res;
    try {
      res = await fetch("/api/admin/stats", { headers: { Authorization: "Bearer " + token }, cache: "no-store" });
    } catch {
      return fail("Nie mogę połączyć się z serwerem. Sprawdź internet i odśwież.");
    } finally {
      $("dash").setAttribute("aria-busy", "false");
      $("dash").classList.remove("loading");
    }
    if (res.status === 401) { ss.del(); return fail("Zły token. Sprawdź wartość ADMIN_TOKEN na serwerze.", true); }
    if (res.status === 404) { ss.del(); return fail("Panel jest wyłączony: na serwerze nie ustawiono ADMIN_TOKEN (albo ta wersja serwera nie ma jeszcze panelu).", true); }
    if (res.status === 429) return fail("Za dużo prób. Odczekaj minutę.");
    if (!res.ok) return fail("Serwer odpowiedział błędem (" + res.status + "). Spróbuj za chwilę.");
    try { data = await res.json(); } catch { return fail("Serwer zwrócił dziwne dane. Spróbuj jeszcze raz."); }
    ss.set(token);
    $("login").hidden = true; $("dash").hidden = false; $("logout").hidden = false;
    $("updated").textContent = "Stan na " + new Date().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
    render();
  }
  function fail(msg, toLogin) {
    if (toLogin || $("dash").hidden) {
      $("dash").hidden = true; $("login").hidden = false; $("logout").hidden = true;
      loginStatus(msg, true); $("token").focus();
    } else $("updated").textContent = msg;
  }
  $("login").addEventListener("submit", async (e) => {
    e.preventDefault();
    const t = $("token").value.trim();
    if (!t) { loginStatus("Wpisz token.", true); return; }
    $("loginBtn").disabled = true; loginStatus("Sprawdzam…");
    await load(t);
    $("loginBtn").disabled = false;
    if (!$("dash").hidden) { $("token").value = ""; loginStatus(""); }
  });
  $("logout").onclick = () => {
    ss.del(); data = null;
    $("dash").hidden = true; $("login").hidden = false; $("logout").hidden = true;
    loginStatus("Wylogowano. Token usunięty z tej karty.");
  };
  $("refresh").onclick = () => { const t = ss.get(); if (t) load(t); else fail("Sesja wygasła. Zaloguj się ponownie.", true); };

  // ---------------------------------------------------------------- KPI
  function kpi(label, value, note, cls) {
    const d = document.createElement("div"); d.className = "kpi" + (cls ? " " + cls : "");
    const l = document.createElement("div"); l.className = "kpi-l"; l.textContent = label;
    const v = document.createElement("div"); v.className = "kpi-v"; v.textContent = value;
    d.append(l, v);
    if (note) { const n = document.createElement("div"); n.className = "kpi-n"; n.textContent = note; d.append(n); }
    return d;
  }
  function render() {
    const d = data, days = Array.isArray(d.days) ? d.days : [];
    const sum = (k) => days.reduce((a, x) => a + (Number(x[k]) || 0), 0);
    const errs = Number(d.aiErrors) || 0;
    $("kpis").replaceChildren(
      kpi("Użytkownicy", int(d.users), "+" + int(sum("newUsers")) + " w 30 dni"),
      kpi("Riposty", int(d.ripostes), int(d.freeUsed) + " darmowych"),
      kpi("Dekoder", int(d.dekoder), int(sum("dekoder")) + " w 30 dni"),
      kpi("Opłacone płatności", int(d.paymentsPaid), d.paymentsPaid ? "śr. " + zl(Math.round((d.revenueGr || 0) / d.paymentsPaid)) : "jeszcze żadnej"),
      kpi("Przychód", (d.revenueGr || 0) >= 100000 ? zlShort(d.revenueGr) : zl(d.revenueGr || 0), zl(sum("revenueGr")) + " w 30 dni", "money"),
      kpi("Błędy AI", (errs ? "⚠️ " : "✓ ") + int(errs), errs ? "opłaty zwrócone automatycznie" : "AI działa bez zarzutu", errs ? "warn" : "good"),
    );
    drawAll();
    $("tbody").replaceChildren(...days.slice().reverse().map((x) => {
      const tr = document.createElement("tr");
      [day(x.date, true), int(x.ripostes), int(x.dekoder), int(x.newUsers), zl(x.revenueGr || 0)].forEach((v, i) => {
        const td = document.createElement(i ? "td" : "th"); if (!i) td.scope = "row"; td.textContent = v; tr.append(td);
      });
      return tr;
    }));
  }
  function drawAll() {
    if (!data) return;
    const days = Array.isArray(data.days) ? data.days : [];
    const useSeries = [{ key: "ripostes", label: "Riposty", cls: "s1" }, { key: "dekoder", label: "Dekoder", cls: "s2" }];
    legend($("useLegend"), useSeries);
    columns($("cUse"), days, useSeries, int, "użyć");
    columns($("cRev"), days, [{ key: "revenueGr", label: "Przychód", cls: "s3" }], zl, null, zlShort);
    const spice = data.bySpice || {};
    hbars($("cSpice"), [1, 2, 3, 4, 5].map((k) => ({ label: SPICE[k], value: Number(spice[k]) || 0 })), false);
    const who = Object.entries(data.byWho || {}).map(([label, value]) => ({ label, value: Number(value) || 0 }));
    who.sort((a, b) => b.value - a.value);
    hbars($("cWho"), who, true);
  }

  // ---------------------------------------------------------------- narzędzia SVG
  const el = (n, attrs, parent) => {
    const e = document.createElementNS(NS, n);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.append(e);
    return e;
  };
  const txt = (parent, x, y, s, cls, anchor) => { const t = el("text", { x, y, class: cls || "ax", "text-anchor": anchor || "start" }, parent); t.textContent = s; return t; };
  // górna granica osi = 4 × „okrągły” krok, żeby podziałki były równe (0, 10, 20, 30, 40)
  function niceMax(v, unit) {
    unit = unit || 1;
    if (v <= 0) return 4 * unit;
    const raw = v / 4 / unit;
    const p = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / p;
    const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10; // bez 2,5: podziałki zawsze całkowite
    return Math.max(1, step * p) * 4 * unit;
  }
  // kolumna z zaokrąglonym (4px) końcem danych i prostą podstawą
  function colPath(x, y, w, h, r) {
    if (h <= 0) return "";
    r = Math.min(r, w / 2, h);
    return `M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h}Z`;
  }
  function barPath(x, y, w, h, r) {
    if (w <= 0) return "";
    r = Math.min(r, h / 2, w);
    return `M${x} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x}Z`;
  }
  function legend(box, series) {
    box.replaceChildren(...series.map((s) => {
      const i = document.createElement("span"); i.className = "lg";
      const sw = document.createElement("i"); sw.className = "sw " + s.cls;
      i.append(sw, document.createTextNode(s.label)); return i;
    }));
  }

  // ---------------------------------------------------------------- dymek
  const tip = $("tip");
  function showTip(rows, title, x, y) {
    const h = document.createElement("div"); h.className = "tt-h"; h.textContent = title;
    tip.replaceChildren(h, ...rows.map((r) => {
      const row = document.createElement("div"); row.className = "tt-r";
      if (r.cls) { const k = document.createElement("i"); k.className = "key " + r.cls; row.append(k); }
      const v = document.createElement("b"); v.textContent = r.value;
      const l = document.createElement("span"); l.textContent = r.label;
      row.append(v, l); return row;
    }));
    tip.hidden = false;
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let left = x + 14, top = y - th - 10;
    if (left + tw > innerWidth - 8) left = x - tw - 14;
    if (left < 8) left = 8;
    if (top < 8) top = y + 16;
    tip.style.left = left + "px"; tip.style.top = top + "px";
  }
  const hideTip = () => { tip.hidden = true; };

  // ---------------------------------------------------------------- kolumny (dni)
  function columns(box, days, series, fmtV, unit, fmtAxis) {
    const W = Math.max(280, box.clientWidth), H = W < 520 ? 190 : 230;
    const m = { l: fmtAxis ? 46 : 34, r: 8, t: 14, b: 26 };
    const pw = W - m.l - m.r, ph = H - m.t - m.b;
    const n = days.length || 1;
    const totals = days.map((d) => series.reduce((a, s) => a + (Number(d[s.key]) || 0), 0));
    const max = niceMax(Math.max(0, ...totals), fmtAxis ? 100 : 1); // przychód: okrągłe złotówki
    const sy = (v) => m.t + ph - (v / max) * ph;
    const band = pw / n, bw = Math.max(2, Math.min(24, band - 2));
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: "viz", tabindex: "0", role: "img",
      "aria-label": `${series.map((s) => s.label).join(" i ")}, ostatnie ${days.length} dni. Szczegóły w tabeli pod wykresami.` });
    const fa = fmtAxis || fmtV;
    for (let i = 0; i <= 4; i++) {
      const v = (max / 4) * i, y = Math.round(sy(v)) + 0.5;
      el("line", { x1: m.l, x2: W - m.r, y1: y, y2: y, class: i ? "grid" : "base" }, svg);
      txt(svg, m.l - 6, y + 4, fa(v), "ax", "end");
    }
    const hover = el("rect", { x: 0, y: m.t, width: band, height: ph, class: "hov", visibility: "hidden" }, svg);
    const step = Math.ceil(n / (W < 520 ? 4 : 7));
    days.forEach((d, i) => {
      const x = m.l + i * band + (band - bw) / 2;
      let acc = 0;
      const vals = series.map((s) => Number(d[s.key]) || 0);
      const topIdx = vals.reduce((t, v, k) => (v > 0 ? k : t), -1);
      vals.forEach((v, k) => {
        if (v <= 0) return;
        const y0 = sy(acc), y1 = sy(acc + v);
        const gap = acc > 0 ? 2 : 0; // 2px przerwy w kolorze tła między segmentami
        const h = Math.max(1, y0 - y1 - gap);
        el("path", { d: k === topIdx ? colPath(x, y1, bw, h, 4) : `M${x} ${y1}h${bw}v${h}h${-bw}Z`, class: "mk " + series[k].cls }, svg);
        acc += v;
      });
      if (i % step === 0 || i === n - 1) {
        if (i === n - 1 || n - 1 - i >= step * 0.6) txt(svg, m.l + i * band + band / 2, H - 8, day(d.date), "ax", "middle");
      }
    });
    // podpis tylko na ostatnim dniu (wartość na czubku)
    if (days.length) {
      const last = totals[totals.length - 1];
      if (last > 0) txt(svg, Math.min(W - m.r - 2, m.l + (n - 1) * band + band / 2), sy(last) - 6, fmtV(last), "lab", "end");
    }
    if (!totals.some((t) => t > 0)) txt(svg, m.l + pw / 2, m.t + ph / 2, "Jeszcze pusto. Czekamy na pierwsze riposty.", "empty", "middle");

    let active = -1;
    function focusIdx(i, cx, cy) {
      active = Math.max(0, Math.min(n - 1, i));
      const d = days[active]; if (!d) return;
      hover.setAttribute("x", m.l + active * band); hover.setAttribute("visibility", "visible");
      const rows = series.map((s) => ({ cls: s.cls, label: s.label, value: fmtV(Number(d[s.key]) || 0) }));
      if (series.length > 1) rows.push({ label: "razem" + (unit ? " " + unit : ""), value: fmtV(totals[active]) });
      if (cx === undefined) {
        const r = svg.getBoundingClientRect();
        cx = r.left + (m.l + active * band + band / 2) * (r.width / W); cy = r.top + sy(totals[active]) * (r.height / H);
      }
      showTip(rows, day(d.date, true), cx, cy);
    }
    svg.addEventListener("pointermove", (e) => {
      const r = svg.getBoundingClientRect();
      const x = (e.clientX - r.left) * (W / r.width);
      if (x < m.l || x > W - m.r) { hover.setAttribute("visibility", "hidden"); hideTip(); return; }
      focusIdx(Math.floor((x - m.l) / band), e.clientX, e.clientY);
    });
    svg.addEventListener("pointerleave", () => { hover.setAttribute("visibility", "hidden"); hideTip(); });
    svg.addEventListener("focus", () => focusIdx(active < 0 ? n - 1 : active));
    svg.addEventListener("blur", () => { hover.setAttribute("visibility", "hidden"); hideTip(); });
    svg.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); focusIdx(active - 1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); focusIdx(active + 1); }
      else if (e.key === "Escape") { hideTip(); }
    });
    box.replaceChildren(svg);
  }

  // ---------------------------------------------------------------- słupki poziome (pazur, nadawcy)
  function hbars(box, items, allowEmpty) {
    const W = Math.max(260, box.clientWidth);
    if (!items.length && allowEmpty) { const p = document.createElement("p"); p.className = "status"; p.textContent = "Jeszcze brak danych."; box.replaceChildren(p); return; }
    const row = 30, bh = 18, labW = Math.min(150, Math.round(W * 0.38)), valW = 52;
    const H = items.length * row + 6;
    const pw = W - labW - valW - 8;
    const max = Math.max(1, ...items.map((i) => i.value));
    const total = items.reduce((a, i) => a + i.value, 0) || 1;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: "viz", role: "img",
      "aria-label": items.map((i) => `${i.label}: ${i.value}`).join(", ") });
    el("line", { x1: labW + 0.5, x2: labW + 0.5, y1: 0, y2: H, class: "base" }, svg);
    items.forEach((it, i) => {
      const y = i * row + (row - bh) / 2 + 3;
      const g = el("g", { class: "hb", tabindex: "0" }, svg);
      el("rect", { x: 0, y: i * row + 3, width: W, height: row, class: "hit" }, g);
      txt(g, labW - 8, y + bh / 2 + 4, it.label, "ax cat", "end").dataset.full = it.label;
      const w = (it.value / max) * pw;
      if (w > 0) el("path", { d: barPath(labW + 1, y, w, bh, 4), class: "mk s1" }, g);
      txt(g, labW + 1 + w + 6, y + bh / 2 + 4, int(it.value), "lab", "start");
      const tipRows = [{ label: "", value: int(it.value) + " (" + Math.round((it.value / total) * 100) + "%)" }];
      g.addEventListener("pointermove", (e) => showTip(tipRows, it.label, e.clientX, e.clientY));
      g.addEventListener("pointerleave", hideTip);
      g.addEventListener("focus", () => { const r = g.getBoundingClientRect(); showTip(tipRows, it.label, r.left + labW, r.top); });
      g.addEventListener("blur", hideTip);
    });
    box.replaceChildren(svg);
    // za długie etykiety skracamy wielokropkiem (pełna nazwa jest w dymku i w aria-label)
    svg.querySelectorAll("text.cat").forEach((t) => {
      let s = t.dataset.full;
      while (s.length > 3 && t.getComputedTextLength() > labW - 12) { s = s.slice(0, -1); t.textContent = s.trimEnd() + "…"; }
    });
  }

  // przerysuj przy zmianie szerokości (telefon ↔ komputer, obrót ekranu)
  let lastW = 0, rt;
  addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => { if (innerWidth !== lastW) { lastW = innerWidth; hideTip(); drawAll(); } }, 150);
  });
  lastW = innerWidth;
  // zmiana motywu systemu: kolory idą z CSS, więc nic do przeliczenia

  const saved = ss.get();
  if (saved) load(saved); else $("token").focus();
})();
