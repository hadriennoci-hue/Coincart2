import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AddToCartButton } from "../../../components/AddToCartButton";
import { fetchProductBySlug, type Currency } from "../../../lib/api";

export const runtime = 'edge';

type ProductPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ currency?: Currency }>;
};

export async function generateMetadata({ params, searchParams }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { currency = "USD" } = await searchParams;
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
  const { currency = "USD" } = await searchParams;
  const product = await fetchProductBySlug(slug, currency);
  if (!product) return notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://coincart-web.pages.dev";
  const productUrl = `${siteUrl}/product/${product.slug}?currency=${currency}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.description || undefined,
    category: product.category || undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency,
      price: product.price.toFixed(2),
      availability: product.stockQty > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: productUrl,
    },
  };

  return (
    <div className="card">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          style={{ width: "100%", maxWidth: 760, aspectRatio: "16/10", objectFit: "cover", borderRadius: 14, border: "1px solid var(--line)", marginBottom: 12 }}
        />
      ) : null}
      <p className="small">SKU: {product.sku}</p>
      <h2>{product.name}</h2>
      <p>{product.description || "No description"}</p>
      <p>
        <b>
          {product.price.toFixed(2)} {product.currency}
        </b>
      </p>
      <p className="small">Stock: {product.stockQty}</p>
      <div className="small" style={{ display: "grid", gap: 4, marginBottom: 10 }}>
        {product.category ? <span>Category: {product.category}</span> : null}
        {product.cpu ? <span>CPU: {product.cpu}</span> : null}
        {product.gpu ? <span>GPU: {product.gpu}</span> : null}
        {product.screenSize ? <span>Screen: {product.screenSize}</span> : null}
        {product.maxResolution ? <span>Max resolution: {product.maxResolution}</span> : null}
        {product.refreshRate ? <span>Refresh rate: {product.refreshRate}Hz</span> : null}
        {product.ramMemory ? <span>RAM: {product.ramMemory}GB</span> : null}
        {product.ssdSize ? <span>SSD: {product.ssdSize}GB</span> : null}
        {product.keyboardLayout ? <span>Keyboard: {product.keyboardLayout}</span> : null}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <AddToCartButton sku={product.sku} />
        <Link className="button secondary" href={`/cart?currency=${currency}`}>
          View cart
        </Link>
      </div>
    </div>
  );
}
