import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { createApp } from "./app";

const stripWrappingQuotes = (value: string) => {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
};

const loadLocalDevVars = () => {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const devVarsPath = resolve(currentDir, "../.dev.vars");
  if (!existsSync(devVarsPath)) return;

  const lines = readFileSync(devVarsPath, "utf8").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = stripWrappingQuotes(line.slice(separatorIndex + 1).trim());
    if (!key || process.env[key] !== undefined) continue;
    process.env[key] = value;
  }
};

loadLocalDevVars();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const corsOrigin = process.env.CORS_ORIGIN || "*";
const resendApiKey = process.env.RESEND_API_KEY;
const contactToEmail = process.env.CONTACT_TO_EMAIL;
const contactFromEmail = process.env.CONTACT_FROM_EMAIL;
const wooConsumerKey = process.env.COINCART_KEY || process.env.WOO_CONSUMER_KEY;
const wooConsumerSecret = process.env.COINCART_SECRET || process.env.WOO_CONSUMER_SECRET;
const btcpayHost = process.env.BTCPAY_HOST;
const btcpayStoreId = process.env.BTCPAY_STORE_ID;
const btcpayApiKey = process.env.BTCPAY_API_KEY;
const btcpayWebhookSecret = process.env.BTCPAY_WEBHOOK_SECRET;
const orderRedirectBaseUrl = process.env.ORDER_REDIRECT_BASE_URL || "https://coincart.store/order";
const port = Number(process.env.PORT || 4000);
const app = createApp({
  databaseUrl,
  corsOrigin,
  resendApiKey,
  contactToEmail,
  contactFromEmail,
  wooConsumerKey,
  wooConsumerSecret,
  btcpayHost,
  btcpayStoreId,
  btcpayApiKey,
  btcpayWebhookSecret,
  orderRedirectBaseUrl,
});

serve({ fetch: app.fetch, port, hostname: "0.0.0.0" });

export default app;
