import { createApp } from "./app";

type Env = {
  DATABASE_URL: string;
  CORS_ORIGIN?: string;
  RESEND_API_KEY?: string;
  CONTACT_TO_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
  COINCART_KEY?: string;
  COINCART_SECRET?: string;
  WOO_CONSUMER_KEY?: string;
  WOO_CONSUMER_SECRET?: string;
};

let cachedApp: ReturnType<typeof createApp> | null = null;
let cachedKey = "";

const getApp = (env: Env) => {
  const resolvedKey = env.COINCART_KEY || env.WOO_CONSUMER_KEY;
  const resolvedSecret = env.COINCART_SECRET || env.WOO_CONSUMER_SECRET;
  const key = `${env.DATABASE_URL}|${env.CORS_ORIGIN || "*"}|${env.CONTACT_TO_EMAIL || ""}|${env.CONTACT_FROM_EMAIL || ""}|${env.RESEND_API_KEY ? "1" : "0"}|${resolvedKey ? "1" : "0"}|${resolvedSecret ? "1" : "0"}`;
  if (!cachedApp || cachedKey !== key) {
    cachedApp = createApp({
      databaseUrl: env.DATABASE_URL,
      corsOrigin: env.CORS_ORIGIN || "*",
      resendApiKey: env.RESEND_API_KEY,
      contactToEmail: env.CONTACT_TO_EMAIL,
      contactFromEmail: env.CONTACT_FROM_EMAIL,
      wooConsumerKey: resolvedKey,
      wooConsumerSecret: resolvedSecret,
    });
    cachedKey = key;
  }
  return cachedApp;
};

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return getApp(env).fetch(request, env, ctx);
  },
};
