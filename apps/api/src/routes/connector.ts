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

type ConnectorStatusCode = 400 | 401 | 404 | 409 | 500 | 503;

const connectorError = (
  message: string,
  status: ConnectorStatusCode = 400,
  options?: {
    code?: string;
    details?: Record<string, unknown>;
  },
) => ({
  error: message,
  status,
  ...(options?.code ? { code: options.code } : {}),
  ...(options?.details ? { details: options.details } : {}),
});

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

const resolveGroupingValue = (collection?: string | null, category?: string | null) => collection ?? category ?? null;

const normalizeVisibilityStatus = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (normalized === "active") return "publish";
  return normalized;
};

const normalizeStockStatus = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (["instock", "in_stock", "in-stock"].includes(normalized)) return "instock";
  if (["outofstock", "out_of_stock", "out-of-stock"].includes(normalized)) return "outofstock";
  if (["onbackorder", "on_backorder", "on-backorder"].includes(normalized)) return "onbackorder";
  return normalized;
};

const parseStockQuantity = (payload: Record<string, unknown>) => {
  if (typeof payload.stock_quantity === "number") return Math.max(0, Math.trunc(payload.stock_quantity));
  if (typeof payload.stock === "number") return Math.max(0, Math.trunc(payload.stock));
  if (typeof payload.in_stock === "boolean" && payload.in_stock === false) return 0;
  const stockStatus = normalizeStockStatus(payload.stock_status);
  if (stockStatus === "outofstock") return 0;
  if (stockStatus === "instock") return 1;
  return 0;
};

const parseRegularPrice = (payload: Record<string, unknown>) =>
  parsePrice(payload.regular_price) ??
  parsePrice(payload.price_eur) ??
  parsePrice((payload.prices as Record<string, unknown> | undefined)?.EUR) ??
  parsePrice(payload.compareAt) ??
  parsePrice(payload.price);

const parseUsdPrice = (payload: Record<string, unknown>) =>
  parsePrice(payload.price_usd) ??
  parsePrice((payload.prices as Record<string, unknown> | undefined)?.USD);

type ParsedSalePrice = number | null | undefined;

const hasOwn = (payload: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(payload, key);

const hasNestedOwn = (payload: Record<string, unknown>, key: string) => {
  const prices = payload.prices;
  return typeof prices === "object" && prices !== null && hasOwn(prices as Record<string, unknown>, key);
};

const parseSalePriceValue = (value: unknown): ParsedSalePrice => {
  const parsed = parsePrice(value);
  if (parsed !== null) return parsed;
  if (value === null || value === undefined || value === "" || value === false) return null;
  return undefined;
};

const formatSalePricePatch = (value: ParsedSalePrice) =>
  value === undefined ? undefined : value === null ? null : value.toFixed(2);

const parseSalePriceEur = (payload: Record<string, unknown>) => {
  if (hasOwn(payload, "sale_price")) return parseSalePriceValue(payload.sale_price);
  if (hasOwn(payload, "sale_price_eur")) return parseSalePriceValue(payload.sale_price_eur);
  if (hasNestedOwn(payload, "SALE_EUR")) {
    return parseSalePriceValue((payload.prices as Record<string, unknown>).SALE_EUR);
  }

  const compareAt = parsePrice(payload.compareAt);
  const activePrice = parsePrice(payload.price);
  if (compareAt !== null && activePrice !== null && activePrice < compareAt) return activePrice;
  if (hasOwn(payload, "compareAt") && hasOwn(payload, "price")) return null;
  return undefined;
};

const parseSalePriceUsd = (payload: Record<string, unknown>) => {
  if (hasOwn(payload, "sale_price_usd")) return parseSalePriceValue(payload.sale_price_usd);
  if (hasNestedOwn(payload, "SALE_USD")) {
    return parseSalePriceValue((payload.prices as Record<string, unknown>).SALE_USD);
  }
  return undefined;
};

const parseVariantOptionFromAttributes = (attributes: unknown) => {
  const result = { optionName: undefined as string | undefined, optionValue: undefined as string | undefined, optionName2: undefined as string | undefined, optionValue2: undefined as string | undefined };
  if (!Array.isArray(attributes)) return result;
  const found: Array<{ name: string; value: string }> = [];
  for (const raw of attributes as Array<Record<string, unknown>>) {
    const name = typeof raw?.name === "string" ? raw.name.trim() : "";
    if (!name || name.toLowerCase() === "brand") continue;
    const option = toAttributeOptions(raw)[0] ?? "";
    if (option) {
      found.push({ name, value: option });
      if (found.length === 2) break;
    }
  }
  if (found[0]) { result.optionName = found[0].name; result.optionValue = found[0].value; }
  if (found[1]) { result.optionName2 = found[1].name; result.optionValue2 = found[1].value; }
  return result;
};

const parseVariantOption = (variant: Record<string, unknown>, fallbackOptionName?: string) => {
  const fromAttrs = parseVariantOptionFromAttributes(variant.attributes);
  if (fromAttrs.optionName && fromAttrs.optionValue) return fromAttrs;

  const optionName =
    (typeof variant.option_name === "string" && variant.option_name.trim()) ||
    (typeof variant.optionName === "string" && variant.optionName.trim()) ||
    (typeof variant.optionName1 === "string" && variant.optionName1.trim()) ||
    fallbackOptionName ||
    undefined;
  const optionValue =
    (typeof variant.option_value === "string" && variant.option_value.trim()) ||
    (typeof variant.optionValue === "string" && variant.optionValue.trim()) ||
    (typeof variant.option1 === "string" && variant.option1.trim()) ||
    (typeof variant.option === "string" && variant.option.trim()) ||
    undefined;
  const optionName2 =
    (typeof variant.optionName2 === "string" && variant.optionName2.trim()) || undefined;
  const optionValue2 =
    (typeof variant.option2 === "string" && variant.option2.trim()) || undefined;

  if (optionName && optionValue) return { optionName, optionValue, optionName2, optionValue2 };

  if (variant.options && typeof variant.options === "object" && !Array.isArray(variant.options)) {
    const entries = Object.entries(variant.options as Record<string, unknown>);
    const [first] = entries;
    if (first && typeof first[0] === "string" && typeof first[1] === "string") {
      return { optionName: first[0].trim(), optionValue: first[1].trim(), optionName2, optionValue2 };
    }
  }

  return { optionName: optionName || undefined, optionValue: optionValue || undefined, optionName2, optionValue2 };
};

const parseDirectOptionFields = (payload: Record<string, unknown>, fallbackOptionName?: string) => {
  const optionName =
    (typeof payload.option_name === "string" && payload.option_name.trim()) ||
    (typeof payload.optionName === "string" && payload.optionName.trim()) ||
    (typeof payload.optionName1 === "string" && payload.optionName1.trim()) ||
    fallbackOptionName ||
    undefined;
  const optionValue =
    (typeof payload.option_value === "string" && payload.option_value.trim()) ||
    (typeof payload.optionValue === "string" && payload.optionValue.trim()) ||
    (typeof payload.option1 === "string" && payload.option1.trim()) ||
    (typeof payload.option === "string" && payload.option.trim()) ||
    undefined;
  const optionName2 =
    (typeof payload.optionName2 === "string" && payload.optionName2.trim()) || undefined;
  const optionValue2 =
    (typeof payload.option2 === "string" && payload.option2.trim()) || undefined;

  if (optionName && optionValue) return { optionName, optionValue, optionName2, optionValue2 };

  if (payload.options && typeof payload.options === "object" && !Array.isArray(payload.options)) {
    const entries = Object.entries(payload.options as Record<string, unknown>);
    const [first] = entries;
    if (first && typeof first[0] === "string" && typeof first[1] === "string") {
      return { optionName: first[0].trim(), optionValue: first[1].trim(), optionName2, optionValue2 };
    }
  }

  return { optionName: optionName || undefined, optionValue: optionValue || undefined, optionName2, optionValue2 };
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

const toIsoString = (value: unknown) => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }
  return new Date().toISOString();
};

