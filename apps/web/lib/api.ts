export type Currency = "USD" | "EUR";

import {
  getDummyOrderById,
  getDummyProductBySlug,
  getDummyProductsBySkus,
  listDummyProducts,
} from "./dummyCatalog";
import { collectionMeta, displayCollectionKeys, laptopCollectionKeys, type CollectionKey } from "./collections";

const defaultApiBase =
  process.env.NODE_ENV === "production"
    ? "https://coincart-api.hadrien-noci.workers.dev"
    : "http://localhost:4000";
const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  defaultApiBase;
const forceDummyCatalog =
  process.env.NEXT_PUBLIC_USE_DUMMY_CATALOG === "true" ||
  process.env.COINCART_USE_DUMMY_CATALOG === "true";
const allowDummyFallback =
  forceDummyCatalog ||
  process.env.NODE_ENV !== "production";
const API_TIMEOUT_MS = 5000;

const fetchWithTimeout = async (input: string, init: RequestInit = {}, timeoutMs = API_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

const toErrorMessage = (value: unknown, fallback: string) => {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const messages = value
      .map((entry) => {
        if (typeof entry === "string") return entry;
        if (entry && typeof entry === "object" && "message" in entry) {
          return String((entry as { message?: unknown }).message || "").trim();
        }
        return "";
      })
      .filter(Boolean);
    return messages.length > 0 ? messages.join("; ") : fallback;
  }
  if (value && typeof value === "object" && "message" in value) {
    const msg = String((value as { message?: unknown }).message || "").trim();
    return msg || fallback;
  }
  return fallback;
};

export type Product = {
  id: string;
  parentProductId?: string | null;
  isVariant?: boolean;
  optionName?: string | null;
  optionValue?: string | null;
  optionName2?: string | null;
  optionValue2?: string | null;
  sku: string;
  slug: string;
  category?: string | null;
  collection?: string | null;
  brand?: string | null;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  imageUrls?: string[];
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
  extraAttributes?: Array<{ name: string; options: string[] }>;
  tags?: string[];
  featured: boolean;
  bestSeller?: boolean;
  stockQty: number;
  soldQty?: number;
  price: number;
  promoPrice?: number | null;
  currency: Currency;
  variants?: Array<{
    id: string;
    parentProductId?: string | null;
    isVariant?: boolean;
    optionName?: string | null;
    optionValue?: string | null;
    optionName2?: string | null;
    optionValue2?: string | null;
    sku: string;
    slug: string;
    category?: string | null;
    collection?: string | null;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    imageUrls?: string[];
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
    featured: boolean;
    stockQty: number;
    price: number;
    currency: Currency;
  }>;
};

export type Order = {
  id: string;
  orderNumber?: string | null;
  customerEmail: string;
  customerPhone?: string | null;
  currency: Currency;
  subtotalAmount?: number;
  shippingAmount?: number;
  taxAmount?: number;
  discountAmount?: number;
  couponCode?: string | null;
  shippingMethod?: string | null;
  estimatedDeliveryDays?: number | null;
  shippingCost?: number;
  totalAmount: number;
  status: string;
  btcpayInvoiceId?: string | null;
  btcpayCheckoutUrl?: string | null;
  createdAt: string;
  items: Array<{
    sku: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
};

export type Collection = {
  id: string;
  key: CollectionKey;
  label: string;
  productCount: number;
};

type CollectionResponseItem = {
  id?: string;
  key?: string;
  label?: string;
  name?: string;
  productCount?: number | string;
};

const toNumber = (value: unknown, fallback = 0) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const toOptionalNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = toNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
};

