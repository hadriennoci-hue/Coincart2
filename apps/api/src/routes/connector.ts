import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { Hono } from "hono";
import {
  productCollectionAttributes,
  productCollectionAttributeValues,
  productCollections,
  productPrices,
  products,
} from "@coincart/db";
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

const parseVariantOptionFromAttributes = (attributes: unknown) => {
  if (!Array.isArray(attributes)) return { optionName: undefined as string | undefined, optionValue: undefined as string | undefined };
  for (const raw of attributes as Array<Record<string, unknown>>) {
    const name = typeof raw?.name === "string" ? raw.name.trim() : "";
    if (!name || name.toLowerCase() === "brand") continue;
    const option =
      typeof raw?.option === "string"
        ? raw.option.trim()
        : Array.isArray(raw?.options) && typeof raw.options[0] === "string"
          ? String(raw.options[0]).trim()
          : "";
    if (option) return { optionName: name, optionValue: option };
  }
  return { optionName: undefined, optionValue: undefined };
};

const parseVariantOption = (variant: Record<string, unknown>, fallbackOptionName?: string) => {
  const fromAttrs = parseVariantOptionFromAttributes(variant.attributes);
  if (fromAttrs.optionName && fromAttrs.optionValue) return fromAttrs;

  const optionName =
    (typeof variant.option_name === "string" && variant.option_name.trim()) ||
    (typeof variant.optionName === "string" && variant.optionName.trim()) ||
    fallbackOptionName ||
    undefined;
  const optionValue =
    (typeof variant.option_value === "string" && variant.option_value.trim()) ||
    (typeof variant.optionValue === "string" && variant.optionValue.trim()) ||
    (typeof variant.option === "string" && variant.option.trim()) ||
    undefined;

  if (optionName && optionValue) return { optionName, optionValue };

  if (variant.options && typeof variant.options === "object" && !Array.isArray(variant.options)) {
    const entries = Object.entries(variant.options as Record<string, unknown>);
    const [first] = entries;
    if (first && typeof first[0] === "string" && typeof first[1] === "string") {
      return { optionName: first[0].trim(), optionValue: first[1].trim() };
    }
  }

  return { optionName: optionName || undefined, optionValue: optionValue || undefined };
};

const parseVariantsInput = (body: Record<string, unknown>) => {
  if (Array.isArray(body.variants)) return body.variants as Array<Record<string, unknown>>;
  if (Array.isArray(body.variations)) return body.variations as Array<Record<string, unknown>>;
  return [] as Array<Record<string, unknown>>;
};

