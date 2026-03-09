import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "../../../components/AddToCartButton";
import { fetchProductBySlug, type Currency } from "../../../lib/api";

export const runtime = "edge";

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
      <div style={{ display: "flex", gap: 10 }}>
        <AddToCartButton sku={product.sku} />
        <Link className="button secondary" href={`/cart?currency=${currency}`}>
          View cart
        </Link>
      </div>
    </div>
  );
}
