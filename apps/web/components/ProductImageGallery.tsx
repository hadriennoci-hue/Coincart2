"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
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
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    setBrokenUrls({});
    setActiveIndex(0);
  }, [images, alt]);

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setLightboxOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen]);

  const activeImage = gallery[activeIndex] ?? gallery[0] ?? fallbackImage;
  const activeSrc = brokenUrls[activeImage] ? fallbackImage : activeImage;

  const handleMarkBroken = useCallback(
    (url: string) => setBrokenUrls((prev) => ({ ...prev, [url]: true })),
    [],
  );

  if (!activeImage) {
    return <div className="product-card-img-placeholder" style={{ aspectRatio: "16/10", borderRadius: 16 }} />;
  }

  // Up to 8 thumbnails, 4 per row (wraps to second row if > 4)
  const thumbs = gallery.slice(0, 8);
  const cols = Math.min(thumbs.length, 4);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Main image — click to open lightbox */}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          style={{
            padding: 0,
            border: "1px solid var(--border)",
            borderRadius: 16,
            background: "var(--surface-2)",
            cursor: "zoom-in",
            overflow: "hidden",
            display: "block",
            width: "100%",
          }}
          aria-label="Zoom image"
        >
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
              objectFit: "contain",
              display: "block",
            }}
            onError={() => handleMarkBroken(activeImage)}
          />
        </button>

        {/* Thumbnails — 4 per row, second row when > 4 */}
        {thumbs.length > 1 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gap: 8,
            }}
          >
            {thumbs.map((url, index) => (
              <button
                key={`${url}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                style={{
                  border: index === activeIndex ? "2px solid var(--primary)" : "1px solid var(--border)",
                  borderRadius: 8,
                  padding: 0,
                  background: "#fff",
                  overflow: "hidden",
                  cursor: "pointer",
                  height: 84,
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
                  onError={() => handleMarkBroken(url)}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox — zoom overlay */}
      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(0,0,0,0.88)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Image zoom"
        >
          <img
            src={activeSrc}
            alt={alt}
            style={{
              maxWidth: "min(200%, 95vw)",
              maxHeight: "90vh",
              objectFit: "contain",
              borderRadius: 8,
              pointerEvents: "none",
              width: "min(200%, 95vw)",
            }}
            onError={() => handleMarkBroken(activeImage)}
          />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
            aria-label="Close zoom"
            style={{
              position: "fixed",
              top: 20,
              right: 24,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "50%",
              width: 40,
              height: 40,
              fontSize: "1.2rem",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