const resolveCategory = (payload: Record<string, unknown>) => {
  if (Array.isArray(payload.collections) && payload.collections.length > 0) {
    const first = payload.collections[0] as unknown;
    if (typeof first === "string" && first.trim().length > 0) return first.trim();
    if (first && typeof first === "object") {
      const entry = first as { handle?: string; name?: string; key?: string; slug?: string };
      if (typeof entry.handle === "string" && entry.handle.trim().length > 0) return entry.handle.trim();
      if (typeof entry.key === "string" && entry.key.trim().length > 0) return entry.key.trim();
      if (typeof entry.slug === "string" && entry.slug.trim().length > 0) return entry.slug.trim();
      if (typeof entry.name === "string" && entry.name.trim().length > 0) return entry.name.trim();
    }
  }
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

const parseIntFromUnknown = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === "string") {
    const digits = value.match(/\d+/)?.[0];
    if (!digits) return null;
    const parsed = Number(digits);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
  }
  return null;
};

const normalizeAttrKey = (value: string) => value.trim().toLowerCase().replace(/[\s-]+/g, "_");

const toAttributeScalar = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return "";
};

const toAttributeOptions = (raw: Record<string, unknown>): string[] => {
  const fromOptions = Array.isArray(raw?.options)
    ? raw.options
        .map((item) => toAttributeScalar(item))
        .filter((item): item is string => item.length > 0)
    : [];
  if (fromOptions.length > 0) return fromOptions;

  const singular = toAttributeScalar(raw?.option);
  if (singular) return [singular];

  const fallbackValue = toAttributeScalar(raw?.value);
  return fallbackValue ? [fallbackValue] : [];
};

const extractMappedProductFieldsFromAttributes = (attributes: unknown) => {
  const mapped: Partial<typeof products.$inferInsert> = {};
  if (!Array.isArray(attributes)) return mapped;

  for (const raw of attributes as Array<Record<string, unknown>>) {
    const isVariation = raw?.variation === true || raw?.is_variation === true;
    if (isVariation) continue;
    const rawName = typeof raw?.name === "string" ? raw.name : "";
    const key = normalizeAttrKey(rawName);
    if (!key) continue;
    const firstOption = toAttributeOptions(raw)[0] ?? "";
    if (!firstOption) continue;

    if (["cpu", "processor", "processor_model"].includes(key)) mapped.cpu = firstOption;
    if (["gpu", "gpu_model", "graphics"].includes(key)) mapped.gpu = firstOption;
    if (["screen_size", "display_size"].includes(key)) mapped.screenSize = firstOption;
    if (["display_type", "screen_type", "panel_type"].includes(key)) mapped.displayType = firstOption;
    if (["resolution", "screen_resolution"].includes(key)) mapped.resolution = firstOption;
    if (["max_resolution"].includes(key)) mapped.maxResolution = firstOption;
    if (["storage", "storage_capacity"].includes(key)) mapped.storage = firstOption;
    if (["keyboard_layout"].includes(key)) mapped.keyboardLayout = firstOption;
    if (["usage"].includes(key)) mapped.usage = firstOption;

    if (["refresh_rate"].includes(key)) {
      const parsed = parseIntFromUnknown(firstOption);
      if (parsed !== null) mapped.refreshRate = parsed;
    }
    if (["ram", "ram_memory"].includes(key)) {
      const parsed = parseIntFromUnknown(firstOption);
      if (parsed !== null) mapped.ramMemory = parsed;
    }
    if (["ssd_size"].includes(key)) {
      const parsed = parseIntFromUnknown(firstOption);
      if (parsed !== null) mapped.ssdSize = parsed;
    }
  }

  return mapped;
};

