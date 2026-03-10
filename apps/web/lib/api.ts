export type Currency = "USD" | "EUR";

import {
  getDummyOrderById,
  getDummyProductBySlug,
  getDummyProductsBySkus,
  listDummyProducts,
} from "./dummyCatalog";

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  "http://localhost:4000";
const forceDummyCatalog =
  process.env.NEXT_PUBLIC_USE_DUMMY_CATALOG === "true" ||
  process.env.COINCART_USE_DUMMY_CATALOG === "true";
const allowDummyFallback =
  forceDummyCatalog ||
  process.env.NODE_ENV !== "production" ||
  typeof window !== "undefined";

export type Product = {
  id: string;
  sku: string;
  slug: string;
  category?: string | null;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
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
};

export type Order = {
  id: string;
  customerEmail: string;
  customerPhone?: string | null;
  currency: Currency;
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

const applyDummyFilters = (
  items: Product[],
  filters?: {
    q?: string;
    category?: string;
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
        (item.category || "").toLowerCase().includes(q),
    );
  }
  if (filters?.category) out = out.filter((item) => item.category === filters.category);
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
    q?: string;
    category?: string;
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
    const apiItems = (data.items || []) as Product[];
    if (apiItems.length === 0) return dummyList();
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
    if (!res.ok) return (getDummyProductBySlug(slug, currency) as Product | null) ?? null;
    return (await res.json()) as Product;
  } catch {
    return allowDummyFallback ? ((getDummyProductBySlug(slug, currency) as Product | null) ?? null) : null;
  }
};

export const fetchProductsBySkus = async (skus: string[], currency: Currency) => {
  if (skus.length === 0) return [] as Product[];
  if (forceDummyCatalog) return getDummyProductsBySkus(skus, currency) as Product[];

  const joined = encodeURIComponent(skus.join(","));
  try {
    const res = await fetch(`${apiBase}/v1/catalog/products/by-skus?currency=${currency}&skus=${joined}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`fetchProductsBySkus failed: ${res.status}`);
    const data = await res.json();
    const apiItems = (data.items || []) as Product[];
    if (apiItems.length === 0) return getDummyProductsBySkus(skus, currency) as Product[];
    return apiItems;
  } catch {
    return allowDummyFallback ? (getDummyProductsBySkus(skus, currency) as Product[]) : ([] as Product[]);
  }
};

export const createCheckoutSession = async (payload: {
  email: string;
  phone?: string;
  shippingCountry: string;
  currency: Currency;
  lines: Array<{ sku: string; quantity: number }>;
}) => {
  if (forceDummyCatalog) {
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
      const data = await res.json();
      throw new Error(data.error || "Checkout failed");
    }
    return res.json() as Promise<{
      orderId: string;
      shippingMethod: string;
      estimatedDeliveryDays: number;
      shippingCost: number;
      checkoutUrl: string;
    }>;
  } catch (error) {
    if (allowDummyFallback) {
      return {
        orderId: `demo-${Date.now().toString(36)}-paid`,
        shippingMethod: "DHL Standard",
        estimatedDeliveryDays: 5,
        shippingCost: payload.currency === "EUR" ? 10 : 11,
        checkoutUrl: "https://btcpay.example.test/invoice/demo",
      };
    }
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
