import { z } from "zod";
import { Hono } from "hono";
import {
  syncFinalizeRequestSchema,
  syncItemsRequestSchema,
  syncStartRequestSchema,
} from "@coincart/types";
import { applySyncItems, finalizeSyncJob, startSyncJob } from "@coincart/core";
import { requireSignedSyncAuth } from "../middleware/syncAuth";
import type { AppContext } from "../types";

const parseJson = async <T>(c: any, schema: z.ZodType<T>): Promise<T> => {
  const body = c.var.rawBody ?? (await c.req.text());
  const parsed = schema.safeParse(JSON.parse(body || "{}"));
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }
  return parsed.data;
};

export const syncRoutes = new Hono<AppContext>();

syncRoutes.use("*", requireSignedSyncAuth);

syncRoutes.post("/start", async (c) => {
  try {
    const input = await parseJson(c, syncStartRequestSchema);
    const job = await startSyncJob(c.var.db, input.source);
    return c.json({ syncJobId: job.id, startedAt: job.startedAt });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

syncRoutes.post("/items", async (c) => {
  try {
    const input = await parseJson(c, syncItemsRequestSchema);
    const result = await applySyncItems(c.var.db, input);
    return c.json({ syncJobId: input.syncJobId, processed: result.processed });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});

syncRoutes.post("/finalize", async (c) => {
  try {
    const input = await parseJson(c, syncFinalizeRequestSchema);
    const result = await finalizeSyncJob(c.var.db, input.syncJobId);
    return c.json({ syncJobId: input.syncJobId, outOfStockApplied: result.outOfStockApplied });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});