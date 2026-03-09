export type Currency = "USD" | "EUR";

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  "http://localhost:4000";

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

  const res = await fetch(`${apiBase}/v1/catalog/products?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) return [] as Product[];
  const data = await res.json();
  return data.items as Product[];
};

export const fetchProductBySlug = async (slug: string, currency: Currency) => {
  const res = await fetch(`${apiBase}/v1/catalog/products/${slug}?currency=${currency}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as Product;
};

export const fetchProductsBySkus = async (skus: string[], currency: Currency) => {
  if (skus.length === 0) return [] as Product[];
  const joined = encodeURIComponent(skus.join(","));
  const res = await fetch(`${apiBase}/v1/catalog/products/by-skus?currency=${currency}&skus=${joined}`, {
    cache: "no-store",
  });
  if (!res.ok) return [] as Product[];
  const data = await res.json();
  return data.items as Product[];
};

export const createCheckoutSession = async (payload: {
  email: string;
  phone?: string;
  shippingCountry: string;
  currency: Currency;
  lines: Array<{ sku: string; quantity: number }>;
}) => {
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
};

export const fetchOrder = async (orderId: string) => {
  const res = await fetch(`${apiBase}/v1/orders/${orderId}`, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as Order;
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
