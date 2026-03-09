"use client";

import { addToCart } from "../lib/cart";

export function AddToCartButton({ sku }: { sku: string }) {
  return (
    <button
      className="button"
      onClick={() => {
        addToCart(sku, 1);
        alert("Added to cart");
      }}
    >
      Add to cart
    </button>
  );
}