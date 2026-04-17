"use client";

import { useEffect, useState } from "react";
import { AddToCartButton } from "./AddToCartButton";
import { fmtPrice } from "../lib/format";
import type { Currency } from "../lib/api";

interface StickyPurchaseBarProps {
  productName: string;
  price: number;
  currency: Currency;
  sku: string;
  imageUrl?: string | null;
}

/**
 * Fixed bottom bar (desktop only) that appears once the main purchase panel
 * has scrolled out of view. Disappears when the user scrolls back up to it.
 */
export function StickyPurchaseBar({
  productName,
  price,
  currency,
  sku,
  imageUrl,
}: StickyPurchaseBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 900) return;

    const anchor = document.getElementById("pdp-purchase-anchor");
    if (!anchor) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.1 },
    );
    observer.observe(anchor);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "var(--surface-dark, #111)",
        borderTop: "1px solid var(--border)",
        padding: "12px 32px",
        display: "flex",
        alignItems: "center",
        gap: 20,
        boxShadow: "0 -4px 24px rgba(0,0,0,0.4)",
      }}
    >
      <span
        style={{
          flex: 1,
          fontWeight: 600,
          fontSize: "0.9rem",
          color: "var(--text)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {productName}
      </span>
      <span
        style={{
          fontWeight: 700,
          fontSize: "1.1rem",
          color: "var(--accent)",
          whiteSpace: "nowrap",
        }}
      >
        {fmtPrice(price, currency)}
      </span>
      <div style={{ flexShrink: 0, minWidth: 160 }}>
        <AddToCartButton
          sku={sku}
          name={productName}
          imageUrl={imageUrl}
          price={price}
          currency={currency}
        />
      </div>
    </div>
  );
}
