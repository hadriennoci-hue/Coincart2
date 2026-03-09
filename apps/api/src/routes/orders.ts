import { Hono } from "hono";
import { getOrderById } from "@coincart/core";
import type { AppContext } from "../types";

export const orderRoutes = new Hono<AppContext>();

orderRoutes.get("/:orderId", async (c) => {
  const order = await getOrderById(c.var.db, c.req.param("orderId"));
  if (!order) {
    return c.json({ error: "not found" }, 404);
  }
  return c.json(order);
});