import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { Hono } from "hono";
import { productPrices, products } from "@coincart/db";
import type { AppContext } from "../types";

const connectorError = (message: string, status = 400) => ({ error: message, status });

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 160);

const parsePrice = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const parseProductId = (id: string) => {
  if (/^\d+$/.test(id)) return { wooId: Number(id), uuid: null as string | null };
  return { wooId: null as number | null, uuid: id };
};

const resolveCategory = (payload: Record<string, unknown>) => {
  if (typeof payload.category === "string" && payload.category.trim().length > 0) {
    return payload.category.trim();
  }
  if (Array.isArray(payload.categories) && payload.categories.length > 0) {
    const first = payload.categories[0] as { name?: string; id?: string | number };
    if (typeof first?.name === "string" && first.name.trim().length > 0) return first.name.trim();
    if (typeof first?.id === "number") return String(first.id);
    if (typeof first?.id === "string" && first.id.trim().length > 0) return first.id.trim();
  }
  return undefined;
};

const resolveByParsedId = async (c: { var: AppContext["Variables"] }, parsedId: ReturnType<typeof parseProductId>) => {
  const [row] = await c.var.db
    .select({ id: products.id, wooId: products.wooId })
    .from(products)
    .where(parsedId.wooId !== null ? eq(products.wooId, parsedId.wooId) : eq(products.id, parsedId.uuid!))
    .limit(1);
  return row;
};

const toWooLikeProduct = (
  product: {
    id: string;
    wooId: number | null;
    sku: string;
    slug: string;
    category: string | null;
    name: string;
    description: string | null;
    imageUrl: string | null;
    visibilityStatus: string;
    brand: string | null;
    ean: string | null;
    stockQty: number;
    createdAt: Date;
    updatedAt: Date;
  },
  prices: Record<string, number>,
) => ({
  id: product.wooId ?? product.id,
  uuid: product.id,
  woo_id: product.wooId,
  sku: product.sku,
  slug: product.slug,
  name: product.name,
  status: product.visibilityStatus,
  description: product.description,
  category: product.category,
  categories: product.category ? [{ name: product.category }] : [],
  attributes: product.brand ? [{ name: "Brand", options: [product.brand] }] : [],
  meta_data: product.ean ? [{ key: "ean", value: product.ean }] : [],
  manage_stock: true,
  stock_quantity: product.stockQty,
  in_stock: product.stockQty > 0,
  prices,
  date_modified: product.updatedAt.toISOString(),
  date_modified_gmt: product.updatedAt.toISOString(),
  date_created: product.createdAt.toISOString(),
  image_url: product.imageUrl,
});

const mapFields = (item: Record<string, unknown>, fields?: string) => {
  if (!fields) return item;
  const keys = fields.split(",").map((x) => x.trim()).filter(Boolean);
  if (keys.length === 0) return item;
  return keys.reduce<Record<string, unknown>>((acc, key) => {
    if (key in item) acc[key] = item[key];
    return acc;
  }, {});
};

const euDefaultPrices = { EUR: 0, USD: 0 };

export const connectorRoutes = new Hono<AppContext>();

connectorRoutes.use("*", async (c, next) => {
  const consumerKey = c.req.query("consumer_key");
  const consumerSecret = c.req.query("consumer_secret");
  const expectedKey = c.var.connectorAuth.consumerKey;
  const expectedSecret = c.var.connectorAuth.consumerSecret;

  if (!expectedKey || !expectedSecret) {
    return c.json(connectorError("Connector auth is not configured on server", 503), 503);
  }

  if (consumerKey !== expectedKey || consumerSecret !== expectedSecret) {
    return c.json(connectorError("Invalid consumer credentials", 401), 401);
  }

  await next();
});

connectorRoutes.get("/health", async (c) => {
  const [row] = await c.var.db.select({ id: products.id }).from(products).limit(1);
  return c.json({ ok: true, sampleProductId: row?.id ?? null });
});

