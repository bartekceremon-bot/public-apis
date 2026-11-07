// Prosta baza w pliku JSON. Wystarczy na start (tysiące użytkowników).
// Przy większym ruchu podmień na Postgres: interfejs (getUser, updateUser, ...) zostaje ten sam.
//
// PRYWATNOŚĆ: nigdy nie zapisujemy treści wiadomości użytkowników ani wygenerowanych odpowiedzi.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export function createStore(file) {
  let db = { users: {}, payments: {}, referralCodes: {} };
  if (file && fs.existsSync(file)) {
    db = { ...db, ...JSON.parse(fs.readFileSync(file, "utf8")) };
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
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code;
    do {
      code = Array.from(crypto.randomBytes(6), (b) => alphabet[b % alphabet.length]).join("");
    } while (db.referralCodes[code]);
    return code;
  }

  return {
    getUser(id) {
      return db.users[id] || null;
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
        stats: { ripostes: 0, spentGr: 0, maxSpice: 0 },
      };
      db.referralCodes[referralCode] = id;
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
    userIdByReferral(code) {
      return db.referralCodes[String(code || "").toUpperCase()] || null;
    },
    createPayment(p) {
      const id = "pay_" + crypto.randomBytes(9).toString("hex");
      db.payments[id] = { id, createdAt: new Date().toISOString(), status: "pending", ...p };
      persist();
      return db.payments[id];
    },
    getPayment(id) {
      return db.payments[id] || null;
    },
    // Idempotentne zaksięgowanie płatności: drugie wywołanie nic nie zmienia.
    markPaid(paymentId, extra = {}) {
      const p = db.payments[paymentId];
      if (!p) return { ok: false, reason: "payment_not_found" };
      if (p.status === "paid") return { ok: true, already: true, payment: p };
      p.status = "paid";
      p.paidAt = new Date().toISOString();
      Object.assign(p, extra);
      const u = db.users[p.userId];
      if (u) u.balanceGr += p.creditGr;
      persist();
      return { ok: true, payment: p };
    },
    flush: () => writing,
    _db: () => db,
  };
}
