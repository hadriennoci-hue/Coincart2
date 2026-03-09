"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchProductsBySkus, type Currency, type Product } from "../../lib/api";
import { getCart, removeFromCart } from "../../lib/cart";

export default function CartPage() {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [items, setItems] = useState<Product[]>([]);
  const [lines, setLines] = useState<Array<{ sku: string; quantity: number }>>([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [shippingMethod, setShippingMethod] = useState<"standard" | "priority">("standard");

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

  const couponDiscount = useMemo(() => {
    if (appliedCoupon === "COINCART10") return total * 0.1;
    return 0;
  }, [appliedCoupon, total]);

  const shippingCost = useMemo(() => (shippingMethod === "standard" ? 9.9 : 19.9), [shippingMethod]);
  const grandTotal = useMemo(() => Math.max(0, total - couponDiscount) + shippingCost, [couponDiscount, shippingCost, total]);

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

      <div style={{ borderTop: "1px solid var(--line)", marginTop: 10, paddingTop: 10, display: "grid", gap: 8 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Coupon code</span>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10, flex: 1 }}
            />
            <button
              className="button secondary"
              onClick={() => setAppliedCoupon(couponCode.trim().toUpperCase() || null)}
              type="button"
            >
              Apply
            </button>
          </div>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Shipping method</span>
          <select
            value={shippingMethod}
            onChange={(e) => setShippingMethod(e.target.value as "standard" | "priority")}
            style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10 }}
          >
            <option value="standard">Standard (2-4 days) - 9.90</option>
            <option value="priority">Priority (1-2 days) - 19.90</option>
          </select>
        </label>
      </div>

      <h3>Subtotal: {total.toFixed(2)} {currency}</h3>
      <p className="small">Shipping: {shippingCost.toFixed(2)} {currency}</p>
      <p className="small">Coupon: -{couponDiscount.toFixed(2)} {currency}</p>
      <h3>Total: {grandTotal.toFixed(2)} {currency}</h3>
      <Link className="button" href={`/checkout?currency=${currency}`}>
        Continue to checkout
      </Link>
    </div>
  );
}
