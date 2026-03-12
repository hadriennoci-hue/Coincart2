"use client";

import { useState } from "react";
import { toast } from "sonner";
import { addToCart } from "../lib/cart";

export function AddToCartButton({
  sku,
  name,
  imageUrl,
  price,
  currency,
}: {
  sku: string;
  name: string;
  imageUrl?: string | null;
  price: number;
  currency: "USD" | "EUR";
}) {
  const [adding, setAdding] = useState(false);

  const handleClick = () => {
    addToCart(sku, 1, { name, imageUrl, price, currency });
    setAdding(true);
    toast.success("Added to cart", {
      description: `${sku} has been added to your cart.`,
      duration: 3000,
    });
    setTimeout(() => setAdding(false), 1500);
  };

  return (
    <button
      className="btn btn-primary btn-lg btn-full"
      onClick={handleClick}
      disabled={adding}
    >
      {adding ? "✓ Added!" : "Add to cart"}
    </button>
  );
}