const parseFirstOptionName = (body: Record<string, unknown>) => {
  if (!Array.isArray(body.options)) return undefined;
  const first = body.options[0] as Record<string, unknown> | undefined;
  if (!first) return undefined;
  if (typeof first.name === "string" && first.name.trim()) return first.name.trim();
  return undefined;
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
    parentProductId?: string | null;
    isVariant?: boolean;
    optionName?: string | null;
    optionValue?: string | null;
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
  parent_id: product.parentProductId ?? null,
  type: product.isVariant ? "variation" : "simple",
  sku: product.sku,
  slug: product.slug,
  name: product.name,
  status: product.visibilityStatus,
  description: product.description,
  category: product.category,
  categories: product.category ? [{ name: product.category }] : [],
  attributes: [
    ...(product.optionName && product.optionValue ? [{ name: product.optionName, option: product.optionValue }] : []),
    ...(product.brand ? [{ name: "Brand", options: [product.brand] }] : []),
  ],
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

const fallbackCollections = [
  { key: "cases", label: "Cases" },
  { key: "desktops", label: "Desktops" },
  { key: "displays", label: "Displays" },
  { key: "input-devices", label: "Input Devices" },
  { key: "laptops", label: "Laptops" },
  { key: "lifestyle", label: "Lifestyle" },
  { key: "tablets", label: "Tablets" },
];

const fallbackCollectionAttributes: Record<
  string,
  Array<{ key: string; label: string; type: string; required: boolean; multi_value: boolean; allowed_values: string[] }>
> = {
  laptops: [
    { key: "brand", label: "Brand", type: "enum", required: true, multi_value: false, allowed_values: ["Acer", "Predator"] },
    { key: "model", label: "Model", type: "enum", required: true, multi_value: false, allowed_values: ["Aspire 3", "Aspire 5", "Swift Go 14", "Swift X 14", "TravelMate P4", "Extensa 15", "Nitro V 15", "Nitro 16", "Predator Helios Neo 16", "Predator Helios 16", "Predator Triton 14"] },
    { key: "category", label: "Category", type: "enum", required: true, multi_value: false, allowed_values: ["Ultrabook", "Gaming Laptop", "Business Laptop", "Creator Laptop", "Everyday Laptop", "2-in-1 Laptop"] },
    { key: "series", label: "Series", type: "enum", required: false, multi_value: false, allowed_values: ["Aspire", "Swift", "Nitro", "Predator Helios", "Predator Triton", "TravelMate", "Extensa"] },
    { key: "screen_size", label: "Screen Size", type: "enum", required: false, multi_value: false, allowed_values: ["13.3", "14", "15.6", "16", "17.3", "18"] },
    { key: "resolution", label: "Resolution", type: "enum", required: false, multi_value: false, allowed_values: ["1920x1080", "1920x1200", "2560x1600", "2880x1800", "3840x2160"] },
    { key: "processor", label: "Processor", type: "enum", required: false, multi_value: false, allowed_values: ["Intel Core i5", "Intel Core i7", "Intel Core i9", "Intel Core Ultra 7", "AMD Ryzen 5", "AMD Ryzen 7", "AMD Ryzen 9"] },
    { key: "screen_type", label: "Screen Type", type: "enum", required: false, multi_value: false, allowed_values: ["IPS", "OLED", "Mini LED"] },
    { key: "refresh_rate", label: "Refresh Rate", type: "enum", required: false, multi_value: false, allowed_values: ["60", "90", "120", "144", "165", "240"] },
    { key: "processor_brand", label: "Processor Brand", type: "enum", required: false, multi_value: false, allowed_values: ["Intel", "AMD", "Qualcomm"] },
    { key: "processor_model", label: "Processor Model", type: "enum", required: false, multi_value: false, allowed_values: ["Intel Core i5", "Intel Core i7", "Intel Core i9", "Intel Core Ultra 5", "Intel Core Ultra 7", "Intel Core Ultra 9", "AMD Ryzen 5", "AMD Ryzen 7", "AMD Ryzen 9", "Snapdragon X Elite"] },
    { key: "processor_generation", label: "Processor Generation", type: "enum", required: false, multi_value: false, allowed_values: ["12th Gen", "13th Gen", "14th Gen", "Core Ultra Series 1", "Core Ultra Series 2", "Ryzen 7000 Series", "Ryzen 8000 Series", "Ryzen 9000 Series"] },
    { key: "processor_cores", label: "Processor Cores", type: "enum", required: false, multi_value: false, allowed_values: ["6", "8", "10", "12", "14", "16", "24"] },
    { key: "gpu_brand", label: "GPU Brand", type: "enum", required: false, multi_value: false, allowed_values: ["NVIDIA", "AMD", "Intel"] },
    { key: "gpu", label: "GPU", type: "enum", required: false, multi_value: false, allowed_values: ["Intel Arc Graphics", "GeForce RTX 4050", "GeForce RTX 4060", "GeForce RTX 4070", "GeForce RTX 4080", "GeForce RTX 4090"] },
    { key: "ram", label: "RAM", type: "enum", required: false, multi_value: false, allowed_values: ["8", "16", "32", "64"] },
    { key: "ram_type", label: "RAM Type", type: "enum", required: false, multi_value: false, allowed_values: ["DDR4", "DDR5", "LPDDR5", "LPDDR5X"] },
    { key: "ram_max", label: "Max RAM", type: "enum", required: false, multi_value: false, allowed_values: ["16", "32", "64", "96"] },
    { key: "storage_type", label: "Storage Type", type: "enum", required: false, multi_value: false, allowed_values: ["NVMe SSD", "SATA SSD"] },
    { key: "storage", label: "Storage", type: "enum", required: false, multi_value: false, allowed_values: ["256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD", "4TB SSD"] },
    { key: "battery_life", label: "Battery Life", type: "enum", required: false, multi_value: false, allowed_values: ["6", "8", "10", "12", "14"] },
    { key: "weight", label: "Weight", type: "enum", required: false, multi_value: false, allowed_values: ["<1.4", "1.4-1.8", "1.8-2.3", ">2.3"] },
    { key: "wifi", label: "Wi-Fi", type: "enum", required: false, multi_value: false, allowed_values: ["Wi-Fi 6", "Wi-Fi 6E", "Wi-Fi 7"] },
    { key: "bluetooth", label: "Bluetooth", type: "enum", required: false, multi_value: false, allowed_values: ["5.1", "5.2", "5.3", "5.4"] },
    { key: "ports", label: "Ports", type: "enum", required: false, multi_value: true, allowed_values: ["USB-A", "USB-C", "Thunderbolt 4", "HDMI 2.1", "microSD", "3.5mm Audio Jack", "RJ-45 Ethernet"] },
    { key: "operating_system", label: "Operating System", type: "enum", required: false, multi_value: false, allowed_values: ["Windows 11 Home", "Windows 11 Pro", "Linux", "No OS"] },
    { key: "color", label: "Color", type: "enum", required: false, multi_value: false, allowed_values: ["Black", "White", "Silver", "Blue", "Gray"] },
  ],
  displays: [
    { key: "brand", label: "Brand", type: "enum", required: true, multi_value: false, allowed_values: ["Acer", "Predator"] },
    { key: "model", label: "Model", type: "enum", required: true, multi_value: false, allowed_values: ["Nitro KG241Y", "Nitro XV272U", "Acer CB272", "Predator XB273K", "Predator X34 V", "Predator X45"] },
    { key: "category", label: "Category", type: "enum", required: true, multi_value: false, allowed_values: ["Gaming Monitor", "Office Monitor", "Creator Monitor", "Ultrawide Monitor"] },
    { key: "series", label: "Series", type: "enum", required: false, multi_value: false, allowed_values: ["Nitro", "Acer CB", "Predator XB", "Predator X"] },
    { key: "screen_size", label: "Screen Size", type: "enum", required: false, multi_value: false, allowed_values: ["23.8", "24", "27", "31.5", "34", "45"] },
    { key: "resolution", label: "Resolution", type: "enum", required: false, multi_value: false, allowed_values: ["1920x1080", "2560x1440", "3440x1440", "3840x2160"] },
    { key: "panel_type", label: "Panel Type", type: "enum", required: false, multi_value: false, allowed_values: ["IPS", "VA", "OLED", "Mini LED"] },
    { key: "screen_type", label: "Panel Type", type: "enum", required: false, multi_value: false, allowed_values: ["IPS", "VA", "OLED", "Mini LED"] },
    { key: "refresh_rate", label: "Refresh Rate", type: "enum", required: false, multi_value: false, allowed_values: ["60", "75", "120", "144", "165", "180", "240"] },
    { key: "response_time", label: "Response Time", type: "enum", required: false, multi_value: false, allowed_values: ["0.03", "0.5", "1", "2", "4"] },
    { key: "aspect_ratio", label: "Aspect Ratio", type: "enum", required: false, multi_value: false, allowed_values: ["16:9", "21:9", "32:9"] },
    { key: "curved", label: "Curved", type: "enum", required: false, multi_value: false, allowed_values: ["No", "1000R", "1500R"] },
    { key: "brightness", label: "Brightness", type: "enum", required: false, multi_value: false, allowed_values: ["250", "300", "400", "600", "1000"] },
    { key: "contrast_ratio", label: "Contrast Ratio", type: "enum", required: false, multi_value: false, allowed_values: ["1000:1", "3000:1", "1000000:1"] },
    { key: "hdr", label: "HDR", type: "enum", required: false, multi_value: false, allowed_values: ["None", "HDR400", "HDR600", "HDR1000"] },
    { key: "gsync_freesync", label: "G-Sync / FreeSync", type: "enum", required: false, multi_value: false, allowed_values: ["None", "G-SYNC Compatible", "G-SYNC", "FreeSync", "FreeSync Premium", "FreeSync Premium Pro"] },
    { key: "color_gamut", label: "Color Gamut", type: "enum", required: false, multi_value: false, allowed_values: ["95% sRGB", "99% sRGB", "95% DCI-P3", "99% Adobe RGB"] },
    { key: "ports", label: "Ports", type: "enum", required: false, multi_value: true, allowed_values: ["HDMI 2.0", "HDMI 2.1", "DisplayPort 1.4", "USB-C", "USB Hub", "3.5mm Audio Out"] },
    { key: "vesa_mount", label: "VESA Mount", type: "enum", required: false, multi_value: false, allowed_values: ["75x75", "100x100"] },
    { key: "color", label: "Color", type: "enum", required: false, multi_value: false, allowed_values: ["Black", "White", "Silver"] },
  ],
};

const upsertPrice = async (c: { var: AppContext["Variables"] }, productId: string, currency: "EUR" | "USD", amount: number) => {
  await c.var.db
    .insert(productPrices)
    .values({ productId, currency, amount: amount.toFixed(2) })
    .onConflictDoUpdate({
      target: [productPrices.productId, productPrices.currency],
      set: { amount: amount.toFixed(2) },
    });
};

export const connectorRoutes = new Hono<AppContext>();

connectorRoutes.use("*", async (c, next) => {
  const consumerKey = c.req.query("coincart_key") ?? c.req.query("consumer_key");
  const consumerSecret = c.req.query("coincart_secret") ?? c.req.query("consumer_secret");
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

connectorRoutes.get("/collections", async (c) => {
  try {
    const rows = await c.var.db
      .select({
        id: productCollections.id,
        key: productCollections.key,
        label: productCollections.label,
      })
      .from(productCollections)
      .orderBy(asc(productCollections.label));

    return c.json({
      items: rows.map((row) => ({
        id: row.id,
        key: row.key,
        slug: row.key,
        name: row.label,
        label: row.label,
      })),
    });
  } catch {
    return c.json({
      items: fallbackCollections.map((row) => ({
        id: row.key,
        key: row.key,
        slug: row.key,
        name: row.label,
        label: row.label,
        source: "fallback",
      })),
    });
  }
});

connectorRoutes.get("/collections/:key/attributes", async (c) => {
  const key = c.req.param("key").trim().toLowerCase();
  try {
    const [collection] = await c.var.db
      .select({
        id: productCollections.id,
        key: productCollections.key,
        label: productCollections.label,
      })
      .from(productCollections)
      .where(eq(productCollections.key, key))
      .limit(1);

    if (!collection) return c.json(connectorError("Collection not found", 404), 404);

    const attrs = await c.var.db
      .select({
        id: productCollectionAttributes.id,
        key: productCollectionAttributes.attributeKey,
        label: productCollectionAttributes.label,
        dataType: productCollectionAttributes.dataType,
        unit: productCollectionAttributes.unit,
        required: productCollectionAttributes.required,
        multiValue: productCollectionAttributes.multiValue,
        sortOrder: productCollectionAttributes.sortOrder,
      })
      .from(productCollectionAttributes)
      .where(eq(productCollectionAttributes.collectionId, collection.id))
      .orderBy(asc(productCollectionAttributes.sortOrder), asc(productCollectionAttributes.label));

    const attrIds = attrs.map((x) => x.id);
    const valuesByAttrId = new Map<string, string[]>();

    if (attrIds.length > 0) {
      const values = await c.var.db
        .select({
          attributeId: productCollectionAttributeValues.collectionAttributeId,
          value: productCollectionAttributeValues.value,
        })
        .from(productCollectionAttributeValues)
        .where(inArray(productCollectionAttributeValues.collectionAttributeId, attrIds))
        .orderBy(
          asc(productCollectionAttributeValues.sortOrder),
          asc(productCollectionAttributeValues.value),
        );

      for (const row of values) {
        const current = valuesByAttrId.get(row.attributeId) ?? [];
        current.push(row.value);
        valuesByAttrId.set(row.attributeId, current);
      }
    }

    return c.json({
      collection: {
        id: collection.id,
        key: collection.key,
        slug: collection.key,
        name: collection.label,
        label: collection.label,
      },
      items: attrs.map((attr) => ({
        id: attr.id,
        key: attr.key,
        name: attr.label,
        label: attr.label,
        type: attr.dataType,
        unit: attr.unit,
        required: attr.required,
        multi_value: attr.multiValue,
        allowed_values: valuesByAttrId.get(attr.id) ?? [],
      })),
    });
  } catch {
    const fallback = fallbackCollectionAttributes[key];
    if (!fallback) return c.json(connectorError("Collection not found", 404), 404);
    return c.json({
      collection: {
        id: key,
        key,
        slug: key,
        name: key,
        label: key,
        source: "fallback",
      },
      items: fallback.map((attr) => ({
        id: `${key}:${attr.key}`,
        ...attr,
        unit: null,
      })),
    });
  }
});

connectorRoutes.get("/products/:parentId/variations", async (c) => {
  const parsedParentId = parseProductId(c.req.param("parentId"));
  const parent = await resolveByParsedId(c, parsedParentId);
  if (!parent) return c.json(connectorError("Parent product not found", 404), 404);

  const variants = await c.var.db
    .select({
      id: products.id,
      wooId: products.wooId,
      parentProductId: products.parentProductId,
      isVariant: products.isVariant,
      optionName: products.optionName,
      optionValue: products.optionValue,
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
    .where(and(eq(products.parentProductId, parent.id), eq(products.isVariant, true)))
    .orderBy(asc(products.name));

  const ids = variants.map((v) => v.id);
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

  return c.json(variants.map((item) => toWooLikeProduct(item, pricesById.get(item.id) ?? { ...euDefaultPrices })));
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

  if (typeof body.parent_id === "string" || typeof body.parent_id === "number") {
    const parentParsed = parseProductId(String(body.parent_id));
    const parentResolved = await resolveByParsedId(c, parentParsed);
    if (!parentResolved) return c.json(connectorError("parent_id not found", 404), 404);
    updatePayload.parentProductId = parentResolved.id;
    updatePayload.isVariant = true;
  }

  if (Array.isArray(body.attributes)) {
    const brandAttr = (body.attributes as Array<{ name?: string; options?: string[] }>).find(
      (x) => x.name?.toLowerCase() === "brand",
    );
    if (brandAttr?.options?.[0]) updatePayload.brand = brandAttr.options[0];
    const variantOption = parseVariantOptionFromAttributes(body.attributes);
    if (variantOption.optionName) updatePayload.optionName = variantOption.optionName;
    if (variantOption.optionValue) updatePayload.optionValue = variantOption.optionValue;
  }

  if (Array.isArray(body.meta_data)) {
    const eanMeta = (body.meta_data as Array<{ key?: string; value?: string }>).find((x) => x.key === "ean");
    if (eanMeta?.value) updatePayload.ean = String(eanMeta.value);
  }

  const resolved = await resolveByParsedId(c, parsedId);
  if (!resolved) return c.json(connectorError("Product not found", 404), 404);

  const [resolvedProduct] = await c.var.db
    .select({
      id: products.id,
      wooId: products.wooId,
      parentProductId: products.parentProductId,
      isVariant: products.isVariant,
      name: products.name,
      slug: products.slug,
      category: products.category,
      visibilityStatus: products.visibilityStatus,
      imageUrl: products.imageUrl,
      brand: products.brand,
      description: products.description,
    })
    .from(products)
    .where(eq(products.id, resolved.id))
    .limit(1);
  if (!resolvedProduct) return c.json(connectorError("Product not found", 404), 404);

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

  const variantsInput = parseVariantsInput(body);
  const fallbackOptionName = parseFirstOptionName(body);
  const replaceVariants = body.replace_variants === true || body.replace_variations === true;
  if (variantsInput.length > 0) {
    const parentId = resolvedProduct.id;
    const keepVariantIds: string[] = [];
    const variantIds: Array<string | number> = [];

    for (const variant of variantsInput) {
      const variantSku = typeof variant.sku === "string" ? variant.sku.trim() : "";
      if (!variantSku) continue;

      const option = parseVariantOption(variant, fallbackOptionName);
      const variantName =
        typeof variant.name === "string" && variant.name.trim()
          ? variant.name.trim()
          : option.optionValue
            ? `${resolvedProduct.name} - ${option.optionValue}`
            : `${resolvedProduct.name} - ${variantSku}`;
      const variantSlug =
        typeof variant.slug === "string" && variant.slug.trim()
          ? variant.slug.trim()
          : slugify(variantName || variantSku);
      const variantStockQty =
        typeof variant.stock_quantity === "number"
          ? Math.max(0, Math.trunc(variant.stock_quantity))
          : variant.in_stock === false
            ? 0
            : 0;
      const [saved] = await c.var.db
        .insert(products)
        .values({
          wooId:
            typeof variant.id === "number"
              ? variant.id
              : typeof variant.woo_id === "number"
                ? variant.woo_id
                : null,
          parentProductId: parentId,
          isVariant: true,
          optionName: option.optionName ?? null,
          optionValue: option.optionValue ?? null,
          sku: variantSku,
          slug: variantSlug,
          category: resolvedProduct.category ?? null,
          name: variantName,
          description:
            typeof variant.description === "string"
              ? variant.description
              : resolvedProduct.description ?? null,
          visibilityStatus:
            typeof variant.status === "string"
              ? variant.status
              : resolvedProduct.visibilityStatus,
          brand:
            typeof variant.brand === "string" && variant.brand.trim()
              ? variant.brand.trim()
              : resolvedProduct.brand ?? null,
          stockQty: variantStockQty,
          imageUrl:
            typeof variant.image_url === "string"
              ? variant.image_url
              : resolvedProduct.imageUrl ?? null,
        })
        .onConflictDoUpdate({
          target: products.sku,
          set: {
            wooId:
              typeof variant.id === "number"
                ? variant.id
                : typeof variant.woo_id === "number"
                  ? variant.woo_id
                  : undefined,
            parentProductId: parentId,
            isVariant: true,
            optionName: option.optionName ?? null,
            optionValue: option.optionValue ?? null,
            slug: variantSlug,
            category: resolvedProduct.category ?? null,
            name: variantName,
            description:
              typeof variant.description === "string"
                ? variant.description
                : resolvedProduct.description ?? null,
            visibilityStatus:
              typeof variant.status === "string"
                ? variant.status
                : resolvedProduct.visibilityStatus,
            brand:
              typeof variant.brand === "string" && variant.brand.trim()
                ? variant.brand.trim()
                : resolvedProduct.brand ?? null,
            stockQty: variantStockQty,
            imageUrl:
              typeof variant.image_url === "string"
                ? variant.image_url
                : resolvedProduct.imageUrl ?? null,
          },
        })
        .returning({ id: products.id, wooId: products.wooId });

      keepVariantIds.push(saved.id);
      variantIds.push(saved.wooId ?? saved.id);

      const variantEur =
        parsePrice(variant.regular_price) ??
        parsePrice(variant.price_eur) ??
        parsePrice((variant.prices as Record<string, unknown> | undefined)?.EUR);
      const variantUsd =
        parsePrice(variant.price_usd) ??
        parsePrice((variant.prices as Record<string, unknown> | undefined)?.USD);
      if (variantEur !== null) await upsertPrice(c, saved.id, "EUR", variantEur);
      if (variantUsd !== null) await upsertPrice(c, saved.id, "USD", variantUsd);
    }

    if (replaceVariants) {
      if (keepVariantIds.length === 0) {
        await c.var.db.delete(products).where(eq(products.parentProductId, parentId));
      } else {
        await c.var.db
          .delete(products)
          .where(
            and(
              eq(products.parentProductId, parentId),
              sql`${products.id} NOT IN (${sql.join(keepVariantIds.map((id) => sql`${id}`), sql`,`)})`,
            ),
          );
      }
    }

    return c.json({ updated: true, id: resolved.wooId ?? resolved.id, variant_ids: variantIds });
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
  const fallbackOptionName = parseFirstOptionName(body);

  let brand: string | undefined;
  if (Array.isArray(body.attributes)) {
    const brandAttr = (body.attributes as Array<{ name?: string; options?: string[] }>).find(
      (x) => x.name?.toLowerCase() === "brand",
    );
    if (brandAttr?.options?.[0]) brand = brandAttr.options[0];
  }

  let parentProductId: string | null = null;
  if (typeof body.parent_id === "string" || typeof body.parent_id === "number") {
    const parentParsed = parseProductId(String(body.parent_id));
    const parentResolved = await resolveByParsedId(c, parentParsed);
    if (!parentResolved) return c.json(connectorError("parent_id not found", 404), 404);
    parentProductId = parentResolved.id;
  }
  const directVariantOption = parseVariantOption(body, fallbackOptionName);
  const isVariant = Boolean(parentProductId);

  let ean: string | undefined;
  if (Array.isArray(body.meta_data)) {
    const eanMeta = (body.meta_data as Array<{ key?: string; value?: string }>).find((x) => x.key === "ean");
    if (eanMeta?.value) ean = String(eanMeta.value);
  }

  const [created] = await c.var.db
    .insert(products)
    .values({
      wooId: typeof body.id === "number" ? body.id : typeof body.woo_id === "number" ? body.woo_id : null,
      parentProductId,
      isVariant,
      optionName: directVariantOption.optionName ?? null,
      optionValue: directVariantOption.optionValue ?? null,
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
        parentProductId,
        isVariant,
        optionName: directVariantOption.optionName ?? null,
        optionValue: directVariantOption.optionValue ?? null,
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
    await upsertPrice(c, created.id, "EUR", priceEur);
  }
  if (priceUsd !== null) {
    await upsertPrice(c, created.id, "USD", priceUsd);
  }
  const variantsInput = parseVariantsInput(body);
  if (variantsInput.length === 0) {
    return c.json({ created: true, id: created.wooId ?? created.id }, 201);
  }

  const variantIds: Array<string | number> = [];
  for (const variant of variantsInput) {
    const variantSku = typeof variant.sku === "string" ? variant.sku.trim() : "";
    if (!variantSku) continue;

    const option = parseVariantOption(variant, fallbackOptionName);
    const variantName =
      typeof variant.name === "string" && variant.name.trim()
        ? variant.name.trim()
        : option.optionValue
          ? `${name} - ${option.optionValue}`
          : `${name} - ${variantSku}`;
    const variantSlug =
      typeof variant.slug === "string" && variant.slug.trim()
        ? variant.slug.trim()
        : slugify(variantName || variantSku);
    const variantStockQty =
      typeof variant.stock_quantity === "number"
        ? Math.max(0, Math.trunc(variant.stock_quantity))
        : variant.in_stock === false
          ? 0
          : 0;

    const [savedVariant] = await c.var.db
      .insert(products)
      .values({
        wooId:
          typeof variant.id === "number"
            ? variant.id
            : typeof variant.woo_id === "number"
              ? variant.woo_id
              : null,
        parentProductId: created.id,
        isVariant: true,
        optionName: option.optionName ?? null,
        optionValue: option.optionValue ?? null,
        sku: variantSku,
        slug: variantSlug,
        category: category ?? null,
        name: variantName,
        description: typeof variant.description === "string" ? variant.description : null,
        visibilityStatus: typeof variant.status === "string" ? variant.status : "publish",
        brand:
          typeof variant.brand === "string" && variant.brand.trim()
            ? variant.brand.trim()
            : brand ?? null,
        stockQty: variantStockQty,
        imageUrl: typeof variant.image_url === "string" ? variant.image_url : null,
      })
      .onConflictDoUpdate({
        target: products.sku,
        set: {
          wooId:
            typeof variant.id === "number"
              ? variant.id
              : typeof variant.woo_id === "number"
                ? variant.woo_id
                : undefined,
          parentProductId: created.id,
          isVariant: true,
          optionName: option.optionName ?? null,
          optionValue: option.optionValue ?? null,
          slug: variantSlug,
          category: category ?? null,
          name: variantName,
          description: typeof variant.description === "string" ? variant.description : null,
          visibilityStatus: typeof variant.status === "string" ? variant.status : "publish",
          brand:
            typeof variant.brand === "string" && variant.brand.trim()
              ? variant.brand.trim()
              : brand ?? null,
          stockQty: variantStockQty,
          imageUrl: typeof variant.image_url === "string" ? variant.image_url : null,
        },
      })
      .returning({ id: products.id, wooId: products.wooId });

    const variantEur =
      parsePrice(variant.regular_price) ??
      parsePrice(variant.price_eur) ??
      parsePrice((variant.prices as Record<string, unknown> | undefined)?.EUR);
    const variantUsd =
      parsePrice(variant.price_usd) ??
      parsePrice((variant.prices as Record<string, unknown> | undefined)?.USD);
    if (variantEur !== null) await upsertPrice(c, savedVariant.id, "EUR", variantEur);
    if (variantUsd !== null) await upsertPrice(c, savedVariant.id, "USD", variantUsd);
    variantIds.push(savedVariant.wooId ?? savedVariant.id);
  }

  return c.json({ created: true, id: created.wooId ?? created.id, variant_ids: variantIds }, 201);
});
