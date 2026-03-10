"use client";

import Link from "next/link";

interface FlipCardProps {
  name: string;
  imageUrl?: string | null;
  price: number;
  promoPrice?: number | null;
  currency: string;
  stockQty: number;
  description?: string | null;
  sku?: string;
  href: string;
}

export function FlipCard({
  name,
  imageUrl,
  price,
  promoPrice,
  currency,
  stockQty,
  description,
  sku,
  href,
}: FlipCardProps) {
  const hasPromo = typeof promoPrice === "number" && promoPrice > 0 && promoPrice < price;
  const displayPrice = hasPromo ? promoPrice : price;

  return (
    <div className="flip-card">
      <div className="flip-card-inner">
        <div className="flip-card-front">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="product-card-img" />
          ) : (
            <div className="product-card-img-placeholder" />
          )}
          <div className="product-card-body">
            <div className="card-title" style={{ marginBottom: 4, fontSize: "0.9375rem" }}>
              {name}
            </div>
            {sku && <div className="caption">{sku}</div>}
          </div>
          <div className="product-card-footer">
            <span className="product-card-price">
              {hasPromo ? (
                <>
                  <span style={{ textDecoration: "line-through", opacity: 0.65, marginRight: 8 }}>
                    {price.toFixed(2)} {currency}
                  </span>
                  <span>
                    {displayPrice.toFixed(2)} {currency}
                  </span>
                </>
              ) : (
                <>
                  {displayPrice.toFixed(2)} {currency}
                </>
              )}
            </span>
            <span className={stockQty > 0 ? "badge badge-green" : "badge badge-error"}>
              {stockQty > 0 ? "In Stock" : "Out of Stock"}
            </span>
          </div>
        </div>

        <div className="flip-card-back">
          <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text)", marginBottom: 10, lineHeight: 1.3 }}>
            {name}
          </p>
          <p className="flip-card-desc">
            {description || "Premium product. View details for full specifications."}
          </p>
          <div className="flip-card-back-footer">
            <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--accent)" }}>
              {hasPromo ? (
                <>
                  <span style={{ textDecoration: "line-through", opacity: 0.65, marginRight: 8 }}>
                    {price.toFixed(2)} {currency}
                  </span>
                  <span>
                    {displayPrice.toFixed(2)} {currency}
                  </span>
                </>
              ) : (
                <>
                  {displayPrice.toFixed(2)} {currency}
                </>
              )}
            </span>
            <Link className="btn btn-primary btn-sm" href={href}>
              View Product
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
