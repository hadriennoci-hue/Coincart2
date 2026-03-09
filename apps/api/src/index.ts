import { serve } from "@hono/node-server";
import { createApp } from "./app";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const corsOrigin = process.env.CORS_ORIGIN || "*";
const port = Number(process.env.PORT || 4000);
const app = createApp({ databaseUrl, corsOrigin });

serve({ fetch: app.fetch, port, hostname: "0.0.0.0" });

export default app;

