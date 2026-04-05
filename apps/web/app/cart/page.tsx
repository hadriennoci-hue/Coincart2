"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchProductsBySkus, type Currency, type Product } from "../../lib/api";
import { getBundleDiscountForCart } from "../../lib/bundles";
import { fmtPrice } from "../../lib/format";
import { decrementFromCart, getCart, type CartLine } from "../../lib/cart";
import { computeCouponDiscount, getStoredCoupon, isSupportedCoupon, setStoredCoupon } from "../../lib/coupon";
import { buildImageFallback } from "../../lib/imageFallback";
import { calculateShippingCost, ESTIMATED_DELIVERY_DAYS, SHIPPING_FREE_THRESHOLD_EUR, SHIPPING_METHOD } from "../../lib/shipping";

const normalizeSku = (value: string) => value.trim().toUpperCase();

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
    const syncCoupon = () => {
      const stored = getStoredCoupon();
      setAppliedCoupon(stored);
      setCouponCode(stored || "");
    };
    syncCoupon();
    window.addEventListener("couponupdate", syncCoupon);
    return () => window.removeEventListener("couponupdate", syncCoupon);
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
          lines.map((x) => x.sku.trim()),
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
    () => new Map(items.map((item) => [normalizeSku(item.sku), item])),
    [items],
  );

  const displayRows = useMemo(
    () =>
      lines.map((line) => {
        const product = itemBySku.get(normalizeSku(line.sku));
        const livePrice =
          typeof product?.price === "number" && Number.isFinite(product.price) && product.price > 0
            ? product.price
            : null;
        const snapshotPrice =
          typeof line.snapshot?.price === "number" &&
          Number.isFinite(line.snapshot.price) &&
          line.snapshot.price > 0
            ? line.snapshot.price
            : null;
        const unitPrice = livePrice ?? snapshotPrice ?? 0;
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

  const bundleDiscount = useMemo(() => {
    return getBundleDiscountForCart(lines, itemBySku, currency).totalSavings;
  }, [currency, itemBySku, lines]);

  const discountedSubtotal = useMemo(
    () => Math.max(0, total - bundleDiscount),
    [bundleDiscount, total],
  );

  const couponDiscount = useMemo(() => {
    return computeCouponDiscount(discountedSubtotal, appliedCoupon);
  }, [appliedCoupon, discountedSubtotal]);

  const payableSubtotal = useMemo(
    () => Math.max(0, discountedSubtotal - couponDiscount),
    [couponDiscount, discountedSubtotal],
  );

  const shippingCost = useMemo(
    () => calculateShippingCost(currency, discountedSubtotal),
    [currency, discountedSubtotal],
  );
  const grandTotal = useMemo(
    () => payableSubtotal + shippingCost,
    [payableSubtotal, shippingCost],
  );

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
      <div className="cart-layout">
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
              <div style={{ fontSize: "3rem", marginBottom: 16 }}>Cart</div>
              <h3 style={{ marginBottom: 8 }}>Your cart is empty</h3>
              <p className="small" style={{ marginBottom: 20 }}>
                Browse our catalog and add items to get started.
              </p>
              <Link className="btn btn-primary" href="/">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="cart-list">
              {displayRows.map((row, index) => {
                return (
                  <div key={row.id} className="cart-line" style={{ borderBottom: index < displayRows.length - 1 ? "1px solid var(--border)" : "none" }}>
                    {row.imageUrl ? (
                      <img
                        src={row.imageUrl}
                        alt={row.name}
                        onError={(event) => {
                          event.currentTarget.src = buildImageFallback(row.sku || row.name);
                        }}
                        className="cart-line-image"
                      />
                    ) : (
                      <div className="cart-line-image cart-line-image--placeholder" />
                    )}
                    <div className="cart-line-main">
                      <div className="cart-line-name">
                        {row.name}
                      </div>
                      <div className="caption">{row.sku}</div>
                    </div>
                    <div className="cart-line-meta">
                      <div className="cart-line-unit-price">
                        {row.quantity} &times; {fmtPrice(row.unitPrice, currency)}
                      </div>
                      <div className="cart-line-total">
                        {fmtPrice(row.lineTotal, currency)}
                      </div>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          decrementFromCart(row.sku, 1);
                          const now = getCart();
                          setLines(now);
                        }}
                      >
                        Remove 1
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
        <div className="surface cart-summary">
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
                  placeholder="Enter coupon code"
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-ghost"
                  onClick={() => setStoredCoupon(couponCode)}
                  type="button"
                >
                  Apply
                </button>
              </div>
            </label>
            {isSupportedCoupon(appliedCoupon) && (
              <div className="small text-success" style={{ marginTop: 6 }}>
                Coupon COINCART5 applied - 5% off
              </div>
            )}
            {appliedCoupon && !isSupportedCoupon(appliedCoupon) && (
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
                {shippingCost === 0 ? "Free" : fmtPrice(shippingCost, currency)}
              </span>
            </div>
            {bundleDiscount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="small" style={{ color: "var(--accent)" }}>Bundle savings</span>
                <span style={{ fontWeight: 500, color: "var(--accent)" }}>
                  -{fmtPrice(bundleDiscount, currency)}
                </span>
              </div>
            )}
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
            {SHIPPING_METHOD} | {ESTIMATED_DELIVERY_DAYS} business days | Free shipping over {SHIPPING_FREE_THRESHOLD_EUR}€
          </div>
        </div>
      </div>
    </div>
  );
}
