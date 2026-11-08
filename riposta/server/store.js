// Prosta baza w pliku JSON. Wystarczy na start (tysiące użytkowników).
// Przy większym ruchu podmień na Postgres: interfejs (getUser, updateUser, ...) zostaje ten sam.
//
// PRYWATNOŚĆ: nigdy nie zapisujemy treści wiadomości użytkowników, zrzutów ekranu ani wygenerowanych odpowiedzi.
// Statystyki (db.stats) są wyłącznie zagregowanymi licznikami.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// Alfabet kodów bez znaków mylących się na ekranie telefonu (0/O, 1/I). 32 znaki -> brak biasu przy b % 32.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const WALLET_CODE_LEN = 12;
const KEEP_DAYS = 400; // ile dni historii dziennych liczników trzymamy

// Data kalendarzowa w Polsce (YYYY-MM-DD), niezależnie od strefy serwera.
const dayFmt = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Warsaw", year: "numeric", month: "2-digit", day: "2-digit" });
export const today = (now = new Date()) => dayFmt.format(now);
function shiftDay(day, delta) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
}

function randomCode(len) {
  return Array.from(crypto.randomBytes(len), (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

// "rip-abcd efgh-jklm" -> "ABCDEFGHJKLM". Alfabet nie zawiera "I", więc prefiks "RIP" jest jednoznaczny.
export function normalizeWalletCode(code) {
  let s = String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (s.length === WALLET_CODE_LEN + 3 && s.startsWith("RIP")) s = s.slice(3);
  return s;
}
export function formatWalletCode(norm) {
  return `RIP-${norm.slice(0, 4)}-${norm.slice(4, 8)}-${norm.slice(8, 12)}`;
}

const emptyDay = () => ({ ripostes: 0, dekoder: 0, newUsers: 0, revenueGr: 0 });

export function createStore(file) {
  let db = { users: {}, payments: {}, referralCodes: {}, walletCodes: {}, stats: null };
  if (file && fs.existsSync(file)) {
    db = { ...db, ...JSON.parse(fs.readFileSync(file, "utf8")) };
  }
  migrate();

  // Starsze pliki db.json nie mają nowych pól: uzupełniamy wartości domyślne.
  function migrate() {
    db.users ||= {};
    db.payments ||= {};
    db.referralCodes ||= {};
    db.stats ||= {};
    db.stats.days ||= {};
    db.stats.totals ||= {};
    const t = db.stats.totals;
    t.bySpice ||= {};
    t.byWho ||= {};
    t.aiErrors ||= 0;
    t.freeUsed ||= 0;
    db.walletCodes = {}; // odbudowujemy z użytkowników (źródło prawdy: user.walletCode)
    for (const u of Object.values(db.users)) {
      u.stats = { ripostes: 0, dekoder: 0, spentGr: 0, maxSpice: 0, ...(u.stats || {}) };
      if (u.walletCode === undefined) u.walletCode = null;
      if (u.walletCode) db.walletCodes[u.walletCode] = u.id;
    }
  }

  let writing = Promise.resolve();
  function persist() {
    if (!file) return Promise.resolve();
    const snapshot = JSON.stringify(db);
    writing = writing.then(async () => {
      await fs.promises.mkdir(path.dirname(file), { recursive: true });
      const tmp = `${file}.${process.pid}.tmp`;
      await fs.promises.writeFile(tmp, snapshot);
      await fs.promises.rename(tmp, file); // zapis atomowy
    });
    return writing;
  }

  function newReferralCode() {
    let code;
    do code = randomCode(6);
    while (db.referralCodes[code]);
    return code;
  }

  function dayBucket(day = today()) {
    if (!db.stats.days[day]) {
      db.stats.days[day] = emptyDay();
      const cutoff = shiftDay(day, -KEEP_DAYS);
      for (const d of Object.keys(db.stats.days)) if (d < cutoff) delete db.stats.days[d];
    }
    return db.stats.days[day];
  }

  function setWalletCode(userId) {
    const u = db.users[userId];
    if (u.walletCode) delete db.walletCodes[u.walletCode];
    let code;
    do code = randomCode(WALLET_CODE_LEN);
    while (db.walletCodes[code]);
    u.walletCode = code;
    db.walletCodes[code] = userId;
    persist();
    return formatWalletCode(code);
  }

  return {
    getUser(id) {
      return (typeof id === "string" && Object.hasOwn(db.users, id) && db.users[id]) || null;
    },
    createUser(freeOnStart) {
      const id = crypto.randomUUID();
      const referralCode = newReferralCode();
      db.users[id] = {
        id,
        createdAt: new Date().toISOString(),
        balanceGr: 0,
        freeLeft: freeOnStart,
        referralCode,
        referredBy: null,
        walletCode: null,
        stats: { ripostes: 0, dekoder: 0, spentGr: 0, maxSpice: 0 },
      };
      db.referralCodes[referralCode] = id;
      dayBucket().newUsers += 1;
      persist();
      return db.users[id];
    },
    updateUser(id, fn) {
      const u = db.users[id];
      if (!u) throw new Error("user_not_found");
      fn(u);
      persist();
      return u;
    },
    // Przenosi całe płatne saldo (balanceGr, bez darmowych) z jednego portfela na drugi. Zwraca kwotę.
    moveBalance(fromId, toId) {
      const from = db.users[fromId], to = db.users[toId];
      if (!from || !to) throw new Error("user_not_found");
      if (fromId === toId) return 0;
      const gr = Math.max(0, from.balanceGr || 0);
      from.balanceGr -= gr;
      to.balanceGr += gr;
      persist();
      return gr;
    },
    // Czy użytkownik ma jakąkolwiek płatność (w dowolnym statusie).
    hasPayments(userId) {
      return Object.values(db.payments).some((p) => p.userId === userId);
    },
    userIdByReferral(code) {
      const c = String(code || "").toUpperCase();
      return (Object.hasOwn(db.referralCodes, c) && db.referralCodes[c]) || null;
    },

    // --- Kod portfela (przenoszenie na inny telefon) ---
    getWalletCode(userId) {
      const u = db.users[userId];
      if (!u) throw new Error("user_not_found");
      return u.walletCode ? formatWalletCode(u.walletCode) : setWalletCode(userId);
    },
    rotateWalletCode(userId) {
      if (!db.users[userId]) throw new Error("user_not_found");
      return setWalletCode(userId);
    },
    userIdByWalletCode(code) {
      const norm = normalizeWalletCode(code);
      if (norm.length !== WALLET_CODE_LEN) return null;
      // Wyszukanie w mapie po znormalizowanym kodzie: czas nie zależy od tego, ile znaków się zgadza.
      return (Object.hasOwn(db.walletCodes, norm) && db.walletCodes[norm]) || null;
    },

    // --- Zagregowane statystyki (bez treści) ---
    // kind: "riposta" | "dekoder"
    recordUsage({ kind, paidWith, spice, who }) {
      const t = db.stats.totals;
      const d = dayBucket();
      if (kind === "dekoder") d.dekoder += 1;
      else {
        d.ripostes += 1;
        if (spice) t.bySpice[spice] = (t.bySpice[spice] || 0) + 1;
      }
      if (who) t.byWho[who] = (t.byWho[who] || 0) + 1;
      if (paidWith === "free") t.freeUsed += 1;
      persist();
    },
    recordAiError() {
      db.stats.totals.aiErrors += 1;
      persist();
    },
    adminStats(numDays = 30) {
      const users = Object.values(db.users);
      const paid = Object.values(db.payments).filter((p) => p.status === "paid");
      const end = today();
      const days = [];
      for (let i = numDays - 1; i >= 0; i--) {
        const date = shiftDay(end, -i);
        days.push({ date, ...emptyDay(), ...(db.stats.days[date] || {}) });
      }
      const t = db.stats.totals;
      return {
        users: users.length,
        ripostes: users.reduce((s, u) => s + (u.stats.ripostes || 0), 0),
        dekoder: users.reduce((s, u) => s + (u.stats.dekoder || 0), 0),
        freeUsed: t.freeUsed,
        paymentsPaid: paid.length,
        revenueGr: paid.reduce((s, p) => s + (p.amountGr || 0), 0),
        days,
        bySpice: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, ...t.bySpice },
        byWho: { ...t.byWho },
        aiErrors: t.aiErrors,
      };
    },

    createPayment(p) {
      const id = "pay_" + crypto.randomBytes(9).toString("hex");
      db.payments[id] = { id, createdAt: new Date().toISOString(), status: "pending", ...p };
      persist();
      return db.payments[id];
    },
    getPayment(id) {
      return (Object.hasOwn(db.payments, id) && db.payments[id]) || null;
    },
    // Idempotentne zaksięgowanie płatności: drugie wywołanie nic nie zmienia.
    markPaid(paymentId, extra = {}) {
      const p = Object.hasOwn(db.payments, String(paymentId)) ? db.payments[paymentId] : null;
      if (!p) return { ok: false, reason: "payment_not_found" };
      if (p.status === "paid") return { ok: true, already: true, payment: p };
      p.status = "paid";
      p.paidAt = new Date().toISOString();
      Object.assign(p, extra);
      const u = db.users[p.userId];
      if (u) u.balanceGr += p.creditGr;
      dayBucket().revenueGr += p.amountGr || 0;
      persist();
      return { ok: true, payment: p };
    },
    flush: () => writing,
    _db: () => db,
  };
}