const extractExtraAttributesFromAttributes = (
  attributes: unknown,
  mappedFields: Partial<typeof products.$inferInsert>,
): Array<{ name: string; options: string[] }> => {
  if (!Array.isArray(attributes)) return [];
  const mappedKeys = new Set(
    [
      mappedFields.cpu ? "cpu" : null,
      mappedFields.gpu ? "gpu" : null,
      mappedFields.keyboardLayout ? "keyboard_layout" : null,
      mappedFields.usage ? "usage" : null,
      mappedFields.screenSize ? "screen_size" : null,
      mappedFields.displayType ? "display_type" : null,
      mappedFields.resolution ? "resolution" : null,
      mappedFields.maxResolution ? "max_resolution" : null,
      mappedFields.refreshRate !== undefined ? "refresh_rate" : null,
      mappedFields.ramMemory !== undefined ? "ram" : null,
      mappedFields.ssdSize !== undefined ? "ssd_size" : null,
      mappedFields.storage ? "storage" : null,
    ].filter((x): x is string => Boolean(x)),
  );

  const dedupe = new Set<string>();
  const out: Array<{ name: string; options: string[] }> = [];
  for (const raw of attributes as Array<Record<string, unknown>>) {
    const name = typeof raw?.name === "string" ? raw.name.trim() : "";
    if (!name) continue;
    const key = normalizeAttrKey(name);
    if (key === "brand" || key === "color") continue;
    if (mappedKeys.has(key) || (key === "ram_memory" && mappedKeys.has("ram")) || (key === "display_size" && mappedKeys.has("screen_size")) || (key === "screen_type" && mappedKeys.has("display_type")) || (key === "panel_type" && mappedKeys.has("display_type")) || (key === "screen_resolution" && mappedKeys.has("resolution")) || (key === "storage_capacity" && mappedKeys.has("storage"))) {
      continue;
    }

    const options = toAttributeOptions(raw);
    if (options.length === 0) continue;

    const dedupeKey = `${name.toLowerCase()}::${options.join("|").toLowerCase()}`;
    if (dedupe.has(dedupeKey)) continue;
    dedupe.add(dedupeKey);
    out.push({ name, options });
  }
  return out;
};

const mergeExtraAttributes = (
  base: Array<{ name: string; options: string[] }>,
  overlay: Array<{ name: string; options: string[] }>,
) => {
  const dedupe = new Set<string>();
  const out: Array<{ name: string; options: string[] }> = [];
  for (const item of [...base, ...overlay]) {
    const key = `${item.name.toLowerCase()}::${item.options.join("|").toLowerCase()}`;
    if (dedupe.has(key)) continue;
    dedupe.add(key);
    out.push(item);
  }
  return out;
};

const resolveImageUrls = (payload: Record<string, unknown>): string[] => {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (value: unknown) => {
    if (typeof value !== "string") return;
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    out.push(trimmed);
  };

  push(payload.image_url);
  push(payload.imageUrl);

  if (!Array.isArray(payload.images)) return out;
  for (const entry of payload.images as Array<unknown>) {
    if (typeof entry === "string") {
      push(entry);
      continue;
    }
    if (entry && typeof entry === "object") {
      const image = entry as { src?: unknown; url?: unknown };
      push(image.src);
      push(image.url);
    }
  }
  return out;
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
    optionName2?: string | null;
    optionValue2?: string | null;
    sku: string;
    slug: string;
    collection?: string | null;
    category: string | null;
    name: string;
    description: string | null;
    imageUrl: string | null;
    imageUrls?: string[] | null;
    visibilityStatus: string;
    brand: string | null;
    ean: string | null;
    cpu?: string | null;
    gpu?: string | null;
    keyboardLayout?: string | null;
    usage?: string | null;
    screenSize?: string | null;
    displayType?: string | null;
    resolution?: string | null;
    maxResolution?: string | null;
    refreshRate?: number | null;
    ramMemory?: number | null;
    ssdSize?: number | null;
    storage?: string | null;
    salePriceEur?: string | number | null;
    salePriceUsd?: string | number | null;
    extraAttributes?: Array<{ name?: unknown; options?: unknown; option?: unknown; value?: unknown }> | null;
    hasVariants?: boolean;
    stockQty: number;
    createdAt: Date;
    updatedAt: Date;
  },
  prices: Record<string, number>,
) => {
  const attributes: Array<Record<string, unknown>> = [];
  if (product.optionName && product.optionValue) attributes.push({ name: product.optionName, option: product.optionValue });
  if (product.optionName2 && product.optionValue2) attributes.push({ name: product.optionName2, option: product.optionValue2 });
  if (product.brand) attributes.push({ name: "Brand", options: [product.brand] });

  const attrFromColumn = (name: string, value: unknown) => {
    if (value === null || value === undefined || value === "") return;
    attributes.push({ name, options: [String(value)] });
  };
  attrFromColumn("CPU", product.cpu);
  attrFromColumn("GPU", product.gpu);
  attrFromColumn("Keyboard Layout", product.keyboardLayout);
  attrFromColumn("Usage", product.usage);
  attrFromColumn("Screen Size", product.screenSize);
  attrFromColumn("Display Type", product.displayType);
  attrFromColumn("Resolution", product.resolution);
  attrFromColumn("Max Resolution", product.maxResolution);
  attrFromColumn("Refresh Rate", product.refreshRate);
  if (product.ramMemory !== null && product.ramMemory !== undefined) attrFromColumn("RAM", `${product.ramMemory}GB`);
  attrFromColumn("SSD Size", product.ssdSize);
  attrFromColumn("Storage", product.storage);
  if (Array.isArray(product.extraAttributes)) {
    for (const raw of product.extraAttributes) {
      const name = typeof raw?.name === "string" ? raw.name.trim() : "";
      if (!name) continue;
      const options =
        Array.isArray(raw?.options)
          ? raw.options.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim())
          : typeof raw?.option === "string" && raw.option.trim()
            ? [raw.option.trim()]
            : typeof raw?.value === "string" && raw.value.trim()
              ? [raw.value.trim()]
              : [];
      if (options.length === 0) continue;
      attributes.push({ name, options });
    }
  }

  const regular = Number.isFinite(prices.EUR) ? prices.EUR.toFixed(2) : "0.00";
  const saleEurNumber = product.salePriceEur === null || product.salePriceEur === undefined ? null : Number(product.salePriceEur);
  const sale = Number.isFinite(saleEurNumber) ? Number(saleEurNumber).toFixed(2) : null;
  const activePrice = sale ?? regular;
  const imageUrls = Array.isArray(product.imageUrls)
    ? product.imageUrls.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : product.imageUrl
      ? [product.imageUrl]
      : [];

  const grouping = resolveGroupingValue(product.collection, product.category);

  return {
    id: product.wooId ?? product.id,
    uuid: product.id,
    woo_id: product.wooId,
    parent_id: product.parentProductId ?? null,
    type: product.isVariant ? "variation" : product.hasVariants ? "variable" : "simple",
    sku: product.sku,
    slug: product.slug,
    name: product.name,
    status: product.visibilityStatus,
    description: product.description,
    collection: grouping,
    category: grouping,
    categories: grouping ? [{ name: grouping }] : [],
    attributes,
    meta_data: product.ean ? [{ key: "ean", value: product.ean }] : [],
    manage_stock: true,
    stock_quantity: product.stockQty,
    in_stock: product.stockQty > 0,
    prices,
    regular_price: regular,
    sale_price: sale,
    price: activePrice,
    date_modified: toIsoString(product.updatedAt),
    date_modified_gmt: toIsoString(product.updatedAt),
    date_created: toIsoString(product.createdAt),
    image_url: imageUrls[0] ?? product.imageUrl,
    images: imageUrls.map((src) => ({ src })),
  };
};

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
    { key: "touchscreen", label: "Touchscreen", type: "enum", required: false, multi_value: false, allowed_values: ["No", "Yes"] },
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
    { key: "screen_resolution", label: "Screen Resolution", type: "enum", required: false, multi_value: false, allowed_values: ["1920x1080", "2560x1440", "3440x1440", "3840x2160"] },
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
  const amountStr = amount.toFixed(2);
  const [existing] = await c.var.db
    .select({ id: productPrices.id })
    .from(productPrices)
    .where(and(eq(productPrices.productId, productId), eq(productPrices.currency, currency)))
    .limit(1);

  if (existing) {
    await c.var.db
      .update(productPrices)
      .set({ amount: amountStr, updatedAt: new Date() })
      .where(eq(productPrices.id, existing.id));
    return;
  }

  await c.var.db.insert(productPrices).values({ productId, currency, amount: amountStr });
};

