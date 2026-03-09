import { Hono } from "hono";
import { btcpayWebhookSchema } from "@coincart/types";
import { applyBtcPayWebhook } from "@coincart/core";
import type { AppContext } from "../types";

export const webhookRoutes = new Hono<AppContext>();

webhookRoutes.post("/btcpay", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = btcpayWebhookSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues }, 400);
    }

    const result = await applyBtcPayWebhook(c.var.db, {
      deliveryId: parsed.data.deliveryId,
      event: parsed.data.event,
      invoiceId: parsed.data.invoiceId,
      raw: parsed.data.raw,
    });

    return c.json(result);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});