const toCollectionKey = (value?: string | null) =>
  (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const accessoryCollectionKeys = [
  "accessories",
  "audio",
  "cameras",
  "connectivity",
  "controllers",
  "docking-stations",
  "graphics-cards",
  "headsets-earbuds",
  "keyboards",
  "laptop-bags",
  "mice",
  "storage",
  "webcams",
] as const satisfies CollectionKey[];

type ProductGroupKey = "accessories" | "desktops" | "laptops" | "monitors";

const productMatchesGroup = (item: Pick<Product, "collection" | "category">, group?: string) => {
  const key = toCollectionKey(item.collection || item.category);
  if (!group) return true;
  if (group === "laptops") return laptopCollectionKeys.includes(key as (typeof laptopCollectionKeys)[number]);
  if (group === "monitors") return displayCollectionKeys.includes(key as (typeof displayCollectionKeys)[number]);
  if (group === "accessories") return accessoryCollectionKeys.includes(key as (typeof accessoryCollectionKeys)[number]);
  if (group === "desktops") return key === "desktops";
  return true;
};

const normalizeImageUrl = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed;
};

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const deriveFieldsFromDescription = (description?: string | null) => {
  const text = typeof description === "string" ? stripHtml(description) : "";
  if (!text) return {};

  const cpuMatch = text.match(/((?:AMD|Intel)[^.|\n]*?Processor[^.\n]*)/i);
  const gpuMatch = text.match(/((?:NVIDIA|AMD)[^.|\n]*(?:GeForce|RTX|Radeon)[^.\n]*)/i);
  const screenSizeMatch = text.match(/(\d+(?:[.,]\d+)?)\s*cm\s*\(/i);
  const resolutionMatch = text.match(/(\d{3,4}\s*x\s*\d{3,4})/i);
  const refreshRateMatch = text.match(/(\d{2,3})\s*Hz/i);
  const ramMatch = text.match(/(\d+)\s*GB,\s*(?:DDR|LPDDR)/i);
  const storageMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(TB|GB)\s+SSD/i);

  return {
    cpu: cpuMatch?.[1]?.trim() ?? null,
    gpu: gpuMatch?.[1]?.trim() ?? null,
    screenSize: screenSizeMatch?.[1]?.replace(",", ".") ?? null,
    resolution: resolutionMatch?.[1]?.replace(/\s+/g, "") ?? null,
    refreshRate: refreshRateMatch ? Number(refreshRateMatch[1]) : null,
    ramMemory: ramMatch ? Number(ramMatch[1]) : null,
    storage: storageMatch ? `${storageMatch[1].replace(",", ".")} ${storageMatch[2].toUpperCase()} SSD` : null,
  };
};

const applyClientFilters = (
  items: Product[],
  filters?: {
    group?: ProductGroupKey;
    q?: string;
    category?: string;
    collection?: string;
    cpu?: string;
    gpu?: string;
    resolution?: string;
    refresh_rate?: string;
    storage?: string;
    keyboard_layout?: string;
    usage?: string;
    screen_size?: string;
    ram_memory?: string;
    ssd_size?: string;
    max_resolution?: string;
    sort?: "default" | "price_asc" | "price_desc" | "popularity" | "newest";
  },
) => {
  if (!filters) return items;
  let out = [...items];

  if (filters.q) {
    const q = filters.q.toLowerCase().trim();
    out = out.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        (item.collection || item.category || "").toLowerCase().includes(q),
    );
  }
  if (filters.category) {
    out = out.filter((item) => (item.collection || item.category || "") === filters.category);
  }
  if (filters.collection) {
    const expected = toCollectionKey(filters.collection);
    out = out.filter((item) => toCollectionKey(item.collection || item.category) === expected);
  }
  if (filters.group) out = out.filter((item) => productMatchesGroup(item, filters.group));
  if (filters.cpu) out = out.filter((item) => item.cpu === filters.cpu);
  if (filters.gpu) out = out.filter((item) => item.gpu === filters.gpu);
  if (filters.resolution) out = out.filter((item) => (item.resolution || item.maxResolution) === filters.resolution);
  if (filters.refresh_rate) out = out.filter((item) => String(item.refreshRate || "") === filters.refresh_rate);
  if (filters.storage) out = out.filter((item) => item.storage === filters.storage);
  if (filters.keyboard_layout) out = out.filter((item) => item.keyboardLayout === filters.keyboard_layout);
  if (filters.usage) out = out.filter((item) => item.usage === filters.usage);
  if (filters.screen_size) out = out.filter((item) => item.screenSize === filters.screen_size);
  if (filters.ram_memory) out = out.filter((item) => String(item.ramMemory || "") === filters.ram_memory);
  if (filters.ssd_size) out = out.filter((item) => String(item.ssdSize || "") === filters.ssd_size);
  if (filters.max_resolution) out = out.filter((item) => item.maxResolution === filters.max_resolution);

  if (filters.sort === "price_asc") out.sort((a, b) => a.price - b.price);
  if (filters.sort === "price_desc") out.sort((a, b) => b.price - a.price);
  if (filters.sort === "popularity") out.sort((a, b) => b.stockQty - a.stockQty);
  if (filters.sort === "newest") out.sort((a, b) => Number(b.id.localeCompare(a.id)));
  if (!filters.sort || filters.sort === "default") out.sort((a, b) => a.name.localeCompare(b.name));

  return out;
};

