import { Hono } from "hono";
import { z } from "zod";
import { getProductBySlug, getProductsBySkus, listProducts } from "@coincart/core";
import type { AppContext } from "../types";

const currencySchema = z.enum(["USD", "EUR"]);

export const catalogRoutes = new Hono<AppContext>();

catalogRoutes.get("/products", async (c) => {
  const featured = c.req.query("featured") === "true";
  const currency = currencySchema.safeParse(c.req.query("currency") ?? "USD");
  if (!currency.success) {
    return c.json({ error: "invalid currency" }, 400);
  }

  const items = await listProducts(c.var.db, currency.data, featured);
  return c.json({ items });
});

catalogRoutes.get("/products/by-skus", async (c) => {
  const currency = currencySchema.safeParse(c.req.query("currency") ?? "USD");
  if (!currency.success) {
    return c.json({ error: "invalid currency" }, 400);
  }

  const skusRaw = c.req.query("skus") ?? "";
  const skus = skusRaw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 200);

  const items = await getProductsBySkus(c.var.db, skus, currency.data);
  return c.json({ items });
});

catalogRoutes.get("/products/:slug", async (c) => {
  const currency = currencySchema.safeParse(c.req.query("currency") ?? "USD");
  if (!currency.success) {
    return c.json({ error: "invalid currency" }, 400);
  }

  const product = await getProductBySlug(c.var.db, c.req.param("slug"), currency.data);
  if (!product) {
    return c.json({ error: "not found" }, 404);
  }

  return c.json(product);
});