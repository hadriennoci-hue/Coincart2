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
    return items.reduce(
      (acc, item) => acc + item.price * (map.get(item.sku) || 0),
      0,
    );
  }, [items, lines]);

  const couponDiscount = useMemo(() => {
    if (appliedCoupon === "COINCART10") return total * 0.1;
    return 0;
  }, [appliedCoupon, total]);

  const shippingCost = useMemo(
    () => (currency === "EUR" ? 10 : 11),
    [currency],
  );
  const grandTotal = useMemo(
    () => Math.max(0, total - couponDiscount) + shippingCost,
    [couponDiscount, shippingCost, total],
  );

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "60% 40%",
          gap: 32,
          alignItems: "start",
        }}
      >
        {/* Left: Cart Items */}
        <div>
          <h1 className="page-title" style={{ marginBottom: 24 }}>
            Your Cart
          </h1>

          {items.length === 0 ? (
            <div
              className="surface"
              style={{ textAlign: "center", padding: 48 }}
            >
              <div style={{ fontSize: "3rem", marginBottom: 16 }}>🛒</div>
              <h3 style={{ marginBottom: 8 }}>Your cart is empty</h3>
              <p className="small" style={{ marginBottom: 20 }}>
                Browse our catalog and add items to get started.
              </p>
              <Link className="btn btn-primary" href="/">
                Browse Products
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 0,
                border: "1px solid var(--border)",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {items.map((item, index) => {
                const qty = lines.find((l) => l.sku === item.sku)?.quantity || 0;
                return (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "16px 20px",
                      background: "var(--surface)",
                      borderBottom:
                        index < items.length - 1
                          ? "1px solid var(--border)"
                          : "none",
                    }}
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        style={{
                          width: 80,
                          height: 56,
                          objectFit: "cover",
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 80,
                          height: 56,
                          background: "var(--surface-2)",
                          borderRadius: 8,
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "var(--text)",
                          marginBottom: 4,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.name}
                      </div>
                      <div className="caption">{item.sku}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "var(--accent)",
                          marginBottom: 4,
                        }}
                      >
                        {qty} &times; {item.price.toFixed(2)} {currency}
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          color: "var(--text)",
                          marginBottom: 8,
                        }}
                      >
                        {(qty * item.price).toFixed(2)} {currency}
                      </div>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          removeFromCart(item.sku);
                          const now = getCart();
                          setLines(now);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Order Summary */}
        <div className="surface" style={{ position: "sticky", top: 24 }}>
          <h2 className="card-title" style={{ marginBottom: 20 }}>
            Order Summary
          </h2>

          {/* Currency Toggle */}
          <div style={{ marginBottom: 20 }}>
            <div className="caption" style={{ marginBottom: 8 }}>
              Currency
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className={`btn btn-sm ${currency === "USD" ? "btn-teal" : "btn-ghost"}`}
                onClick={() => setCurrency("USD")}
                style={{ flex: 1 }}
              >
                USD
              </button>
              <button
                className={`btn btn-sm ${currency === "EUR" ? "btn-teal" : "btn-ghost"}`}
                onClick={() => setCurrency("EUR")}
                style={{ flex: 1 }}
              >
                EUR
              </button>
            </div>
          </div>

          <div className="divider" style={{ marginBottom: 20 }} />

          {/* Coupon */}
          <div style={{ marginBottom: 20 }}>
            <label className="form-label">
              Coupon Code
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="input"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="e.g. COINCART10"
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-ghost"
                  onClick={() =>
                    setAppliedCoupon(
                      couponCode.trim().toUpperCase() || null,
                    )
                  }
                  type="button"
                >
                  Apply
                </button>
              </div>
            </label>
            {appliedCoupon === "COINCART10" && (
              <div className="small text-success" style={{ marginTop: 6 }}>
                ✓ Coupon COINCART10 applied — 10% off
              </div>
            )}
            {appliedCoupon && appliedCoupon !== "COINCART10" && (
              <div className="small text-error" style={{ marginTop: 6 }}>
                Invalid coupon code
              </div>
            )}
          </div>

          <div className="divider" style={{ marginBottom: 16 }} />

          {/* Totals */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="small" style={{ color: "var(--muted)" }}>Subtotal</span>
              <span style={{ fontWeight: 500 }}>
                {total.toFixed(2)} {currency}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="small" style={{ color: "var(--muted)" }}>Shipping</span>
              <span style={{ fontWeight: 500 }}>
                {shippingCost.toFixed(2)} {currency}
              </span>
            </div>
            {couponDiscount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="small" style={{ color: "var(--accent)" }}>Discount</span>
                <span style={{ fontWeight: 500, color: "var(--accent)" }}>
                  -{couponDiscount.toFixed(2)} {currency}
                </span>
              </div>
            )}
          </div>

          <div className="divider" style={{ marginBottom: 16 }} />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <span style={{ fontWeight: 700, fontSize: "1rem" }}>Total</span>
            <span
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "var(--accent)",
              }}
            >
              {grandTotal.toFixed(2)} {currency}
            </span>
          </div>

          <Link
            className="btn btn-primary btn-full btn-lg"
            href={`/checkout?currency=${currency}`}
          >
            Continue to Checkout
          </Link>

          <div className="caption" style={{ marginTop: 12, textAlign: "center" }}>
            🚚 DHL Standard · 5 business days · 10 EUR flat rate
          </div>
        </div>
      </div>
    </div>
  );
}
