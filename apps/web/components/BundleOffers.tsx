"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { addToCart, getCart, type CartLine } from "../lib/cart";
import type { Product } from "../lib/api";
import { fmtPrice } from "../lib/format";
import type { BundleProductOffer } from "../lib/bundles";
import { SHIPPING_FEE_EUR, SHIPPING_FREE_THRESHOLD_EUR, calculateShippingCost } from "../lib/shipping";
import { calculateBundleDiscount } from "@coincart/types";

const normalizeSku = (value: string) => value.trim().toUpperCase();

const mergeCartLines = (lines: CartLine[], additions: Array<{ sku: string; snapshotPrice: number }>) => {
  const next = new Map(
    lines.map((line) => [
      normalizeSku(line.sku),
      { ...line },
    ]),
  );

  for (const addition of additions) {
    const key = normalizeSku(addition.sku);
    const existing = next.get(key);
    if (existing) {
      existing.quantity += 1;
      if (typeof existing.snapshot?.price !== "number") {
        existing.snapshot = { ...existing.snapshot, price: addition.snapshotPrice };
      }
      continue;
    }
    next.set(key, {
      sku: addition.sku,
      quantity: 1,
      snapshot: { price: addition.snapshotPrice },
    });
  }

  return Array.from(next.values());
};

const getCartSubtotalAfterBundles = (lines: CartLine[], currency: Product["currency"]) => {
  const pricedLines = lines.map((line) => ({
    sku: line.sku,
    quantity: line.quantity,
    unitPrice:
      typeof line.snapshot?.price === "number" && Number.isFinite(line.snapshot.price)
        ? line.snapshot.price
        : 0,
  }));
  const subtotal = pricedLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const bundleDiscount = calculateBundleDiscount(pricedLines, currency).totalSavings;
  return Math.max(0, Number((subtotal - bundleDiscount).toFixed(2)));
};

export function BundleOffers({
  primaryProduct,
  offers,
}: {
  primaryProduct: Product;
  offers: BundleProductOffer[];
}) {
  const [addingBundleId, setAddingBundleId] = useState<string | null>(null);
  const [cartLines, setCartLines] = useState<CartLine[]>([]);

  useEffect(() => {
    const sync = () => setCartLines(getCart());
    sync();
    window.addEventListener("cartupdate", sync);
    return () => window.removeEventListener("cartupdate", sync);
  }, []);

  if (offers.length === 0) return null;

  return (
    <div className="surface bundle-section">
      <div className="bundle-section-head">
        <div className="small" style={{ color: "var(--muted)" }}>Bundle & save</div>
      </div>

      <div className="bundle-offers">
        {offers.map((offer) => {
          const secondary = offer.bundleProduct;
          if (!secondary) return null;
          const currentSubtotalAfterBundles = getCartSubtotalAfterBundles(cartLines, primaryProduct.currency);
          const nextCartLines = mergeCartLines(cartLines, [
            { sku: primaryProduct.sku, snapshotPrice: primaryProduct.price },
            { sku: secondary.sku, snapshotPrice: secondary.price },
          ]);
          const nextSubtotalAfterBundles = getCartSubtotalAfterBundles(nextCartLines, primaryProduct.currency);
          const currentShippingCost = calculateShippingCost(primaryProduct.currency, currentSubtotalAfterBundles);
          const nextShippingCost = calculateShippingCost(primaryProduct.currency, nextSubtotalAfterBundles);
          const shippingGain = Math.max(0, Number((currentShippingCost - nextShippingCost).toFixed(2)));
          const totalDisplayedSavings = Number((offer.savings[primaryProduct.currency] + shippingGain).toFixed(2));
          const savingsLabel = fmtPrice(totalDisplayedSavings, primaryProduct.currency);
          const bundlePrice = Math.max(
            0,
            Number((primaryProduct.price + secondary.price - totalDisplayedSavings).toFixed(2)),
          );
          const adding = addingBundleId === offer.id;
          const includesFreeShipping = shippingGain >= SHIPPING_FEE_EUR - 0.01;

          return (
            <div key={offer.id} className="bundle-card">
              <div className="bundle-card-items">
                <Link className="bundle-card-item bundle-card-link" href={`/product/${primaryProduct.slug}?currency=${primaryProduct.currency}`}>
                  <div className="bundle-card-thumb">
                    {primaryProduct.imageUrl ? <img src={primaryProduct.imageUrl} alt={primaryProduct.name} /> : null}
                  </div>
                  <div className="bundle-card-copy">
                    <div className="bundle-card-name">{primaryProduct.name}</div>
                    <div className="caption">{primaryProduct.sku}</div>
                  </div>
                </Link>

                <div className="bundle-card-plus">+</div>

                <Link className="bundle-card-item bundle-card-link" href={`/product/${secondary.slug}?currency=${primaryProduct.currency}`}>
                  <div className="bundle-card-thumb">
                    {secondary.imageUrl ? <img src={secondary.imageUrl} alt={secondary.name} /> : null}
                  </div>
                  <div className="bundle-card-copy">
                    <div className="bundle-card-name">{secondary.name}</div>
                    <div className="caption">{secondary.sku}</div>
                  </div>
                </Link>
              </div>

              <div className="bundle-card-footer">
                <div>
                  <div className="bundle-card-save">Save {savingsLabel}</div>
                  {includesFreeShipping ? (
                    <div className="bundle-card-shipping-note">(includes free shipping)</div>
                  ) : null}
                  <div className="bundle-card-price">
                    <span>{fmtPrice(bundlePrice, primaryProduct.currency)}</span>
                    <span className="bundle-card-price-old">
                      (instead of {fmtPrice(primaryProduct.price + secondary.price, primaryProduct.currency)})
                    </span>
                  </div>
                  {!includesFreeShipping ? (
                    <div className="bundle-card-shipping">Add this bundle and unlock free shipping over {SHIPPING_FREE_THRESHOLD_EUR} EUR</div>
                  ) : null}
                </div>
                <button
                  className="btn btn-primary"
                  disabled={adding || secondary.stockQty <= 0 || primaryProduct.stockQty <= 0}
                  onClick={() => {
                    addToCart(primaryProduct.sku, 1, {
                      name: primaryProduct.name,
                      imageUrl: primaryProduct.imageUrl,
                      price: primaryProduct.price,
                      currency: primaryProduct.currency,
                    });
                    addToCart(secondary.sku, 1, {
                      name: secondary.name,
                      imageUrl: secondary.imageUrl,
                      price: secondary.price,
                      currency: secondary.currency,
                    });
                    setAddingBundleId(offer.id);
                    toast.success("Bundle added to cart", {
                      description: `${primaryProduct.sku} + ${secondary.sku}`,
                      duration: 3000,
                    });
                    window.setTimeout(() => setAddingBundleId(null), 1500);
                  }}
                >
                  {adding ? "Added" : `Add bundle - Save ${savingsLabel}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
