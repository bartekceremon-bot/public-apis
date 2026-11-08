// Cała konfiguracja w jednym miejscu. Wartości bierzemy ze zmiennych środowiskowych (.env).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, "..");

// Minimalny loader .env (bez zależności). Nie nadpisuje zmiennych już ustawionych.
function loadDotEnv() {
  const file = path.join(ROOT, ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith("#")) continue;
    const val = m[2].replace(/^["']|["']$/g, "");
    if (process.env[m[1]] === undefined) process.env[m[1]] = val;
  }
}
loadDotEnv();

const env = process.env;

export const config = {
  port: Number(env.PORT || 3000),
  publicUrl: (env.PUBLIC_URL || `http://localhost:${env.PORT || 3000}`).replace(/\/$/, ""),
  dataFile: env.DATA_FILE || path.join(ROOT, "data", "db.json"),

  // Cennik (w groszach). Jedna riposta = 50 gr.
  priceGr: 50,
  dekoderPriceGr: 50, // Dekoder ("Co on/ona miał(a) na myśli?")
  freeOnStart: 3,
  referralBonus: 5, // darmowe riposty dla obu stron
  packages: [
    { id: "maly", name: "Mały", ripostes: 10, priceGr: 500 },
    { id: "pakiet", name: "Pakiet", ripostes: 20, priceGr: 900, badge: "Najczęściej wybierany" },
    { id: "duzy", name: "Duży", ripostes: 50, priceGr: 2000, badge: "0,40 zł za sztukę" },
  ],

  // AI
  ai: {
    mode: env.RIPOSTA_AI || (env.ANTHROPIC_API_KEY ? "claude" : "mock"), // "claude" | "mock"
    model: env.RIPOSTA_MODEL || "claude-opus-5-5",
    effort: env.RIPOSTA_EFFORT || "low",
  },

  // Płatności: "mock" (symulacja) | "przelewy24" | "stripe"
  payments: {
    provider: env.PAYMENT_PROVIDER || "mock",
    p24: {
      merchantId: Number(env.P24_MERCHANT_ID || 0),
      posId: Number(env.P24_POS_ID || env.P24_MERCHANT_ID || 0),
      apiKey: env.P24_API_KEY || "",
      crc: env.P24_CRC || "",
      sandbox: env.P24_SANDBOX !== "false",
    },
    stripe: {
      secretKey: env.STRIPE_SECRET_KEY || "",
      webhookSecret: env.STRIPE_WEBHOOK_SECRET || "",
    },
  },

  // Zrzuty ekranu: max rozmiar po zdekodowaniu (1,5 MB).
  maxImageBytes: 1572864,

  rateLimitPerMinute: Number(env.RATE_LIMIT_PER_MINUTE || 20),
  walletRestorePerMinute: 5, // próby przywrócenia portfela kodem na IP na minutę
  // Za reverse proxy (Docker/nginx/Caddy): ustaw TRUST_PROXY=true, żeby IP brać z X-Forwarded-For.
  trustProxy: env.TRUST_PROXY === "true",

  // Panel właściciela: GET /api/admin/stats z nagłówkiem Authorization: Bearer <ADMIN_TOKEN>. Puste = panel wyłączony.
  adminToken: env.ADMIN_TOKEN || "",
  isProd: env.NODE_ENV === "production",
};