const normalizeProduct = (raw: Partial<Product>): Product => {
  const description = raw.description ?? null;
  const derived = deriveFieldsFromDescription(description);
  const normalizedPrimary = normalizeImageUrl(raw.imageUrl);
  const normalizedGallery = Array.isArray((raw as Product).imageUrls)
    ? ((raw as Product).imageUrls as string[])
        .map((x) => normalizeImageUrl(x))
        .filter((x): x is string => typeof x === "string")
    : normalizedPrimary
      ? [normalizedPrimary]
      : [];

  return {
  ...(raw as Product),
  id: String(raw.id || ""),
  parentProductId: (raw as Product).parentProductId ?? null,
  isVariant: Boolean((raw as Product).isVariant),
  optionName: (raw as Product).optionName ?? null,
  optionValue: (raw as Product).optionValue ?? null,
  optionName2: (raw as Product).optionName2 ?? null,
  optionValue2: (raw as Product).optionValue2 ?? null,
  sku: String(raw.sku || ""),
  slug: String(raw.slug || ""),
  category: (raw as Product).collection ?? raw.category ?? null,
  collection: (raw as Product).collection ?? raw.category ?? null,
  brand: (raw as Product).brand ?? null,
  name: String(raw.name || ""),
  description,
  imageUrl: normalizedPrimary ?? normalizedGallery[0] ?? null,
  imageUrls: normalizedGallery,
  cpu: raw.cpu ?? derived.cpu ?? null,
  gpu: raw.gpu ?? derived.gpu ?? null,
  keyboardLayout: raw.keyboardLayout ?? null,
  usage: raw.usage ?? null,
  screenSize: raw.screenSize ?? derived.screenSize ?? null,
  displayType: raw.displayType ?? null,
  resolution: raw.resolution ?? derived.resolution ?? null,
  maxResolution: raw.maxResolution ?? null,
  refreshRate: toOptionalNumber(raw.refreshRate) ?? derived.refreshRate ?? null,
  ramMemory: toOptionalNumber(raw.ramMemory) ?? derived.ramMemory ?? null,
  ssdSize: toOptionalNumber(raw.ssdSize),
  storage: raw.storage ?? derived.storage ?? null,
  extraAttributes: Array.isArray((raw as Product).extraAttributes)
    ? ((raw as Product).extraAttributes as Array<{ name?: unknown; options?: unknown }>)
        .map((entry) => ({
          name: String(entry?.name ?? "").trim(),
          options: Array.isArray(entry?.options)
            ? (entry.options as unknown[])
                .map((value) => String(value ?? "").trim())
                .filter(Boolean)
            : [],
        }))
        .filter((entry) => entry.name.length > 0 && entry.options.length > 0)
    : [],
  tags: Array.isArray((raw as Product).tags)
    ? ((raw as Product).tags as string[]).map((tag) => String(tag).trim()).filter(Boolean)
    : [],
  featured: Boolean(raw.featured),
  bestSeller: Boolean((raw as Product).bestSeller),
  stockQty: toNumber(raw.stockQty, 0),
  soldQty: toNumber((raw as Product).soldQty, 0),
  price: toNumber(raw.price, 0),
  promoPrice: toOptionalNumber((raw as Product).promoPrice),
  currency: raw.currency === "USD" ? "USD" : "EUR",
  variants: Array.isArray((raw as Product).variants)
    ? ((raw as Product).variants as Partial<Product>[])
        .map(normalizeProduct)
    : [],
  };
};

