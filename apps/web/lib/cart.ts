"use client";

export type CartSnapshot = {
  name?: string;
  imageUrl?: string | null;
  price?: number;
  currency?: "USD" | "EUR";
};

export type CartLine = { sku: string; quantity: number; snapshot?: CartSnapshot };
const KEY = "coincart.cart.v1";

export const getCart = (): CartLine[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]") as Array<{
      sku?: unknown;
      quantity?: unknown;
      snapshot?: unknown;
      price?: unknown;
      name?: unknown;
      imageUrl?: unknown;
      currency?: unknown;
    }>;
    const lines: CartLine[] = [];
    for (const entry of raw) {
        const sku = String(entry.sku || "").trim();
        const quantity = Number(entry.quantity);
        if (!sku || !Number.isFinite(quantity) || quantity < 1) continue;
        const snapshotRaw = entry.snapshot as Record<string, unknown> | undefined;
        const parsedSnapshotPrice =
          typeof snapshotRaw?.price === "number" && Number.isFinite(snapshotRaw.price)
            ? snapshotRaw.price
            : typeof snapshotRaw?.price === "string" && Number.isFinite(Number(snapshotRaw.price))
              ? Number(snapshotRaw.price)
              : typeof entry.price === "number" && Number.isFinite(entry.price)
                ? entry.price
                : typeof entry.price === "string" && Number.isFinite(Number(entry.price))
                  ? Number(entry.price)
                  : undefined;
        const snapshot: CartSnapshot | undefined = snapshotRaw
          ? {
              name:
                typeof snapshotRaw.name === "string"
                  ? snapshotRaw.name
                  : typeof entry.name === "string"
                    ? entry.name
                    : undefined,
              imageUrl:
                typeof snapshotRaw.imageUrl === "string"
                  ? snapshotRaw.imageUrl
                  : typeof entry.imageUrl === "string"
                    ? entry.imageUrl
                    : null,
              price: parsedSnapshotPrice,
              currency:
                snapshotRaw.currency === "USD"
                  ? "USD"
                  : snapshotRaw.currency === "EUR"
                    ? "EUR"
                    : entry.currency === "USD"
                      ? "USD"
                      : entry.currency === "EUR"
                        ? "EUR"
                        : undefined,
            }
          : parsedSnapshotPrice !== undefined || typeof entry.name === "string" || typeof entry.imageUrl === "string"
            ? {
                name: typeof entry.name === "string" ? entry.name : undefined,
                imageUrl: typeof entry.imageUrl === "string" ? entry.imageUrl : null,
                price: parsedSnapshotPrice,
                currency: entry.currency === "USD" ? "USD" : entry.currency === "EUR" ? "EUR" : undefined,
              }
            : undefined;
        lines.push({ sku, quantity, snapshot });
      }
    return lines;
  } catch {
    return [];
  }
};

export const setCart = (lines: CartLine[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event("cartupdate"));
};

export const addToCart = (sku: string, quantity = 1, snapshot?: CartSnapshot) => {
  const cart = getCart();
  const idx = cart.findIndex((x) => x.sku === sku);
  if (idx >= 0) {
    cart[idx] = {
      ...cart[idx],
      quantity: cart[idx].quantity + quantity,
      snapshot: snapshot ?? cart[idx].snapshot,
    };
  } else {
    cart.push({ sku, quantity, snapshot });
  }
  setCart(cart);
};

export const removeFromCart = (sku: string) => {
  setCart(getCart().filter((x) => x.sku !== sku));
};

export const clearCart = () => setCart([]);
