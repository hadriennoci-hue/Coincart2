import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "../../../components/AddToCartButton";
import { fetchProductBySlug, type Currency } from "../../../lib/api";

export const runtime = 'edge';

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ currency?: Currency }>;
}) {
  const { slug } = await params;
  const { currency = "USD" } = await searchParams;
  const product = await fetchProductBySlug(slug, currency);
  if (!product) return notFound();

  return (
    <div className="card">
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
