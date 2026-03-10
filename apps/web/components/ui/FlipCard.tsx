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

  const priceBlock = hasPromo ? (
    <>
      <span style={{ textDecoration: "line-through", opacity: 0.55, marginRight: 6 }}>
        {price.toFixed(2)} {currency}
      </span>
      <span>{displayPrice.toFixed(2)} {currency}</span>
    </>
  ) : (
    <>{displayPrice.toFixed(2)} {currency}</>
  );

  return (
    <Link href={href} style={{ display: "block", textDecoration: "none" }}>
      <div className="flip-card">
        <div className="flip-card-inner">
          {/* Front */}
          <div className="flip-card-front">
            {imageUrl ? (
              <img
              src={imageUrl}
              alt={name}
              className="product-card-img"
              width={1600}
              height={1000}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              loading="lazy"
              decoding="async"
                fetchPriority="low"
              />
            ) : (
              <div className="product-card-img-placeholder" />
            )}
            <div className="product-card-body">
              <div className="card-title" style={{ marginBottom: 0, fontSize: "0.9375rem" }}>{name}</div>
            </div>
            <div className="product-card-footer">
              <span className="product-card-price">{priceBlock}</span>
              <span className={stockQty > 0 ? "badge badge-green" : "badge badge-error"}>
                {stockQty > 0 ? "In Stock" : "Out of Stock"}
              </span>
            </div>
          </div>

          {/* Back */}
          <div className="flip-card-back">
            <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text)", lineHeight: 1.3 }}>{name}</p>
            {sku && <p className="caption" style={{ marginTop: 2 }}>{sku}</p>}
            <p className="flip-card-desc">
              {description || "Premium product. View details for full specifications."}
            </p>
            <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--accent)" }}>
              {priceBlock}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
