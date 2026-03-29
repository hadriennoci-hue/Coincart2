import { Hono } from "hono";
import { z } from "zod";
import { getOrderById } from "@coincart/core";
import type { AppContext } from "../types";

export const orderRoutes = new Hono<AppContext>();
const orderIdSchema = z.string().uuid();

orderRoutes.get("/:orderId", async (c) => {
  const parsedOrderId = orderIdSchema.safeParse(c.req.param("orderId"));
  if (!parsedOrderId.success) {
    return c.json({ error: "not found" }, 404);
  }

  const order = await getOrderById(c.var.db, parsedOrderId.data);
  if (!order) {
    return c.json({ error: "not found" }, 404);
  }
  return c.json(order);
});
