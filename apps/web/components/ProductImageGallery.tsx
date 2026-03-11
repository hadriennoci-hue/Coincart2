"use client";

import { useMemo, useState } from "react";

type ProductImageGalleryProps = {
  images: string[];
  alt: string;
};

export function ProductImageGallery({ images, alt }: ProductImageGalleryProps) {
  const gallery = useMemo(() => images.filter((x) => typeof x === "string" && x.length > 0), [images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = gallery[activeIndex] ?? gallery[0] ?? null;

  if (!activeImage) {
    return <div className="product-card-img-placeholder" style={{ aspectRatio: "16/10", borderRadius: 16 }} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <img
        src={activeImage}
        alt={alt}
        width={1600}
        height={1000}
        sizes="(max-width: 768px) 100vw, 55vw"
        style={{
          width: "100%",
          maxHeight: 400,
          aspectRatio: "16/10",
          objectFit: "cover",
          borderRadius: 16,
          border: "1px solid var(--border)",
          display: "block",
        }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 8 }}>
        {gallery.map((url, index) => (
          <button
            key={`${url}-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
            style={{
              border: index === activeIndex ? "2px solid var(--primary)" : "1px solid var(--border)",
              borderRadius: 10,
              padding: 0,
              background: "transparent",
              overflow: "hidden",
              cursor: "pointer",
            }}
            aria-label={`Show image ${index + 1}`}
          >
            <img
              src={url}
              alt={`${alt} ${index + 1}`}
              width={320}
              height={200}
              loading="lazy"
              decoding="async"
              style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover", display: "block" }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
