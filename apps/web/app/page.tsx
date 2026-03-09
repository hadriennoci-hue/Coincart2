import Link from "next/link";
import { fetchProducts, type Currency } from "../lib/api";

export const runtime = 'edge';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ currency?: Currency }>;
}) {
  const { currency = "USD" } = await searchParams;
  const items = await fetchProducts(currency, false);

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Catalog</h2>
        <p className="small">External feed controls products, stock, and featured status.</p>
        <div style={{ display: "flex", gap: 8 }}>
          <Link className="button secondary" href={`/?currency=USD`}>
            USD
          </Link>
          <Link className="button secondary" href={`/?currency=EUR`}>
            EUR
          </Link>
        </div>
      </div>

      <div className="grid">
        {items.map((item) => (
          <Link key={item.id} className="card" href={`/product/${item.slug}?currency=${currency}`}>
            <p className="small">{item.sku}</p>
            <h3>{item.name}</h3>
            <p className="small">In stock: {item.stockQty}</p>
            <p>
              <b>
                {item.price.toFixed(2)} {item.currency}
              </b>
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