const applyDummyFilters = (
  items: Product[],
  filters?: {
    group?: ProductGroupKey;
    q?: string;
    category?: string;
    collection?: string;
    cpu?: string;
    gpu?: string;
    resolution?: string;
    refresh_rate?: string;
    storage?: string;
    keyboard_layout?: string;
    usage?: string;
    screen_size?: string;
    ram_memory?: string;
    ssd_size?: string;
    max_resolution?: string;
    sort?: "default" | "price_asc" | "price_desc" | "popularity" | "newest";
  },
) => {
  let out = [...items].filter((item) => item.stockQty > 0);

  if (filters?.q) {
    const q = filters.q.toLowerCase().trim();
    out = out.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        (item.collection || item.category || "").toLowerCase().includes(q),
    );
  }
  if (filters?.category) {
    out = out.filter((item) => (item.collection || item.category) === filters.category);
  }
  if (filters?.collection) out = out.filter((item) => item.collection === filters.collection);
  if (filters?.group) out = out.filter((item) => productMatchesGroup(item, filters.group));
  if (filters?.cpu) out = out.filter((item) => item.cpu === filters.cpu);
  if (filters?.gpu) out = out.filter((item) => item.gpu === filters.gpu);
  if (filters?.resolution) out = out.filter((item) => (item.resolution || item.maxResolution) === filters.resolution);
  if (filters?.refresh_rate) out = out.filter((item) => String(item.refreshRate || "") === filters.refresh_rate);
  if (filters?.storage) out = out.filter((item) => item.storage === filters.storage);
  if (filters?.keyboard_layout) out = out.filter((item) => item.keyboardLayout === filters.keyboard_layout);
  if (filters?.usage) out = out.filter((item) => item.usage === filters.usage);
  if (filters?.screen_size) out = out.filter((item) => item.screenSize === filters.screen_size);
  if (filters?.ram_memory) out = out.filter((item) => String(item.ramMemory || "") === filters.ram_memory);
  if (filters?.ssd_size) out = out.filter((item) => String(item.ssdSize || "") === filters.ssd_size);
  if (filters?.max_resolution) out = out.filter((item) => item.maxResolution === filters.max_resolution);

  if (filters?.sort === "price_asc") out.sort((a, b) => a.price - b.price);
  if (filters?.sort === "price_desc") out.sort((a, b) => b.price - a.price);
  if (filters?.sort === "popularity") out.sort((a, b) => b.stockQty - a.stockQty);
  if (filters?.sort === "newest") out.sort((a, b) => Number(b.id.localeCompare(a.id)));
  if (!filters?.sort || filters.sort === "default") out.sort((a, b) => a.name.localeCompare(b.name));

  return out;
};

