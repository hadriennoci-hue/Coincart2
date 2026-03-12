"use client";

import { useEffect, useMemo, useState } from "react";
import { buildImageFallback } from "../lib/imageFallback";

type ProductImageGalleryProps = {
  images: string[];
  alt: string;
};

export function ProductImageGallery({ images, alt }: ProductImageGalleryProps) {
  const gallery = useMemo(() => images.filter((x) => typeof x === "string" && x.length > 0), [images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const fallbackImage = useMemo(() => buildImageFallback(alt), [alt]);
  const [brokenUrls, setBrokenUrls] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setBrokenUrls({});
    setActiveIndex(0);
  }, [images, alt]);

  const activeImage = gallery[activeIndex] ?? gallery[0] ?? fallbackImage;
  const activeSrc = brokenUrls[activeImage] ? fallbackImage : activeImage;

  if (!activeImage) {
    return <div className="product-card-img-placeholder" style={{ aspectRatio: "16/10", borderRadius: 16 }} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <img
        src={activeSrc}
        alt={alt}
        width={1600}
        height={1000}
        sizes="(max-width: 768px) 100vw, 55vw"
        style={{
          width: "100%",
          maxHeight: 280,
          aspectRatio: "16/10",
          objectFit: "cover",
          borderRadius: 16,
          border: "1px solid var(--border)",
          display: "block",
        }}
        onError={() => setBrokenUrls((prev) => ({ ...prev, [activeImage]: true }))}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
        {gallery.slice(0, 4).map((url, index) => (
          <button
            key={`${url}-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
            style={{
              border: index === activeIndex ? "2px solid var(--primary)" : "1px solid var(--border)",
              borderRadius: 8,
              padding: 0,
              background: "transparent",
              overflow: "hidden",
              cursor: "pointer",
              height: 56,
              display: "block",
            }}
            aria-label={`Show image ${index + 1}`}
          >
            <img
              src={brokenUrls[url] ? fallbackImage : url}
              alt={`${alt} ${index + 1}`}
              width={320}
              height={200}
              loading="lazy"
              decoding="async"
              onError={() => setBrokenUrls((prev) => ({ ...prev, [url]: true }))}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
