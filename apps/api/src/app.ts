import { Hono } from "hono";
import { cors } from "hono/cors";
import { createDb } from "@coincart/db";
import { FakeBtcPayClient } from "@coincart/payments";
import { checkoutRoutes } from "./routes/checkout";
import { catalogRoutes } from "./routes/catalog";
import { orderRoutes } from "./routes/orders";
import { syncRoutes } from "./routes/sync";
import { webhookRoutes } from "./routes/webhooks";
import type { AppContext } from "./types";

type CreateAppOptions = {
  databaseUrl: string;
  corsOrigin?: string;
};

export const createApp = ({ databaseUrl, corsOrigin = "*" }: CreateAppOptions) => {
  const db = createDb(databaseUrl);
  const btcpay = new FakeBtcPayClient();
  const corsOrigins = corsOrigin
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const app = new Hono<AppContext>();
  app.use(
    "*",
    cors({
      origin: corsOrigins.length > 1 ? corsOrigins : corsOrigins[0] || "*",
    }),
  );

  app.use("*", async (c, next) => {
    c.set("db", db);
    c.set("btcpay", btcpay);
    await next();
  });

  app.get("/health", (c) => c.json({ ok: true }));
  app.route("/v1/catalog", catalogRoutes);
  app.route("/v1/sync/catalog", syncRoutes);
  app.route("/v1/checkout", checkoutRoutes);
  app.route("/v1/orders", orderRoutes);
  app.route("/v1/webhooks", webhookRoutes);

  return app;
};

