"use client";

import { useState } from "react";
import { toast } from "sonner";
import { addToCart } from "../lib/cart";

export function AddToCartButton({ sku }: { sku: string }) {
  const [adding, setAdding] = useState(false);

  const handleClick = () => {
    addToCart(sku, 1);
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