const upsertProductBySku = async (
  c: { var: AppContext["Variables"] },
  sku: string,
  insertValues: typeof products.$inferInsert,
  updateValues: Partial<typeof products.$inferInsert>,
) => {
  const [existing] = await c.var.db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.sku, sku))
    .limit(1);

  if (!existing) {
    const [created] = await c.var.db
      .insert(products)
      .values(insertValues)
      .returning({ id: products.id, wooId: products.wooId });
    return created;
  }

  const [updated] = await c.var.db
    .update(products)
    .set({ ...updateValues, updatedAt: new Date() })
    .where(eq(products.id, existing.id))
    .returning({ id: products.id, wooId: products.wooId });
  return updated;
};

const validateConnectorProductCreatePayload = (body: Record<string, unknown>) => {
  const sku = typeof body.sku === "string" ? body.sku.trim() : "";
  const name =
    typeof body.name === "string" && body.name.trim().length > 0
      ? body.name.trim()
      : typeof body.title === "string" && body.title.trim().length > 0
        ? body.title.trim()
        : "";
  if (!sku || !name) {
    return connectorError("sku and name are required", 400, { code: "missing_required_fields" });
  }

  if (body.attributes !== undefined && !Array.isArray(body.attributes)) {
    return connectorError("attributes must be an array", 400, { code: "invalid_attributes" });
  }

  if (body.images !== undefined && !Array.isArray(body.images)) {
    return connectorError("images must be an array", 400, { code: "invalid_images" });
  }

  if (body.meta_data !== undefined && !Array.isArray(body.meta_data)) {
    return connectorError("meta_data must be an array", 400, { code: "invalid_meta_data" });
  }

  if (body.parent_id !== undefined && typeof body.parent_id !== "string" && typeof body.parent_id !== "number") {
    return connectorError("parent_id must be a string or number", 400, { code: "invalid_parent_id" });
  }

  if (body.regular_price !== undefined && parsePrice(body.regular_price) === null) {
    return connectorError("regular_price must be numeric", 400, { code: "invalid_regular_price" });
  }

  if (body.price_eur !== undefined && parsePrice(body.price_eur) === null) {
    return connectorError("price_eur must be numeric", 400, { code: "invalid_price_eur" });
  }

  if (body.price_usd !== undefined && parsePrice(body.price_usd) === null) {
    return connectorError("price_usd must be numeric", 400, { code: "invalid_price_usd" });
  }

  if (body.stock_quantity !== undefined && typeof body.stock_quantity !== "number") {
    return connectorError("stock_quantity must be numeric", 400, { code: "invalid_stock_quantity" });
  }

  if (body.stock !== undefined && typeof body.stock !== "number") {
    return connectorError("stock must be numeric", 400, { code: "invalid_stock" });
  }

  if (body.type !== undefined) {
    const normalizedType = typeof body.type === "string" ? body.type.trim().toLowerCase() : "";
    if (normalizedType && !["simple", "variable", "variation"].includes(normalizedType)) {
      return connectorError("type must be simple, variable, or variation", 400, { code: "invalid_type" });
    }
  }

  if (body.stock_status !== undefined) {
    const stockStatus = normalizeStockStatus(body.stock_status);
    if (stockStatus && !["instock", "outofstock", "onbackorder"].includes(stockStatus)) {
      return connectorError("stock_status must be instock, outofstock, or onbackorder", 400, {
        code: "invalid_stock_status",
      });
    }
  }

  return null;
};

