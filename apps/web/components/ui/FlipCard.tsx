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

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const deriveSpecsFromDescription = (description?: string | null) => {
  const text = typeof description === "string" ? stripHtml(description) : "";
  if (!text) return {};

  const cpu = text.match(/((?:AMD|Intel)[^.|]*?Processor[^.]*)/i)?.[1]?.trim() ?? null;
  const gpu = text.match(/((?:NVIDIA|AMD)[^.|]*(?:GeForce|RTX|Radeon)[^.]*)/i)?.[1]?.trim() ?? null;
  const screenSize = text.match(/(\d+(?:[.,]\d+)?)\s*cm\s*\(/i)?.[1]?.replace(",", ".") ?? null;
  const resolution = text.match(/(\d{3,4}\s*x\s*\d{3,4})/i)?.[1]?.replace(/\s+/g, "") ?? null;
  const ramMemory = text.match(/(\d+)\s*GB,\s*(?:DDR|LPDDR)/i)?.[1];
  const storageMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(TB|GB)\s+SSD/i);

  return {
    cpu,
    gpu,
    screenSize,
    resolution,
    ramMemory: ramMemory ? Number(ramMemory) : null,
    storage: storageMatch ? `${storageMatch[1].replace(",", ".")} ${storageMatch[2].toUpperCase()} SSD` : null,
  };
};

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
  const derivedSpecs = deriveSpecsFromDescription(description);
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
  const displayCpu = cpu || derivedSpecs.cpu || null;
  const displayGpu = gpu || derivedSpecs.gpu || null;
  const displayScreenSize = screenSize || derivedSpecs.screenSize || null;
  const displayResolution = resolution || maxResolution || derivedSpecs.resolution || null;
  const displayRamMemory = ramMemory ?? derivedSpecs.ramMemory ?? null;
  const displayStorage = storage || (ssdSize ? `${ssdSize} GB SSD` : null) || derivedSpecs.storage || null;

  const priceBlock = hasPromo ? (
    <>
      <span style={{ textDecoration: "line-through", color: "var(--muted)", marginRight: 6 }}>
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
              <span className="product-card-price">{priceBlock}</span>
              <span className={stockQty > 0 ? "badge badge-green" : "badge badge-error"}>
                {stockQty > 0 ? "In Stock" : "Out of Stock"}
              </span>
            </div>
          </div>

          {/* Back */}
          <div className="flip-card-back">
            <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text)", lineHeight: 1.3, margin: 0 }}>{name}</p>
            {isLaptop ? (
              <div className="flip-card-specs">
                {displayGpu && <div className="flip-spec-row"><span>GPU</span><span>{displayGpu}</span></div>}
                {displayScreenSize && <div className="flip-spec-row"><span>Screen</span><span>{displayScreenSize}</span></div>}
                {displayResolution && <div className="flip-spec-row"><span>Resolution</span><span>{displayResolution}</span></div>}
                {displayCpu && <div className="flip-spec-row"><span>CPU</span><span>{displayCpu}</span></div>}
                {displayRamMemory && <div className="flip-spec-row"><span>RAM</span><span>{displayRamMemory} GB</span></div>}
                {displayStorage && <div className="flip-spec-row"><span>Storage</span><span>{displayStorage}</span></div>}
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
