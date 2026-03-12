"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchProductsBySkus, type Currency, type Product } from "../../lib/api";
import { fmtPrice } from "../../lib/format";
import { getCart, removeFromCart, type CartLine } from "../../lib/cart";

export default function CartPage() {
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [items, setItems] = useState<Product[]>([]);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  useEffect(() => {
    const initial = getCart();
    setLines(initial);
  }, []);

  useEffect(() => {
    if (lines.length === 0) {
      setItems([]);
      setIsRefreshing(false);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setIsRefreshing(true);
      try {
        const products = await fetchProductsBySkus(
          lines.map((x) => x.sku),
          currency,
        );
        if (!cancelled) setItems(products);
      } finally {
        if (!cancelled) setIsRefreshing(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [currency, lines]);

  const itemBySku = useMemo(
    () => new Map(items.map((item) => [item.sku, item])),
    [items],
  );

  const displayRows = useMemo(
    () =>
      lines.map((line) => {
        const product = itemBySku.get(line.sku);
        const unitPrice = product?.price ?? line.snapshot?.price ?? 0;
        return {
          sku: line.sku,
          quantity: line.quantity,
          id: product?.id || line.sku,
          name: product?.name || line.snapshot?.name || line.sku,
          imageUrl: product?.imageUrl ?? line.snapshot?.imageUrl ?? null,
          unitPrice,
          lineTotal: unitPrice * line.quantity,
        };
      }),
    [itemBySku, lines],
  );

  const total = useMemo(
    () => displayRows.reduce((acc, row) => acc + row.lineTotal, 0),
    [displayRows],
  );

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

          {lines.length === 0 ? (
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
              {displayRows.map((row, index) => {
                return (
                  <div
                    key={row.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "16px 20px",
                      background: "var(--surface)",
                      borderBottom:
                        index < displayRows.length - 1
                          ? "1px solid var(--border)"
                          : "none",
                    }}
                  >
                    {row.imageUrl ? (
                      <img
                        src={row.imageUrl}
                        alt={row.name}
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
                        {row.name}
                      </div>
                      <div className="caption">{row.sku}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "var(--accent)",
                          marginBottom: 4,
                        }}
                      >
                        {row.quantity} &times; {fmtPrice(row.unitPrice, currency)}
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          color: "var(--text)",
                          marginBottom: 8,
                        }}
                      >
                        {fmtPrice(row.lineTotal, currency)}
                      </div>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          removeFromCart(row.sku);
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
          {lines.length > 0 && isRefreshing && (
            <div className="caption" style={{ marginTop: 8, color: "var(--muted)" }}>
              Updating live prices and stock...
            </div>
          )}
        </div>

        {/* Right: Order Summary */}
        <div className="surface" style={{ position: "sticky", top: 24 }}>
          <h2 className="card-title" style={{ marginBottom: 20 }}>
            Order Summary
          </h2>

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
                {fmtPrice(total, currency)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="small" style={{ color: "var(--muted)" }}>Shipping</span>
              <span style={{ fontWeight: 500 }}>
                {fmtPrice(shippingCost, currency)}
              </span>
            </div>
            {couponDiscount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="small" style={{ color: "var(--accent)" }}>Discount</span>
                <span style={{ fontWeight: 500, color: "var(--accent)" }}>
                  -{fmtPrice(couponDiscount, currency)}
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
              {fmtPrice(grandTotal, currency)}
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
