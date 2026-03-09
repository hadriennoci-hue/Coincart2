"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchProductsBySkus, type Currency, type Product } from "../../lib/api";
import { getCart, removeFromCart } from "../../lib/cart";

export default function CartPage() {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [items, setItems] = useState<Product[]>([]);
  const [lines, setLines] = useState<Array<{ sku: string; quantity: number }>>([]);

  useEffect(() => {
    const initial = getCart();
    setLines(initial);
  }, []);

  useEffect(() => {
    const run = async () => {
      const products = await fetchProductsBySkus(
        lines.map((x) => x.sku),
        currency,
      );
      setItems(products);
    };
    run();
  }, [currency, lines]);

  const total = useMemo(() => {
    const map = new Map(lines.map((x) => [x.sku, x.quantity]));
    return items.reduce((acc, item) => acc + item.price * (map.get(item.sku) || 0), 0);
  }, [items, lines]);

  return (
    <div className="card">
      <h2>Cart</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button className="button secondary" onClick={() => setCurrency("USD")}>USD</button>
        <button className="button secondary" onClick={() => setCurrency("EUR")}>EUR</button>
      </div>
      {items.length === 0 && <p className="small">Cart is empty.</p>}
      {items.map((item) => {
        const qty = lines.find((l) => l.sku === item.sku)?.quantity || 0;
        return (
          <div key={item.id} style={{ borderTop: "1px solid var(--line)", padding: "10px 0" }}>
            <b>{item.name}</b>
            <p className="small">{item.sku}</p>
            <p>
              {qty} x {item.price.toFixed(2)} {currency}
            </p>
            <button
              className="button secondary"
              onClick={() => {
                removeFromCart(item.sku);
                const now = getCart();
                setLines(now);
              }}
            >
              Remove
            </button>
          </div>
        );
      })}
      <h3>
        Total: {total.toFixed(2)} {currency}
      </h3>
      <Link className="button" href={`/checkout?currency=${currency}`}>
        Continue to checkout
      </Link>
    </div>
  );
}