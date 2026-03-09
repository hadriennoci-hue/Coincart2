import { serve } from "@hono/node-server";
import { createApp } from "./app";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const corsOrigin = process.env.CORS_ORIGIN || "*";
const resendApiKey = process.env.RESEND_API_KEY;
const contactToEmail = process.env.CONTACT_TO_EMAIL;
const contactFromEmail = process.env.CONTACT_FROM_EMAIL;
const wooConsumerKey = process.env.WOO_CONSUMER_KEY;
const wooConsumerSecret = process.env.WOO_CONSUMER_SECRET;
const port = Number(process.env.PORT || 4000);
const app = createApp({
  databaseUrl,
  corsOrigin,
  resendApiKey,
  contactToEmail,
  contactFromEmail,
  wooConsumerKey,
  wooConsumerSecret,
});

serve({ fetch: app.fetch, port, hostname: "0.0.0.0" });

export default app;
