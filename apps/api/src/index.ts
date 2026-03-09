import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { createDb } from "@coincart/db";
import { FakeBtcPayClient } from "@coincart/payments";
import { checkoutRoutes } from "./routes/checkout";
import { catalogRoutes } from "./routes/catalog";
import { orderRoutes } from "./routes/orders";
import { syncRoutes } from "./routes/sync";
import { webhookRoutes } from "./routes/webhooks";
import type { AppContext } from "./types";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const db = createDb(databaseUrl);
const btcpay = new FakeBtcPayClient();

const app = new Hono<AppContext>();

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

const port = Number(process.env.PORT || 4000);
serve({ fetch: app.fetch, port, hostname: "0.0.0.0" });

export default app;
