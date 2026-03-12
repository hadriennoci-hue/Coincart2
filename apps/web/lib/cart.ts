"use client";

type CartLine = { sku: string; quantity: number };
const KEY = "coincart.cart.v1";

export const getCart = (): CartLine[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as CartLine[];
  } catch {
    return [];
  }
};

export const setCart = (lines: CartLine[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event("cartupdate"));
};

export const addToCart = (sku: string, quantity = 1) => {
  const cart = getCart();
  const idx = cart.findIndex((x) => x.sku === sku);
  if (idx >= 0) {
    cart[idx] = { ...cart[idx], quantity: cart[idx].quantity + quantity };
  } else {
    cart.push({ sku, quantity });
  }
  setCart(cart);
};

export const removeFromCart = (sku: string) => {
  setCart(getCart().filter((x) => x.sku !== sku));
};

export const clearCart = () => setCart([]);