import { Hono } from "hono";
import { cors } from "hono/cors";
import { createDb } from "@coincart/db";
import { FakeBtcPayClient, GreenfieldBtcPayClient } from "@coincart/payments";
import { checkoutRoutes } from "./routes/checkout";
import { catalogRoutes } from "./routes/catalog";
import { contactRoutes } from "./routes/contact";
import { connectorRoutes } from "./routes/connector";
import { orderRoutes } from "./routes/orders";
import { syncRoutes } from "./routes/sync";
import { webhookRoutes } from "./routes/webhooks";
import type { AppContext } from "./types";

type CreateAppOptions = {
  databaseUrl: string;
  corsOrigin?: string;
  resendApiKey?: string;
  contactToEmail?: string;
  contactFromEmail?: string;
  wooConsumerKey?: string;
  wooConsumerSecret?: string;
  btcpayHost?: string;
  btcpayStoreId?: string;
  btcpayApiKey?: string;
  btcpayWebhookSecret?: string;
  orderRedirectBaseUrl?: string;
};

export const createApp = ({
  databaseUrl,
  corsOrigin = "*",
  resendApiKey,
  contactToEmail = "coincartstore@proton.me",
  contactFromEmail = "Coincart Contact <onboarding@resend.dev>",
  wooConsumerKey,
  wooConsumerSecret,
  btcpayHost,
  btcpayStoreId,
  btcpayApiKey,
  btcpayWebhookSecret,
  orderRedirectBaseUrl = "https://coincart.store/order",
}: CreateAppOptions) => {
  const db = createDb(databaseUrl);
  const hasRealBtcPayConfig = Boolean(btcpayHost && btcpayStoreId && btcpayApiKey);
  const btcpay = hasRealBtcPayConfig
    ? new GreenfieldBtcPayClient({
        host: btcpayHost!,
        storeId: btcpayStoreId!,
        apiKey: btcpayApiKey!,
      })
    : new FakeBtcPayClient();
  const corsOrigins = corsOrigin
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const app = new Hono<AppContext>();
  app.onError(async (err, c) => {
    let rawBody: string | null = null;
    try {
      if (!c.req.raw.bodyUsed) {
        rawBody = await c.req.text();
      }
    } catch {
      rawBody = null;
    }

    console.error("Unhandled API error:", {
      method: c.req.method,
      url: c.req.url,
      rawBody,
      error: err,
    });
    return c.json({ error: "Internal Server Error" }, 500);
  });
  app.use(
    "*",
    cors({
      origin: corsOrigins.length > 1 ? corsOrigins : corsOrigins[0] || "*",
    }),
  );

  app.use("*", async (c, next) => {
    c.set("db", db);
    c.set("btcpay", btcpay);
    c.set("contact", {
      resendApiKey,
      contactToEmail,
      contactFromEmail,
    });
    c.set("connectorAuth", {
      consumerKey: wooConsumerKey,
      consumerSecret: wooConsumerSecret,
    });
    c.set("orderRedirectBaseUrl", orderRedirectBaseUrl);
    c.set("btcpayWebhookSecret", btcpayWebhookSecret);
    await next();
  });

  app.get("/health", (c) => c.json({ ok: true }));
  app.route("/v1/catalog", catalogRoutes);
  app.route("/v1/sync/catalog", syncRoutes);
  app.route("/v1/checkout", checkoutRoutes);
  app.route("/v1/contact", contactRoutes);
  app.route("/v1/connector", connectorRoutes);
  app.route("/wp-json/wc/v3", connectorRoutes);
  app.route("/v1/orders", orderRoutes);
  app.route("/v1/webhooks", webhookRoutes);

  return app;
};
