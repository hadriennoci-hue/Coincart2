import { Hono } from "hono";
import { z } from "zod";
import { getProductBySlug, getProductsBySkus, listProductsWithFilters } from "@coincart/core";
import type { AppContext } from "../types";

const currencySchema = z.enum(["USD", "EUR"]);
const intFromQuery = (value?: string) => {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export const catalogRoutes = new Hono<AppContext>();

catalogRoutes.get("/products", async (c) => {
  const featured = c.req.query("featured") === "true";
  const sort = c.req.query("sort");
  const currency = currencySchema.safeParse(c.req.query("currency") ?? "EUR");
  if (!currency.success) {
    return c.json({ error: "invalid currency" }, 400);
  }

  const items = await listProductsWithFilters(c.var.db, currency.data, {
    featuredOnly: featured,
    search: c.req.query("q")?.trim(),
    category: c.req.query("category")?.trim(),
    keyboardLayout: c.req.query("keyboard_layout")?.trim(),
    usage: c.req.query("usage")?.trim(),
    screenSize: c.req.query("screen_size")?.trim(),
    ramMemory: intFromQuery(c.req.query("ram_memory")),
    ssdSize: intFromQuery(c.req.query("ssd_size")),
    maxResolution: c.req.query("max_resolution")?.trim(),
    sort:
      sort === "price_asc" ||
      sort === "price_desc" ||
      sort === "popularity" ||
      sort === "newest" ||
      sort === "default"
        ? sort
        : "default",
  });
  return c.json({ items });
});

catalogRoutes.get("/products/by-skus", async (c) => {
  const currency = currencySchema.safeParse(c.req.query("currency") ?? "EUR");
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
  const currency = currencySchema.safeParse(c.req.query("currency") ?? "EUR");
  if (!currency.success) {
    return c.json({ error: "invalid currency" }, 400);
  }

  const product = await getProductBySlug(c.var.db, c.req.param("slug"), currency.data);
  if (!product) {
    return c.json({ error: "not found" }, 404);
  }

  return c.json(product);
});
