"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fmtPrice } from "../../lib/format";
import { buildImageFallback } from "../../lib/imageFallback";

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
  collection?: string | null;
  category?: string | null;
  brand?: string | null;
  cpu?: string | null;
  gpu?: string | null;
  screenSize?: string | null;
  resolution?: string | null;
  maxResolution?: string | null;
  refreshRate?: number | null;
  ramMemory?: number | null;
  ssdSize?: number | null;
  storage?: string | null;
  displayType?: string | null;
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
  collection,
  category,
  brand,
  cpu,
  gpu,
  screenSize,
  resolution,
  maxResolution,
  refreshRate,
  ramMemory,
  ssdSize,
  storage,
  displayType,
}: FlipCardProps) {
  const hasPromo = typeof promoPrice === "number" && promoPrice > 0 && promoPrice < price;
  const displayPrice = hasPromo ? promoPrice : price;
  const normalizedCollection = (collection || "").trim().toLowerCase();
  const normalizedCategory = (category || "").trim().toLowerCase();
  const isLaptop =
    normalizedCollection === "laptops" || normalizedCategory.includes("laptop");
  const isDisplay =
    normalizedCollection === "displays" ||
    normalizedCategory.includes("display") ||
    normalizedCategory.includes("monitor");

  const priceBlock = hasPromo ? (
    <>
      <span style={{ textDecoration: "line-through", opacity: 0.55, marginRight: 6 }}>
        {fmtPrice(price, currency)}
      </span>
      <span>{fmtPrice(displayPrice, currency)}</span>
    </>
  ) : (
    <>{fmtPrice(displayPrice, currency)}</>
  );
  const fallbackImage = useMemo(
    () => buildImageFallback(sku || name),
    [name, sku],
  );
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl || fallbackImage);

  useEffect(() => {
    setCurrentImageUrl(imageUrl || fallbackImage);
  }, [fallbackImage, imageUrl]);

  return (
    <Link href={href} style={{ display: "block", textDecoration: "none" }}>
      <div className="flip-card">
        <div className="flip-card-inner">
          {/* Front */}
          <div className="flip-card-front">
            {currentImageUrl ? (
              <img
              src={currentImageUrl}
              alt={name}
              className="product-card-img"
              width={1600}
              height={1000}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              loading="lazy"
              decoding="async"
                fetchPriority="low"
                onError={() => setCurrentImageUrl(fallbackImage)}
              />
            ) : (
              <div className="product-card-img-placeholder" />
            )}
            <div className="product-card-body">
              <div className="card-title" style={{ marginBottom: 0, fontSize: "0.875rem" }}>{name}</div>
            </div>
            <div className="product-card-footer">
              <span className="product-card-price" style={hasPromo ? { fontSize: "0.78rem", fontWeight: 700 } : undefined}>{priceBlock}</span>
              <span className={stockQty > 0 ? "badge badge-green" : "badge badge-error"}>
                {stockQty > 0 ? "In Stock" : "Out of Stock"}
              </span>
            </div>
          </div>

          {/* Back */}
          <div className="flip-card-back">
            <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text)", lineHeight: 1.3, margin: 0 }}>{name}</p>
            {sku && <p className="caption" style={{ margin: "2px 0 0" }}>{sku}</p>}
            {isLaptop ? (
              <div className="flip-card-specs">
                {screenSize && <div className="flip-spec-row"><span>Screen</span><span>{screenSize}</span></div>}
                {(resolution || maxResolution) && <div className="flip-spec-row"><span>Resolution</span><span>{resolution || maxResolution}</span></div>}
                {cpu && <div className="flip-spec-row"><span>CPU</span><span>{cpu}</span></div>}
                {ramMemory && <div className="flip-spec-row"><span>RAM</span><span>{ramMemory} GB</span></div>}
                {(ssdSize || storage) && <div className="flip-spec-row"><span>Storage</span><span>{ssdSize ? `${ssdSize} GB SSD` : storage}</span></div>}
                {gpu && <div className="flip-spec-row"><span>GPU</span><span>{gpu}</span></div>}
                {brand && <div className="flip-spec-row"><span>Brand</span><span>{brand}</span></div>}
              </div>
            ) : isDisplay ? (
              <div className="flip-card-specs">
                {screenSize && <div className="flip-spec-row"><span>Screen</span><span>{screenSize}</span></div>}
                {(resolution || maxResolution) && <div className="flip-spec-row"><span>Resolution</span><span>{resolution || maxResolution}</span></div>}
                {refreshRate && <div className="flip-spec-row"><span>Refresh</span><span>{refreshRate} Hz</span></div>}
                {displayType && <div className="flip-spec-row"><span>Panel</span><span>{displayType}</span></div>}
              </div>
            ) : (
              <p className="flip-card-desc">
                {description || "Premium product. View details for full specifications."}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
