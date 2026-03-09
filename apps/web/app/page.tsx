import Link from "next/link";
import { fetchProducts, type Currency } from "../lib/api";

export const runtime = 'edge';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ currency?: Currency; q?: string }>;
}) {
  const { currency = "USD", q = "" } = await searchParams;
  const items = await fetchProducts(currency, false);
  const query = q.trim().toLowerCase();
  const filtered = query ? items.filter((item) => item.name.toLowerCase().includes(query) || item.sku.toLowerCase().includes(query)) : items;
  const hero = filtered[0];

  const categoryRules = [
    { slug: "laptops", name: "Laptops", match: ["laptop", "notebook"] },
    { slug: "desktops", name: "Desktops", match: ["desktop", "tower", "pc"] },
    { slug: "monitors", name: "Monitors", match: ["monitor", "display"] },
    { slug: "components", name: "Components", match: ["gpu", "graphics", "ssd", "ram"] },
  ];

  const categories = categoryRules
    .map((rule) => ({
      slug: rule.slug,
      name: rule.name,
      productCount: filtered.filter((item) => rule.match.some((keyword) => item.name.toLowerCase().includes(keyword))).length,
    }))
    .filter((category) => category.productCount > 0);

  const sales = [...filtered].sort((a, b) => a.price - b.price).slice(0, 4);
  const topSelling = [...filtered].sort((a, b) => b.stockQty - a.stockQty).slice(0, 4);

  return (
    <div>
      {hero ? (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="small" style={{ marginBottom: 6 }}>
            Featured Product
          </p>
          <h2 style={{ marginTop: 0 }}>{hero.name}</h2>
          <p className="small">{hero.description || "High-performance device from our current catalog."}</p>
          <p>
            <b>
              {hero.price.toFixed(2)} {hero.currency}
            </b>
          </p>
          <p className="small">Availability: {hero.stockQty > 0 ? "In stock" : "Out of stock"}</p>
          <Link className="button" href={`/product/${hero.slug}?currency=${currency}`}>
            View product
          </Link>
        </div>
      ) : null}

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

      <div className="grid" style={{ marginBottom: 16 }}>
        {[
          { label: "Payment methods supported", value: "BTC / XMR / ZEC / USDC" },
          { label: "Identity requirement", value: "Only shipping details" },
          { label: "Shipping region", value: "Europe coverage" },
          { label: "Customer support", value: "Response target: 24h" },
        ].map((badge) => (
          <div key={badge.label} className="card">
            <p className="small" style={{ marginBottom: 6 }}>
              {badge.label}
            </p>
            <b>{badge.value}</b>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Promotion</h3>
        <p style={{ marginBottom: 6 }}>Crypto Launch Offer</p>
        <p className="small" style={{ marginBottom: 6 }}>
          Use coupon code <b>COINCART10</b> at checkout.
        </p>
        <p className="small" style={{ marginBottom: 0 }}>Valid through December 31, 2026.</p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Categories</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {categories.length === 0 ? <p className="small">No category matches for current query.</p> : null}
          {categories.map((category) => (
            <span key={category.slug} className="button secondary">
              {category.name} ({category.productCount})
            </span>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Sales</h3>
        <div className="grid">
          {sales.map((item) => (
            <Link key={`sale-${item.id}`} className="card" href={`/product/${item.slug}?currency=${currency}`}>
              <p className="small">{item.sku}</p>
              <h4 style={{ marginTop: 4 }}>{item.name}</h4>
              <p>
                <b>
                  {item.price.toFixed(2)} {item.currency}
                </b>
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Top Selling</h3>
        <div className="grid">
          {topSelling.map((item) => (
            <Link key={`top-${item.id}`} className="card" href={`/product/${item.slug}?currency=${currency}`}>
              <p className="small">{item.sku}</p>
              <h4 style={{ marginTop: 4 }}>{item.name}</h4>
              <p className="small">Stock signal: {item.stockQty}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid">
        {filtered.map((item) => (
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
