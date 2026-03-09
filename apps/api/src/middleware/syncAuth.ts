import crypto from "node:crypto";
import type { MiddlewareHandler } from "hono";
import { and, eq, sql } from "drizzle-orm";
import { apiKeys, requestNonces } from "@coincart/db";
import type { AppContext } from "../types";

const hashSha256 = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

const isTimestampFresh = (value: string) => {
  const tsMs = Number(value) * 1000;
  if (Number.isNaN(tsMs)) return false;
  const diff = Math.abs(Date.now() - tsMs);
  return diff <= 5 * 60 * 1000;
};

export const requireSignedSyncAuth: MiddlewareHandler<AppContext> = async (c, next) => {
  const auth = c.req.header("authorization") ?? "";
  const ts = c.req.header("x-timestamp") ?? "";
  const nonce = c.req.header("x-nonce") ?? "";
  const signature = c.req.header("x-signature") ?? "";

  if (!auth.startsWith("Bearer ") || !ts || !nonce || !signature) {
    return c.json({ error: "missing auth headers" }, 401);
  }

  if (!isTimestampFresh(ts)) {
    return c.json({ error: "stale timestamp" }, 401);
  }

  const keyId = auth.replace("Bearer ", "").trim();
  const [key] = await c.var.db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.keyId, keyId));

  if (!key || !key.active) {
    return c.json({ error: "invalid key" }, 401);
  }

  const already = await c.var.db
    .select({ id: requestNonces.id })
    .from(requestNonces)
    .where(and(eq(requestNonces.keyId, keyId), eq(requestNonces.nonce, nonce)));
  if (already.length > 0) {
    return c.json({ error: "replay detected" }, 401);
  }

  const rawBody = await c.req.text();
  const expected = crypto
    .createHmac("sha256", key.secret)
    .update(`${rawBody}.${ts}.${nonce}`)
    .digest("hex");

  const expectedDigest = hashSha256(expected);
  const providedDigest = hashSha256(signature);
  if (!crypto.timingSafeEqual(Buffer.from(expectedDigest), Buffer.from(providedDigest))) {
    return c.json({ error: "invalid signature" }, 401);
  }

  await c.var.db.insert(requestNonces).values({ keyId, nonce });
  await c.var.db
    .update(apiKeys)
    .set({ lastUsedAt: sql`now()` })
    .where(eq(apiKeys.keyId, keyId));
  c.set("rawBody", rawBody);

  await next();
};