const classifyConnectorCreateError = (error: unknown) => {
  const err = error as {
    code?: string;
    constraint?: string;
    detail?: string;
    message?: string;
  };

  if (err?.code === "23505") {
    if (err.constraint === "products_slug_unique") {
      return connectorError("slug already exists", 409, {
        code: "slug_conflict",
        details: {
          constraint: err.constraint,
          detail: err.detail ?? null,
        },
      });
    }
    if (err.constraint === "products_sku_unique") {
      return connectorError("sku already exists", 409, {
        code: "sku_conflict",
        details: {
          constraint: err.constraint,
          detail: err.detail ?? null,
        },
      });
    }
    return connectorError("unique constraint violation", 409, {
      code: "unique_violation",
      details: {
        constraint: err.constraint ?? null,
        detail: err.detail ?? null,
      },
    });
  }

  if (err?.code === "22001") {
    return connectorError("one or more fields exceed the database length limit", 400, {
      code: "value_too_long",
      details: {
        detail: err.detail ?? err.message ?? null,
      },
    });
  }

  if (err?.code === "22P02") {
    return connectorError("one or more fields have an invalid format", 400, {
      code: "invalid_field_format",
      details: {
        detail: err.detail ?? err.message ?? null,
      },
    });
  }

  return null;
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
      optionName2: products.optionName2,
      optionValue2: products.optionValue2,
      sku: products.sku,
      slug: products.slug,
      collection: products.collection,
      category: products.category,
      name: products.name,
      description: products.description,
      imageUrl: products.imageUrl,
      imageUrls: products.imageUrls,
      visibilityStatus: products.visibilityStatus,
      brand: products.brand,
      ean: products.ean,
      cpu: products.cpu,
      gpu: products.gpu,
      keyboardLayout: products.keyboardLayout,
      usage: products.usage,
      screenSize: products.screenSize,
      displayType: products.displayType,
      resolution: products.resolution,
      maxResolution: products.maxResolution,
      refreshRate: products.refreshRate,
      ramMemory: products.ramMemory,
      ssdSize: products.ssdSize,
      storage: products.storage,
      salePriceEur: products.salePriceEur,
      salePriceUsd: products.salePriceUsd,
      extraAttributes: products.extraAttributes,
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
      parentProductId: products.parentProductId,
      isVariant: products.isVariant,
      optionName: products.optionName,
      optionValue: products.optionValue,
      optionName2: products.optionName2,
      optionValue2: products.optionValue2,
      sku: products.sku,
      slug: products.slug,
      collection: products.collection,
      category: products.category,
      name: products.name,
      description: products.description,
      imageUrl: products.imageUrl,
      imageUrls: products.imageUrls,
      visibilityStatus: products.visibilityStatus,
      brand: products.brand,
      ean: products.ean,
      cpu: products.cpu,
      gpu: products.gpu,
      keyboardLayout: products.keyboardLayout,
      usage: products.usage,
      screenSize: products.screenSize,
      displayType: products.displayType,
      resolution: products.resolution,
      maxResolution: products.maxResolution,
      refreshRate: products.refreshRate,
      ramMemory: products.ramMemory,
      ssdSize: products.ssdSize,
      storage: products.storage,
      salePriceEur: products.salePriceEur,
      salePriceUsd: products.salePriceUsd,
      extraAttributes: products.extraAttributes,
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

  const [variantCountRow] = await c.var.db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(and(eq(products.parentProductId, product.id), eq(products.isVariant, true)));
  const hasVariants = Number(variantCountRow?.count ?? 0) > 0;

  return c.json(toWooLikeProduct({ ...product, hasVariants }, prices));
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
      ? sql`(${products.name} ILIKE ${`%${search}%`} OR ${products.sku} ILIKE ${`%${search}%`} OR COALESCE(${products.collection}, ${products.category}) ILIKE ${`%${search}%`})`
      : sql`true`,
  );

  const items = await c.var.db
    .select({
      id: products.id,
      wooId: products.wooId,
      parentProductId: products.parentProductId,
      isVariant: products.isVariant,
      optionName: products.optionName,
      optionValue: products.optionValue,
      optionName2: products.optionName2,
      optionValue2: products.optionValue2,
      sku: products.sku,
      slug: products.slug,
      collection: products.collection,
      category: products.category,
      name: products.name,
      description: products.description,
      imageUrl: products.imageUrl,
      imageUrls: products.imageUrls,
      visibilityStatus: products.visibilityStatus,
      brand: products.brand,
      ean: products.ean,
      cpu: products.cpu,
      gpu: products.gpu,
      keyboardLayout: products.keyboardLayout,
      usage: products.usage,
      screenSize: products.screenSize,
      displayType: products.displayType,
      resolution: products.resolution,
      maxResolution: products.maxResolution,
      refreshRate: products.refreshRate,
      ramMemory: products.ramMemory,
      ssdSize: products.ssdSize,
      storage: products.storage,
      salePriceEur: products.salePriceEur,
      salePriceUsd: products.salePriceUsd,
      extraAttributes: products.extraAttributes,
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
  const parentIdsWithVariants = new Set<string>();
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

    const variantParentRows = await c.var.db
      .select({ parentId: products.parentProductId })
      .from(products)
      .where(and(inArray(products.parentProductId, ids), eq(products.isVariant, true)));
    for (const row of variantParentRows) {
      if (row.parentId) parentIdsWithVariants.add(row.parentId);
    }
  }

  const formatted = items.map((item) =>
    mapFields(
      toWooLikeProduct({ ...item, hasVariants: parentIdsWithVariants.has(item.id) }, pricesById.get(item.id) ?? { ...euDefaultPrices }),
      fields,
    ),
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
      .set({ stockQty: Math.max(0, Math.trunc(nextQty)), updatedAt: new Date() })
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

  try {
    const updatePayload: Partial<typeof products.$inferInsert> = {};
    const normalizedStatus = normalizeVisibilityStatus(body.status);

    if (typeof body.name === "string") updatePayload.name = body.name;
    else if (typeof body.title === "string") updatePayload.name = body.title;
    if (typeof body.slug === "string") updatePayload.slug = body.slug;
    if (typeof body.description === "string") updatePayload.description = body.description;
    if (typeof body.sku === "string") updatePayload.sku = body.sku;
    if (normalizedStatus) updatePayload.visibilityStatus = normalizedStatus;
    if (
      typeof body.stock_quantity === "number" ||
      typeof body.stock === "number" ||
      (typeof body.in_stock === "boolean" && body.in_stock === false)
    ) {
      updatePayload.stockQty = parseStockQuantity(body);
    }
    const resolvedCategory = resolveCategory(body);
    if (resolvedCategory !== undefined) {
      updatePayload.collection = resolvedCategory;
      updatePayload.category = resolvedCategory;
    }
    const resolvedImageUrls = resolveImageUrls(body);
    if (resolvedImageUrls.length > 0) {
      updatePayload.imageUrl = resolvedImageUrls[0];
      updatePayload.imageUrls = resolvedImageUrls;
    }
    const mappedFromAttributes = extractMappedProductFieldsFromAttributes(body.attributes);
    const extraFromAttributes = extractExtraAttributesFromAttributes(body.attributes, mappedFromAttributes);
    Object.assign(updatePayload, mappedFromAttributes);
    if (extraFromAttributes.length > 0) updatePayload.extraAttributes = extraFromAttributes;

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
      const brandValue =
        brandAttr && typeof brandAttr === "object"
          ? toAttributeOptions(brandAttr as Record<string, unknown>)[0]
          : "";
      if (brandValue) updatePayload.brand = brandValue;
    }
    const directOption = parseDirectOptionFields(body);
    if (directOption.optionName) updatePayload.optionName = directOption.optionName;
    if (directOption.optionValue) updatePayload.optionValue = directOption.optionValue;
    if (directOption.optionName2) updatePayload.optionName2 = directOption.optionName2;
    if (directOption.optionValue2) updatePayload.optionValue2 = directOption.optionValue2;

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
        collection: products.collection,
        category: products.category,
        visibilityStatus: products.visibilityStatus,
        imageUrl: products.imageUrl,
        imageUrls: products.imageUrls,
        brand: products.brand,
        description: products.description,
        cpu: products.cpu,
        gpu: products.gpu,
        keyboardLayout: products.keyboardLayout,
        usage: products.usage,
        screenSize: products.screenSize,
        displayType: products.displayType,
        resolution: products.resolution,
        maxResolution: products.maxResolution,
        refreshRate: products.refreshRate,
        ramMemory: products.ramMemory,
        ssdSize: products.ssdSize,
        storage: products.storage,
        salePriceEur: products.salePriceEur,
        salePriceUsd: products.salePriceUsd,
        extraAttributes: products.extraAttributes,
      })
      .from(products)
      .where(eq(products.id, resolved.id))
      .limit(1);
    if (!resolvedProduct) return c.json(connectorError("Product not found", 404), 404);

    const priceEur = parseRegularPrice(body);
    const priceUsd = parseUsdPrice(body);
    const salePriceEur = parseSalePriceEur(body);
    const salePriceUsd = parseSalePriceUsd(body);

    const formattedSalePriceEur = formatSalePricePatch(salePriceEur);
    const formattedSalePriceUsd = formatSalePricePatch(salePriceUsd);
    if (formattedSalePriceEur !== undefined) updatePayload.salePriceEur = formattedSalePriceEur;
    if (formattedSalePriceUsd !== undefined) updatePayload.salePriceUsd = formattedSalePriceUsd;

    if (Object.keys(updatePayload).length > 0) {
      await c.var.db
        .update(products)
        .set({ ...updatePayload, updatedAt: new Date() })
        .where(eq(products.id, resolved.id));
    }

    if (priceEur !== null) {
      await upsertPrice(c, resolved.id, "EUR", priceEur);
    }

    if (priceUsd !== null) {
      await upsertPrice(c, resolved.id, "USD", priceUsd);
    }

    const variantsInput = parseVariantsInput(body);
    const fallbackOptionName = parseFirstOptionName(body);
    const replaceVariants =
      body.replace_variants === true || body.replace_variations === true || body.replaceVariants === true;
    if (variantsInput.length > 0) {
      const parentId = resolvedProduct.id;
      const parentMappedDefaults: Partial<typeof products.$inferInsert> = {
        cpu: resolvedProduct.cpu ?? undefined,
        gpu: resolvedProduct.gpu ?? undefined,
        keyboardLayout: resolvedProduct.keyboardLayout ?? undefined,
        usage: resolvedProduct.usage ?? undefined,
        screenSize: resolvedProduct.screenSize ?? undefined,
        displayType: resolvedProduct.displayType ?? undefined,
        resolution: resolvedProduct.resolution ?? undefined,
        maxResolution: resolvedProduct.maxResolution ?? undefined,
        refreshRate: resolvedProduct.refreshRate ?? undefined,
        ramMemory: resolvedProduct.ramMemory ?? undefined,
        ssdSize: resolvedProduct.ssdSize ?? undefined,
        storage: resolvedProduct.storage ?? undefined,
      };
      const parentExtraDefaults = Array.isArray(resolvedProduct.extraAttributes)
        ? (resolvedProduct.extraAttributes as Array<{ name: string; options: string[] }>)
        : [];
      const keepVariantIds: string[] = [];
      const variantIds: Array<string | number> = [];

      for (const variant of variantsInput) {
        const variantSku = typeof variant.sku === "string" ? variant.sku.trim() : "";
        if (!variantSku) continue;

        const option = parseVariantOption(variant, fallbackOptionName);
        const variantName =
          typeof variant.name === "string" && variant.name.trim()
            ? variant.name.trim()
            : typeof variant.title === "string" && variant.title.trim()
              ? variant.title.trim()
              : option.optionValue && option.optionValue2
                ? `${resolvedProduct.name} - ${option.optionValue} / ${option.optionValue2}`
                : option.optionValue
                  ? `${resolvedProduct.name} - ${option.optionValue}`
                  : `${resolvedProduct.name} - ${variantSku}`;
        const variantSlug =
          typeof variant.slug === "string" && variant.slug.trim()
            ? variant.slug.trim()
            : slugify(variantName || variantSku);
        const variantStockQty = parseStockQuantity(variant);
        const variantImageUrls = resolveImageUrls(variant);
        const variantMappedRaw = extractMappedProductFieldsFromAttributes(variant.attributes);
        const variantMappedAttrs = { ...parentMappedDefaults, ...variantMappedRaw };
        const variantExtraRaw = extractExtraAttributesFromAttributes(variant.attributes, variantMappedRaw);
        const variantExtraAttrs = mergeExtraAttributes(parentExtraDefaults, variantExtraRaw);
        const variantSaleEur = parseSalePriceEur(variant);
        const variantSaleUsd = parseSalePriceUsd(variant);
        const variantStatus = normalizeVisibilityStatus(variant.status) ?? resolvedProduct.visibilityStatus;
        const insertValues: typeof products.$inferInsert = {
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
          optionName2: option.optionName2 ?? null,
          optionValue2: option.optionValue2 ?? null,
          sku: variantSku,
          slug: variantSlug,
          collection: resolvedProduct.collection ?? resolvedProduct.category ?? null,
          category: resolvedProduct.collection ?? resolvedProduct.category ?? null,
          name: variantName,
          description:
            typeof variant.description === "string"
              ? variant.description
              : resolvedProduct.description ?? null,
          visibilityStatus: variantStatus,
          brand:
            typeof variant.brand === "string" && variant.brand.trim()
              ? variant.brand.trim()
              : resolvedProduct.brand ?? null,
          ...(variantSaleEur !== undefined ? { salePriceEur: formatSalePricePatch(variantSaleEur) } : {}),
          ...(variantSaleUsd !== undefined ? { salePriceUsd: formatSalePricePatch(variantSaleUsd) } : {}),
          ...variantMappedAttrs,
          ...(variantExtraAttrs.length > 0 ? { extraAttributes: variantExtraAttrs } : {}),
          stockQty: variantStockQty,
          imageUrl: variantImageUrls[0] ?? resolvedProduct.imageUrl ?? null,
          imageUrls: variantImageUrls.length > 0
            ? variantImageUrls
            : Array.isArray(resolvedProduct.imageUrls)
              ? resolvedProduct.imageUrls
              : resolvedProduct.imageUrl
                ? [resolvedProduct.imageUrl]
                : [],
        };
        const updateValues: Partial<typeof products.$inferInsert> = {
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
          optionName2: option.optionName2 ?? null,
          optionValue2: option.optionValue2 ?? null,
          slug: variantSlug,
          collection: resolvedProduct.collection ?? resolvedProduct.category ?? null,
          category: resolvedProduct.collection ?? resolvedProduct.category ?? null,
          name: variantName,
          description:
            typeof variant.description === "string"
              ? variant.description
              : resolvedProduct.description ?? null,
          visibilityStatus: variantStatus,
          brand:
            typeof variant.brand === "string" && variant.brand.trim()
              ? variant.brand.trim()
              : resolvedProduct.brand ?? null,
          ...(variantSaleEur !== undefined ? { salePriceEur: formatSalePricePatch(variantSaleEur) } : {}),
          ...(variantSaleUsd !== undefined ? { salePriceUsd: formatSalePricePatch(variantSaleUsd) } : {}),
          ...variantMappedAttrs,
          ...(variantExtraAttrs.length > 0 ? { extraAttributes: variantExtraAttrs } : {}),
          stockQty: variantStockQty,
          ...(variantImageUrls.length > 0
            ? { imageUrl: variantImageUrls[0], imageUrls: variantImageUrls }
            : {}),
        };

        const saved = await upsertProductBySku(c, variantSku, insertValues, updateValues);

        keepVariantIds.push(saved.id);
        variantIds.push(saved.wooId ?? saved.id);

        const variantEur = parseRegularPrice(variant);
        const variantUsd = parseUsdPrice(variant);
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
  } catch (error) {
    const classifiedError = classifyConnectorCreateError(error);
    console.error("Connector product update failed", {
      idParam,
      sku: typeof body.sku === "string" ? body.sku.trim() : null,
      slug: typeof body.slug === "string" ? body.slug.trim() : null,
      parentId: body.parent_id ?? null,
      type: body.type ?? null,
      category: resolveCategory(body) ?? null,
      payload: body,
      error,
    });

    if (classifiedError) {
      return c.json(classifiedError, classifiedError.status);
    }

    return c.json(
      connectorError("Product update failed", 500, {
        code: "product_update_failed",
      }),
      500,
    );
  }
});

