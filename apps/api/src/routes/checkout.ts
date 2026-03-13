import { Hono } from "hono";
import { checkoutSessionCreateSchema } from "@coincart/types";
import { createCheckoutSession } from "@coincart/core";
import type { AppContext } from "../types";

export const checkoutRoutes = new Hono<AppContext>();

checkoutRoutes.post("/session", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = checkoutSessionCreateSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues }, 400);
    }

    const result = await createCheckoutSession(c.var.db, c.var.btcpay, parsed.data, {
      orderRedirectBaseUrl: c.var.orderRedirectBaseUrl,
    });
    return c.json(result);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});