export const fetchProducts = async (
  currency: Currency,
  featured = false,
  filters?: {
    group?: ProductGroupKey;
    q?: string;
    category?: string;
    collection?: string;
    cpu?: string;
    gpu?: string;
    resolution?: string;
    refresh_rate?: string;
    storage?: string;
    keyboard_layout?: string;
    usage?: string;
    screen_size?: string;
    ram_memory?: string;
    ssd_size?: string;
    max_resolution?: string;
    sort?: "default" | "price_asc" | "price_desc" | "popularity" | "newest";
  },
) => {
  const dummyList = () => {
    const base = listDummyProducts(currency) as Product[];
    const filtered = applyDummyFilters(base, filters);
    return featured ? filtered.filter((item) => item.featured) : filtered;
  };

  if (forceDummyCatalog) return dummyList();

  const params = new URLSearchParams({
    currency,
    featured: String(featured),
  });
  if (filters?.q) params.set("q", filters.q);
  if (filters?.category) params.set("category", filters.category);
  if (filters?.collection) params.set("collection", filters.collection);
  if (filters?.cpu) params.set("cpu", filters.cpu);
  if (filters?.gpu) params.set("gpu", filters.gpu);
  if (filters?.resolution) params.set("resolution", filters.resolution);
  if (filters?.refresh_rate) params.set("refresh_rate", filters.refresh_rate);
  if (filters?.storage) params.set("storage", filters.storage);
  if (filters?.keyboard_layout) params.set("keyboard_layout", filters.keyboard_layout);
  if (filters?.usage) params.set("usage", filters.usage);
  if (filters?.screen_size) params.set("screen_size", filters.screen_size);
  if (filters?.ram_memory) params.set("ram_memory", filters.ram_memory);
  if (filters?.ssd_size) params.set("ssd_size", filters.ssd_size);
  if (filters?.max_resolution) params.set("max_resolution", filters.max_resolution);
  if (filters?.sort) params.set("sort", filters.sort);

  try {
    const res = await fetch(`${apiBase}/v1/catalog/products?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`fetchProducts failed: ${res.status}`);
    const data = await res.json();
    const apiItems = applyClientFilters(
      ((data.items || []) as Partial<Product>[]).map(normalizeProduct),
      filters,
    );
    if (apiItems.length === 0) return allowDummyFallback ? dummyList() : ([] as Product[]);
    return apiItems;
  } catch {
    return allowDummyFallback ? dummyList() : ([] as Product[]);
  }
};

export const fetchProductBySlug = async (slug: string, currency: Currency) => {
  if (forceDummyCatalog) return (getDummyProductBySlug(slug, currency) as Product | null) ?? null;

  try {
    const res = await fetch(`${apiBase}/v1/catalog/products/${slug}?currency=${currency}`, {
      cache: "no-store",
    });
    if (!res.ok) return allowDummyFallback ? ((getDummyProductBySlug(slug, currency) as Product | null) ?? null) : null;
    return normalizeProduct((await res.json()) as Partial<Product>);
  } catch {
    return allowDummyFallback ? ((getDummyProductBySlug(slug, currency) as Product | null) ?? null) : null;
  }
};

export const fetchProductsBySkus = async (skus: string[], currency: Currency) => {
  if (skus.length === 0) return [] as Product[];
  if (forceDummyCatalog) return getDummyProductsBySkus(skus, currency) as Product[];

  const joined = encodeURIComponent(skus.join(","));
  try {
    const res = await fetchWithTimeout(`${apiBase}/v1/catalog/products/by-skus?currency=${currency}&skus=${joined}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`fetchProductsBySkus failed: ${res.status}`);
    const data = await res.json();
    const apiItems = ((data.items || []) as Partial<Product>[]).map(normalizeProduct);
    if (apiItems.length === 0) return allowDummyFallback ? (getDummyProductsBySkus(skus, currency) as Product[]) : ([] as Product[]);
    return apiItems;
  } catch {
    return allowDummyFallback ? (getDummyProductsBySkus(skus, currency) as Product[]) : ([] as Product[]);
  }
};

