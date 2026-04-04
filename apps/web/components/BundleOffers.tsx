"use client";

import { useState } from "react";
import { toast } from "sonner";
import { addToCart } from "../lib/cart";
import type { Product } from "../lib/api";
import { fmtPrice } from "../lib/format";
import type { BundleProductOffer } from "../lib/bundles";

export function BundleOffers({
  primaryProduct,
  offers,
}: {
  primaryProduct: Product;
  offers: BundleProductOffer[];
}) {
  const [addingBundleId, setAddingBundleId] = useState<string | null>(null);

  if (offers.length === 0) return null;

  return (
    <div className="surface bundle-section">
      <div className="bundle-section-head">
        <div>
          <div className="small" style={{ color: "var(--muted)", marginBottom: 6 }}>Bundle & save</div>
          <h2 className="card-title" style={{ margin: 0 }}>Add accessories together</h2>
        </div>
      </div>

      <div className="bundle-offers">
        {offers.map((offer) => {
          const secondary = offer.bundleProduct;
          if (!secondary) return null;
          const bundlePrice = Math.max(
            0,
            Number((primaryProduct.price + secondary.price - offer.savings[primaryProduct.currency]).toFixed(2)),
          );
          const adding = addingBundleId === offer.id;

          return (
            <div key={offer.id} className="bundle-card">
              <div className="bundle-card-items">
                <div className="bundle-card-item">
                  <div className="bundle-card-thumb">
                    {primaryProduct.imageUrl ? <img src={primaryProduct.imageUrl} alt={primaryProduct.name} /> : null}
                  </div>
                  <div className="bundle-card-copy">
                    <div className="bundle-card-name">{primaryProduct.name}</div>
                    <div className="caption">{primaryProduct.sku}</div>
                  </div>
                </div>

                <div className="bundle-card-plus">+</div>

                <div className="bundle-card-item">
                  <div className="bundle-card-thumb">
                    {secondary.imageUrl ? <img src={secondary.imageUrl} alt={secondary.name} /> : null}
                  </div>
                  <div className="bundle-card-copy">
                    <div className="bundle-card-name">{secondary.name}</div>
                    <div className="caption">{secondary.sku}</div>
                  </div>
                </div>
              </div>

              <div className="bundle-card-footer">
                <div>
                  <div className="bundle-card-save">Save {fmtPrice(offer.savings[primaryProduct.currency], primaryProduct.currency)}</div>
                  <div className="bundle-card-price">
                    <span className="bundle-card-price-old">
                      {fmtPrice(primaryProduct.price + secondary.price, primaryProduct.currency)}
                    </span>
                    <span>{fmtPrice(bundlePrice, primaryProduct.currency)}</span>
                  </div>
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
                  {adding ? "Added" : "Add bundle"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
