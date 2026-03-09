import { createApp } from "./app";

type Env = {
  DATABASE_URL: string;
  CORS_ORIGIN?: string;
};

let cachedApp: ReturnType<typeof createApp> | null = null;
let cachedKey = "";

const getApp = (env: Env) => {
  const key = `${env.DATABASE_URL}|${env.CORS_ORIGIN || "*"}`;
  if (!cachedApp || cachedKey !== key) {
    cachedApp = createApp({
      databaseUrl: env.DATABASE_URL,
      corsOrigin: env.CORS_ORIGIN || "*",
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