export const fetchTopSellingProducts = async (currency: Currency, limit = 4) => {
  const safeLimit = Math.max(1, Math.min(24, limit));
  const dummyFallback = () =>
    (listDummyProducts(currency) as Product[])
      .filter((item) => item.stockQty > 0)
      .sort((a, b) => {
        if (Boolean(a.bestSeller) !== Boolean(b.bestSeller)) return a.bestSeller ? -1 : 1;
        return b.stockQty - a.stockQty;
      })
      .slice(0, safeLimit)
      .map((item, index) => ({ ...item, soldQty: Math.max(1, item.stockQty - index * 3) }));

  if (forceDummyCatalog) return dummyFallback();

  try {
    const res = await fetch(`${apiBase}/v1/catalog/top-selling?currency=${currency}&limit=${safeLimit}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`fetchTopSellingProducts failed: ${res.status}`);
    const data = await res.json();
    const apiItems = ((data.items || []) as Partial<Product>[]).map(normalizeProduct);
    if (apiItems.length === 0) return allowDummyFallback ? dummyFallback() : ([] as Product[]);
    return apiItems;
  } catch {
    return allowDummyFallback ? dummyFallback() : ([] as Product[]);
  }
};

export const fetchCollections = async (currency: Currency): Promise<Collection[]> => {
  const dummyFallback = () => {
    const counts = new Map<string, number>();
    for (const product of listDummyProducts(currency) as Product[]) {
      const key = (product.collection || "").trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    return collectionMeta.map((entry) => ({
      id: entry.key,
      key: entry.key,
      label: entry.label,
      productCount: counts.get(entry.key) || 0,
    }));
  };
  const apiProductsFallback = async () => {
    const items = await fetchProducts(currency, false);
    const counts = new Map<string, number>();
    for (const product of items) {
      const key = toCollectionKey(product.collection || product.category);
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return collectionMeta.map((entry) => ({
      id: entry.key,
      key: entry.key,
      label: entry.label,
      productCount: counts.get(entry.key) || 0,
    }));
  };

  if (forceDummyCatalog) return dummyFallback();

  try {
    const res = await fetch(`${apiBase}/v1/catalog/collections`, { cache: "no-store" });
    if (!res.ok) throw new Error(`fetchCollections failed: ${res.status}`);
    const data = await res.json();
    const items: CollectionResponseItem[] = Array.isArray(data.items) ? data.items : [];
    if (items.length === 0) return allowDummyFallback ? dummyFallback() : apiProductsFallback();

    return items
      .map((item) => ({
        id: String(item.id || item.key || ""),
        key: String(item.key || "") as CollectionKey,
        label: String(item.label || item.name || item.key || ""),
        productCount: toNumber(item.productCount, 0),
      }))
      .filter((item) => Boolean(item.key));
  } catch {
    if (allowDummyFallback) return dummyFallback();
    return apiProductsFallback();
  }
};

export const createCheckoutSession = async (payload: {
  email: string;
  phone: string;
  shippingName: string;
  companyName?: string;
  streetAddress: string;
  secondaryAddress?: string;
  city: string;
  postcode: string;
  shippingCountry: string;
  shippingNotes?: string;
  agreeTermsAccepted?: boolean;
  currency: Currency;
  couponCode?: string;
  lines: Array<{ sku: string; quantity: number }>;
}) => {
  const allowDummyCheckout = forceDummyCatalog && process.env.NODE_ENV !== "production";
  if (allowDummyCheckout) {
    return {
      orderId: `demo-${Date.now().toString(36)}-paid`,
      shippingMethod: "DHL Standard",
      estimatedDeliveryDays: 5,
      shippingCost: payload.currency === "EUR" ? 10 : 11,
      checkoutUrl: "https://btcpay.example.test/invoice/demo",
    };
  }

  try {
    const res = await fetch(`${apiBase}/v1/checkout/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(toErrorMessage(data && (data as { error?: unknown }).error, "Checkout failed"));
    }
    return res.json() as Promise<{
      orderId: string;
      shippingMethod: string;
      estimatedDeliveryDays: number;
      shippingCost: number;
      checkoutUrl: string;
    }>;
  } catch (error) {
    // Never silently downgrade checkout in live mode.
    throw error;
  }
};

export const fetchOrder = async (orderId: string) => {
  if (forceDummyCatalog || orderId.startsWith("demo-")) {
    return getDummyOrderById(orderId) as Order;
  }

  try {
    const res = await fetch(`${apiBase}/v1/orders/${orderId}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`fetchOrder failed: ${res.status}`);
    return (await res.json()) as Order;
  } catch {
    return allowDummyFallback ? (getDummyOrderById(orderId) as Order) : null;
  }
};

export const sendContactMessage = async (payload: {
  firstName: string;
  lastName: string;
  email: string;
  subject:
    | "The product / brand I want is not listed (provide link)"
    | "Order support (payment, delivery, product)"
    | "Suggestion for Coincart"
    | "Business proposal for Coincart"
    | "Other";
  message: string;
  company?: string;
}) => {
  const res = await fetch(`${apiBase}/v1/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "Failed to send message" }));
    throw new Error(data.error || "Failed to send message");
  }

  return res.json() as Promise<{ ok: true }>;
};