connectorRoutes.get("/products/:parentId/variations", async (c) => {
  // Compatibility endpoint. Current catalog has no variation model.
  return c.json([]);
});

connectorRoutes.get("/products/:id", async (c) => {
  const idParam = c.req.param("id");
  const { wooId, uuid } = parseProductId(idParam);

  const [product] = await c.var.db
    .select({
      id: products.id,
      wooId: products.wooId,
      sku: products.sku,
      slug: products.slug,
      category: products.category,
      name: products.name,
      description: products.description,
      imageUrl: products.imageUrl,
      visibilityStatus: products.visibilityStatus,
      brand: products.brand,
      ean: products.ean,
      stockQty: products.stockQty,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .where(wooId !== null ? eq(products.wooId, wooId) : eq(products.id, uuid!))
    .limit(1);

  if (!product) return c.json(connectorError("Product not found", 404), 404);

  const priceRows = await c.var.db
    .select({ currency: productPrices.currency, amount: productPrices.amount })
    .from(productPrices)
    .where(eq(productPrices.productId, product.id));

  const prices = { ...euDefaultPrices };
  for (const row of priceRows) prices[row.currency as "EUR" | "USD"] = Number(row.amount);

  return c.json(toWooLikeProduct(product, prices));
});

connectorRoutes.get("/products", async (c) => {
  const perPage = Math.min(Number(c.req.query("per_page") ?? "20"), 100);
  const page = Math.max(Number(c.req.query("page") ?? "1"), 1);
  const status = c.req.query("status") ?? "publish";
  const search = c.req.query("search")?.trim();
  const sku = c.req.query("sku")?.trim();
  const fields = c.req.query("_fields");

  const where = and(
    status === "any" ? sql`true` : eq(products.visibilityStatus, status),
    sku ? eq(products.sku, sku) : sql`true`,
    search
      ? sql`(${products.name} ILIKE ${`%${search}%`} OR ${products.sku} ILIKE ${`%${search}%`} OR ${products.category} ILIKE ${`%${search}%`})`
      : sql`true`,
  );

  const items = await c.var.db
    .select({
      id: products.id,
      wooId: products.wooId,
      sku: products.sku,
      slug: products.slug,
      category: products.category,
      name: products.name,
      description: products.description,
      imageUrl: products.imageUrl,
      visibilityStatus: products.visibilityStatus,
      brand: products.brand,
      ean: products.ean,
      stockQty: products.stockQty,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .where(where)
    .orderBy(desc(products.updatedAt))
    .limit(perPage)
    .offset((page - 1) * perPage);

  const ids = items.map((x) => x.id);
  const pricesById = new Map<string, Record<string, number>>();
  if (ids.length > 0) {
    const priceRows = await c.var.db
      .select({
        productId: productPrices.productId,
        currency: productPrices.currency,
        amount: productPrices.amount,
      })
      .from(productPrices)
      .where(inArray(productPrices.productId, ids));

    for (const row of priceRows) {
      const current = pricesById.get(row.productId) ?? { ...euDefaultPrices };
      current[row.currency] = Number(row.amount);
      pricesById.set(row.productId, current);
    }
  }

  const formatted = items.map((item) =>
    mapFields(toWooLikeProduct(item, pricesById.get(item.id) ?? { ...euDefaultPrices }), fields),
  );

  return c.json(formatted);
});

connectorRoutes.post("/products/batch", async (c) => {
  const body = (await c.req.json().catch(() => null)) as
    | { update?: Array<{ id: string | number; manage_stock?: boolean; stock_quantity?: number; in_stock?: boolean }> }
    | null;
  if (!body?.update || !Array.isArray(body.update)) {
    return c.json(connectorError("Invalid batch payload"), 400);
  }

  const updated: Array<{ id: string | number; stock_quantity: number }> = [];
  for (const row of body.update) {
    const parsed = parseProductId(String(row.id));
    const nextQty =
      typeof row.stock_quantity === "number"
        ? row.stock_quantity
        : row.in_stock === false
          ? 0
          : undefined;

    if (typeof nextQty !== "number") continue;

    const result = await c.var.db
      .update(products)
      .set({ stockQty: Math.max(0, Math.trunc(nextQty)) })
      .where(parsed.wooId !== null ? eq(products.wooId, parsed.wooId) : eq(products.id, parsed.uuid!))
      .returning({ id: products.id, wooId: products.wooId, stockQty: products.stockQty });

    if (result[0]) {
      updated.push({
        id: result[0].wooId ?? result[0].id,
        stock_quantity: result[0].stockQty,
      });
    }
  }

  return c.json({ update: updated });
});

connectorRoutes.post("/products/:id", async (c) => {
  const methodOverride = (c.req.query("_method") || "").toUpperCase();
  const idParam = c.req.param("id");
  const parsedId = parseProductId(idParam);

  if (methodOverride === "DELETE") {
    const force = c.req.query("force") === "true";
    if (!force) return c.json(connectorError("force=true is required for delete"), 400);

    const deleted = await c.var.db
      .delete(products)
      .where(parsedId.wooId !== null ? eq(products.wooId, parsedId.wooId) : eq(products.id, parsedId.uuid!))
      .returning({ id: products.id, wooId: products.wooId });

    if (!deleted[0]) return c.json(connectorError("Product not found", 404), 404);
    return c.json({ deleted: true, id: deleted[0].wooId ?? deleted[0].id });
  }

  if (methodOverride !== "PUT") {
    return c.json(connectorError("Use POST with _method=PUT or _method=DELETE"), 400);
  }

  const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return c.json(connectorError("Invalid JSON body"), 400);

  const updatePayload: Partial<typeof products.$inferInsert> = {};

  if (typeof body.name === "string") updatePayload.name = body.name;
  if (typeof body.slug === "string") updatePayload.slug = body.slug;
  if (typeof body.description === "string") updatePayload.description = body.description;
  if (typeof body.sku === "string") updatePayload.sku = body.sku;
  if (typeof body.status === "string") updatePayload.visibilityStatus = body.status;
  if (typeof body.stock_quantity === "number") updatePayload.stockQty = Math.max(0, Math.trunc(body.stock_quantity));
  if (typeof body.in_stock === "boolean" && body.in_stock === false) updatePayload.stockQty = 0;
  const resolvedCategory = resolveCategory(body);
  if (resolvedCategory !== undefined) updatePayload.category = resolvedCategory;

  if (Array.isArray(body.attributes)) {
    const brandAttr = (body.attributes as Array<{ name?: string; options?: string[] }>).find(
      (x) => x.name?.toLowerCase() === "brand",
    );
    if (brandAttr?.options?.[0]) updatePayload.brand = brandAttr.options[0];
  }

  if (Array.isArray(body.meta_data)) {
    const eanMeta = (body.meta_data as Array<{ key?: string; value?: string }>).find((x) => x.key === "ean");
    if (eanMeta?.value) updatePayload.ean = String(eanMeta.value);
  }

  const resolved = await resolveByParsedId(c, parsedId);
  if (!resolved) return c.json(connectorError("Product not found", 404), 404);

  if (Object.keys(updatePayload).length > 0) {
    await c.var.db
      .update(products)
      .set(updatePayload)
      .where(eq(products.id, resolved.id));
  }

  const priceEur =
    parsePrice(body.regular_price) ??
    parsePrice(body.price_eur) ??
    parsePrice((body.prices as Record<string, unknown> | undefined)?.EUR);
  const priceUsd =
    parsePrice(body.price_usd) ??
    parsePrice((body.prices as Record<string, unknown> | undefined)?.USD);

  if (priceEur !== null) {
    await c.var.db
      .insert(productPrices)
      .values({ productId: resolved.id, currency: "EUR", amount: priceEur.toFixed(2) })
      .onConflictDoUpdate({
        target: [productPrices.productId, productPrices.currency],
        set: { amount: priceEur.toFixed(2) },
      });
  }

  if (priceUsd !== null) {
    await c.var.db
      .insert(productPrices)
      .values({ productId: resolved.id, currency: "USD", amount: priceUsd.toFixed(2) })
      .onConflictDoUpdate({
        target: [productPrices.productId, productPrices.currency],
        set: { amount: priceUsd.toFixed(2) },
      });
  }

  return c.json({ updated: true, id: resolved.wooId ?? resolved.id });
});

connectorRoutes.post("/products", async (c) => {
  const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return c.json(connectorError("Invalid JSON body"), 400);

  const sku = typeof body.sku === "string" ? body.sku.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!sku || !name) return c.json(connectorError("sku and name are required"), 400);

  const slug =
    typeof body.slug === "string" && body.slug.trim().length > 0 ? body.slug.trim() : slugify(name || sku);

  const category = resolveCategory(body);

  let brand: string | undefined;
  if (Array.isArray(body.attributes)) {
    const brandAttr = (body.attributes as Array<{ name?: string; options?: string[] }>).find(
      (x) => x.name?.toLowerCase() === "brand",
    );
    if (brandAttr?.options?.[0]) brand = brandAttr.options[0];
  }

  let ean: string | undefined;
  if (Array.isArray(body.meta_data)) {
    const eanMeta = (body.meta_data as Array<{ key?: string; value?: string }>).find((x) => x.key === "ean");
    if (eanMeta?.value) ean = String(eanMeta.value);
  }

  const [created] = await c.var.db
    .insert(products)
    .values({
      wooId: typeof body.id === "number" ? body.id : typeof body.woo_id === "number" ? body.woo_id : null,
      sku,
      slug,
      name,
      description: typeof body.description === "string" ? body.description : null,
      visibilityStatus: typeof body.status === "string" ? body.status : "publish",
      category: category ?? null,
      brand: brand ?? null,
      ean: ean ?? null,
      stockQty:
        typeof body.stock_quantity === "number"
          ? Math.max(0, Math.trunc(body.stock_quantity))
          : body.in_stock === false
            ? 0
            : 0,
      imageUrl: typeof body.image_url === "string" ? body.image_url : null,
    })
    .onConflictDoUpdate({
      target: products.sku,
      set: {
        wooId: typeof body.id === "number" ? body.id : typeof body.woo_id === "number" ? body.woo_id : undefined,
        slug,
        name,
        description: typeof body.description === "string" ? body.description : null,
        visibilityStatus: typeof body.status === "string" ? body.status : "publish",
        category: category ?? null,
        brand: brand ?? null,
        ean: ean ?? null,
      },
    })
    .returning({ id: products.id, wooId: products.wooId });

  const priceEur =
    parsePrice(body.regular_price) ??
    parsePrice(body.price_eur) ??
    parsePrice((body.prices as Record<string, unknown> | undefined)?.EUR);
  const priceUsd =
    parsePrice(body.price_usd) ??
    parsePrice((body.prices as Record<string, unknown> | undefined)?.USD);

  if (priceEur !== null) {
    await c.var.db
      .insert(productPrices)
      .values({ productId: created.id, currency: "EUR", amount: priceEur.toFixed(2) })
      .onConflictDoUpdate({
        target: [productPrices.productId, productPrices.currency],
        set: { amount: priceEur.toFixed(2) },
      });
  }
  if (priceUsd !== null) {
    await c.var.db
      .insert(productPrices)
      .values({ productId: created.id, currency: "USD", amount: priceUsd.toFixed(2) })
      .onConflictDoUpdate({
        target: [productPrices.productId, productPrices.currency],
        set: { amount: priceUsd.toFixed(2) },
      });
  }

  return c.json({ created: true, id: created.wooId ?? created.id }, 201);
});
