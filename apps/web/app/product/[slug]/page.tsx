import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AddToCartButton } from "../../../components/AddToCartButton";
import { ProductImageGallery } from "../../../components/ProductImageGallery";
import { fetchProductBySlug, type Currency } from "../../../lib/api";

export const runtime = 'edge';

type ProductPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ currency?: Currency }>;
};

export async function generateMetadata({ params, searchParams }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { currency = "EUR" } = await searchParams;
  const product = await fetchProductBySlug(slug, currency);
  if (!product) {
    return { title: "Product not found" };
  }

  return {
    title: product.name,
    description: product.description || `${product.name} - pay with crypto on Coincart.`,
    openGraph: {
      title: product.name,
      description: product.description || `${product.name} - pay with crypto on Coincart.`,
      type: "website",
    },
  };
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { slug } = await params;
  const { currency = "EUR" } = await searchParams;
  const product = await fetchProductBySlug(slug, currency);
  if (!product) return notFound();
  const imageGallery =
    Array.isArray(product.imageUrls) && product.imageUrls.length > 0
      ? product.imageUrls
      : product.imageUrl
        ? [product.imageUrl]
        : [];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://coincart-web.pages.dev";
  const productUrl = `${siteUrl}/product/${product.slug}?currency=${currency}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: imageGallery.length > 0 ? imageGallery : undefined,
    sku: product.sku,
    description: product.description || undefined,
    category: product.category || undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency,
      price: product.price.toFixed(2),
      availability:
        product.stockQty > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: productUrl,
    },
  };

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Three-column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "38% 1fr 260px",
          gap: 40,
          marginBottom: 40,
          alignItems: "start",
        }}
      >
        {/* Col 1: Product Image */}
        <div>
          <ProductImageGallery images={imageGallery} alt={product.name} />
        </div>

        {/* Col 2: Title, SKU, Description */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {product.category && (
            <span className="badge badge-teal" style={{ alignSelf: "flex-start" }}>
              {product.category}
            </span>
          )}

          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "var(--text)",
              margin: 0,
              lineHeight: 1.25,
            }}
          >
            {product.name}
          </h1>

          <div className="caption">SKU: {product.sku}</div>

          {product.description && (
            <p
              style={{
                color: "var(--muted)",
                lineHeight: 1.6,
                margin: 0,
                fontSize: "0.9rem",
              }}
            >
              {product.description}
            </p>
          )}
        </div>

        {/* Col 3: Price, Stock, Add to Cart */}
        <div
          className="surface"
          style={{ display: "flex", flexDirection: "column", gap: 16, padding: 20 }}
        >
          <div>
            <span
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "var(--accent)",
                display: "block",
              }}
            >
              {product.price.toFixed(2)} {product.currency}
            </span>
            <span
              className={
                product.stockQty > 0 ? "badge badge-green" : "badge badge-error"
              }
              style={{ marginTop: 8, display: "inline-block" }}
            >
              {product.stockQty > 0 ? "In Stock" : "Out of Stock"}
            </span>
          </div>

          <div className="divider" />

          <AddToCartButton sku={product.sku} />
        </div>
      </div>

      {/* Specs Table */}
      <div className="surface">
        <h2 className="card-title" style={{ marginBottom: 20 }}>
          Product Specifications
        </h2>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <tbody>
            {[
              { label: "CPU", value: product.cpu },
              { label: "GPU", value: product.gpu },
              { label: "Screen Size", value: product.screenSize },
              { label: "Max Resolution", value: product.maxResolution },
              {
                label: "Refresh Rate",
                value: product.refreshRate ? `${product.refreshRate}Hz` : null,
              },
              {
                label: "RAM",
                value: product.ramMemory ? `${product.ramMemory} GB` : null,
              },
              {
                label: "SSD",
                value: product.ssdSize ? `${product.ssdSize} GB` : null,
              },
              { label: "Keyboard Layout", value: product.keyboardLayout },
              { label: "Category", value: product.category },
            ]
              .filter((row) => row.value)
              .map((row, i, arr) => (
                <tr
                  key={row.label}
                  style={{
                    borderBottom:
                      i < arr.length - 1
                        ? "1px solid var(--border)"
                        : "none",
                  }}
                >
                  <td
                    style={{
                      padding: "12px 0",
                      width: "40%",
                      color: "var(--muted)",
                      fontSize: "0.875rem",
                    }}
                  >
                    {row.label}
                  </td>
                  <td
                    style={{
                      padding: "12px 0",
                      color: "var(--text)",
                      fontWeight: 500,
                    }}
                  >
                    {row.value}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