connectorRoutes.post("/products", async (c) => {
  const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return c.json(connectorError("Invalid JSON body"), 400);

  const validationError = validateConnectorProductCreatePayload(body);
  if (validationError) return c.json(validationError, validationError.status);

  const sku = typeof body.sku === "string" ? body.sku.trim() : "";
  const name =
    typeof body.name === "string" && body.name.trim().length > 0
      ? body.name.trim()
      : typeof body.title === "string" && body.title.trim().length > 0
        ? body.title.trim()
        : "";
  const slug =
    typeof body.slug === "string" && body.slug.trim().length > 0 ? body.slug.trim() : slugify(name || sku);

  try {
    const category = resolveCategory(body);
    const fallbackOptionName = parseFirstOptionName(body);
    const resolvedImageUrls = resolveImageUrls(body);
    const mappedFromAttributes = extractMappedProductFieldsFromAttributes(body.attributes);
    const extraFromAttributes = extractExtraAttributesFromAttributes(body.attributes, mappedFromAttributes);
    const normalizedStatus = normalizeVisibilityStatus(body.status) ?? "publish";

    let brand: string | undefined;
    if (Array.isArray(body.attributes)) {
      const brandAttr = (body.attributes as Array<{ name?: string; options?: string[] }>).find(
        (x) => x.name?.toLowerCase() === "brand",
      );
      const brandValue =
        brandAttr && typeof brandAttr === "object"
          ? toAttributeOptions(brandAttr as Record<string, unknown>)[0]
          : "";
      if (brandValue) brand = brandValue;
    }

    let parentProductId: string | null = null;
    if (typeof body.parent_id === "string" || typeof body.parent_id === "number") {
      const parentParsed = parseProductId(String(body.parent_id));
      const parentResolved = await resolveByParsedId(c, parentParsed);
      if (!parentResolved) return c.json(connectorError("parent_id not found", 404), 404);
      parentProductId = parentResolved.id;
    }
    const directVariantOption = parseDirectOptionFields(body, fallbackOptionName);
    const isVariant = Boolean(parentProductId);
    const shouldPersistVariantFields =
      isVariant || Boolean(directVariantOption.optionName || directVariantOption.optionValue);

    let ean: string | undefined;
    if (Array.isArray(body.meta_data)) {
      const eanMeta = (body.meta_data as Array<{ key?: string; value?: string }>).find((x) => x.key === "ean");
      if (eanMeta?.value) ean = String(eanMeta.value);
    }
    const salePriceEur = parseSalePriceEur(body);
    const salePriceUsd = parseSalePriceUsd(body);

    const insertValues: typeof products.$inferInsert = {
      wooId: typeof body.id === "number" ? body.id : typeof body.woo_id === "number" ? body.woo_id : null,
      ...(shouldPersistVariantFields
        ? {
            parentProductId,
            isVariant,
            optionName: directVariantOption.optionName ?? null,
            optionValue: directVariantOption.optionValue ?? null,
            optionName2: directVariantOption.optionName2 ?? null,
            optionValue2: directVariantOption.optionValue2 ?? null,
          }
        : {}),
      sku,
      slug,
      name,
      description: typeof body.description === "string" ? body.description : null,
      visibilityStatus: normalizedStatus,
      collection: category ?? null,
      category: category ?? null,
      brand: brand ?? null,
      ean: ean ?? null,
      ...(salePriceEur !== undefined ? { salePriceEur: formatSalePricePatch(salePriceEur) } : {}),
      ...(salePriceUsd !== undefined ? { salePriceUsd: formatSalePricePatch(salePriceUsd) } : {}),
      ...mappedFromAttributes,
      ...(extraFromAttributes.length > 0 ? { extraAttributes: extraFromAttributes } : {}),
      stockQty: parseStockQuantity(body),
      imageUrl: resolvedImageUrls[0] ?? null,
      imageUrls: resolvedImageUrls,
    };
    const updateValues: Partial<typeof products.$inferInsert> = {
      wooId: typeof body.id === "number" ? body.id : typeof body.woo_id === "number" ? body.woo_id : undefined,
      ...(shouldPersistVariantFields
        ? {
            parentProductId,
            isVariant,
            optionName: directVariantOption.optionName ?? null,
            optionValue: directVariantOption.optionValue ?? null,
            optionName2: directVariantOption.optionName2 ?? null,
            optionValue2: directVariantOption.optionValue2 ?? null,
          }
        : {}),
      slug,
      name,
      description: typeof body.description === "string" ? body.description : null,
      visibilityStatus: normalizedStatus,
      collection: category ?? null,
      category: category ?? null,
      brand: brand ?? null,
      ean: ean ?? null,
      ...(salePriceEur !== undefined ? { salePriceEur: formatSalePricePatch(salePriceEur) } : {}),
      ...(salePriceUsd !== undefined ? { salePriceUsd: formatSalePricePatch(salePriceUsd) } : {}),
      ...mappedFromAttributes,
      ...(extraFromAttributes.length > 0 ? { extraAttributes: extraFromAttributes } : {}),
      ...(resolvedImageUrls.length > 0
        ? { imageUrl: resolvedImageUrls[0], imageUrls: resolvedImageUrls }
        : {}),
    };
    const created = await upsertProductBySku(c, sku, insertValues, updateValues);

    const priceEur = parseRegularPrice(body);
    const priceUsd = parseUsdPrice(body);

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

    const parentMappedDefaults = mappedFromAttributes;
    const parentExtraDefaults = extraFromAttributes;
    const variantIds: Array<string | number> = [];
    for (const variant of variantsInput) {
      const variantSku = typeof variant.sku === "string" ? variant.sku.trim() : "";
      if (!variantSku) continue;

      const option = parseVariantOption(variant, fallbackOptionName);
      const variantName =
        typeof variant.name === "string" && variant.name.trim()
          ? variant.name.trim()
          : typeof variant.title === "string" && variant.title.trim()
            ? variant.title.trim()
          : option.optionValue && option.optionValue2
            ? `${name} - ${option.optionValue} / ${option.optionValue2}`
            : option.optionValue
              ? `${name} - ${option.optionValue}`
              : `${name} - ${variantSku}`;
      const variantSlug =
        typeof variant.slug === "string" && variant.slug.trim()
          ? variant.slug.trim()
          : slugify(variantName || variantSku);
      const variantStockQty = parseStockQuantity(variant);
      const variantImageUrls = resolveImageUrls(variant);
      const variantMappedRaw = extractMappedProductFieldsFromAttributes(variant.attributes);
      const variantMappedAttrs = { ...parentMappedDefaults, ...variantMappedRaw };
      const variantExtraRaw = extractExtraAttributesFromAttributes(variant.attributes, variantMappedRaw);
      const variantExtraAttrs = mergeExtraAttributes(parentExtraDefaults, variantExtraRaw);
      const variantSaleEur = parseSalePriceEur(variant);
      const variantSaleUsd = parseSalePriceUsd(variant);
      const variantStatus = normalizeVisibilityStatus(variant.status) ?? "publish";

      const variantInsertValues: typeof products.$inferInsert = {
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
        optionName2: option.optionName2 ?? null,
        optionValue2: option.optionValue2 ?? null,
        sku: variantSku,
        slug: variantSlug,
        collection: category ?? null,
        category: category ?? null,
        name: variantName,
        description: typeof variant.description === "string" ? variant.description : null,
        visibilityStatus: variantStatus,
        brand:
          typeof variant.brand === "string" && variant.brand.trim()
            ? variant.brand.trim()
            : brand ?? null,
        ...(variantSaleEur !== undefined ? { salePriceEur: formatSalePricePatch(variantSaleEur) } : {}),
        ...(variantSaleUsd !== undefined ? { salePriceUsd: formatSalePricePatch(variantSaleUsd) } : {}),
        ...variantMappedAttrs,
        ...(variantExtraAttrs.length > 0 ? { extraAttributes: variantExtraAttrs } : {}),
        stockQty: variantStockQty,
        imageUrl: variantImageUrls[0] ?? null,
        imageUrls: variantImageUrls,
      };
      const variantUpdateValues: Partial<typeof products.$inferInsert> = {
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
        optionName2: option.optionName2 ?? null,
        optionValue2: option.optionValue2 ?? null,
        slug: variantSlug,
        collection: category ?? null,
        category: category ?? null,
        name: variantName,
        description: typeof variant.description === "string" ? variant.description : null,
        visibilityStatus: variantStatus,
        brand:
          typeof variant.brand === "string" && variant.brand.trim()
            ? variant.brand.trim()
            : brand ?? null,
        ...(variantSaleEur !== undefined ? { salePriceEur: formatSalePricePatch(variantSaleEur) } : {}),
        ...(variantSaleUsd !== undefined ? { salePriceUsd: formatSalePricePatch(variantSaleUsd) } : {}),
        ...variantMappedAttrs,
        ...(variantExtraAttrs.length > 0 ? { extraAttributes: variantExtraAttrs } : {}),
        stockQty: variantStockQty,
        ...(variantImageUrls.length > 0
          ? { imageUrl: variantImageUrls[0], imageUrls: variantImageUrls }
          : {}),
      };
      const savedVariant = await upsertProductBySku(c, variantSku, variantInsertValues, variantUpdateValues);

      const variantEur = parseRegularPrice(variant);
      const variantUsd = parseUsdPrice(variant);
      if (variantEur !== null) await upsertPrice(c, savedVariant.id, "EUR", variantEur);
      if (variantUsd !== null) await upsertPrice(c, savedVariant.id, "USD", variantUsd);
      variantIds.push(savedVariant.wooId ?? savedVariant.id);
    }

    return c.json({ created: true, id: created.wooId ?? created.id, variant_ids: variantIds }, 201);
  } catch (error) {
    const classifiedError = classifyConnectorCreateError(error);
    console.error("Connector product create failed", {
      sku,
      slug,
      parentId: body.parent_id ?? null,
      type: body.type ?? null,
      category: resolveCategory(body) ?? null,
      payload: body,
      error,
    });

    if (classifiedError) {
      return c.json(classifiedError, classifiedError.status);
    }

    return c.json(
      connectorError("Product create failed", 500, {
        code: "product_create_failed",
      }),
      500,
    );
  }
});
