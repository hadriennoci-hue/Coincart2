"use client";

import * as React from "react";

interface Brand {
  name: string;
  logo: string;
  height?: number;
}

interface BrandsGridProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  brands: Brand[];
}

export const BrandsGrid = React.forwardRef<HTMLDivElement, BrandsGridProps>(
  ({ title, brands, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          padding: "32px 0",
          ...style,
        }}
        {...props}
      >
        {title && (
          <p
            style={{
              textAlign: "center",
              fontWeight: 500,
              color: "var(--muted)",
              fontSize: "0.875rem",
              marginBottom: 28,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {title}
          </p>
        )}

        <div
          className="brands-grid-logos"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: 40,
          }}
        >
          {brands.map((brand) => (
            <div
              key={brand.name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px 16px",
              }}
            >
              <img
                src={brand.logo}
                alt={`${brand.name} logo`}
                style={{
                  height: brand.height ?? 48,
                  width: "auto",
                  maxWidth: 200,
                  objectFit: "contain",
                  filter: "brightness(0) invert(1)",
                  opacity: 0.65,
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.65")}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }
);

BrandsGrid.displayName = "BrandsGrid";
