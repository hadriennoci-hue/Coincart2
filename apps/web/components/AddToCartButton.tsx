"use client";

import { useState } from "react";
import { addToCart } from "../lib/cart";

export function AddToCartButton({ sku }: { sku: string }) {
  const [added, setAdded] = useState(false);

  const handleClick = () => {
    addToCart(sku, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <button
      className="btn btn-primary btn-lg btn-full"
      onClick={handleClick}
    >
      {added ? "✓ Added to cart" : "Add to cart"}
    </button>
  );
}
