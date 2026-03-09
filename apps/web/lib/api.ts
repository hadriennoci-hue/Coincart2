export type Currency = "USD" | "EUR";

const apiBase = process.env.API_BASE_URL || "http://localhost:4000";

export type Product = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
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

export const fetchProducts = async (currency: Currency, featured = false) => {
  const res = await fetch(`${apiBase}/v1/catalog/products?currency=${currency}&featured=${featured}`, {
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
    checkoutUrl: string;
  }>;
};

export const fetchOrder = async (orderId: string) => {
  const res = await fetch(`${apiBase}/v1/orders/${orderId}`, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as Order;
};