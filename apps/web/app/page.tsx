import Link from "next/link";
import { fetchProducts, type Currency } from "../lib/api";
import { AnimatedGroup } from "../components/ui/AnimatedGroup";
import { FlipCard } from "../components/ui/FlipCard";

export const runtime = "edge";

const categoryIcons: Record<string, string> = {
  Laptops: "💻",
  "Air Fryers": "🍟",
  "Electric Bikes": "🚲",
  Headphones: "🎧",
  Monitors: "🖥️",
  Accessories: "⌨️",
  Cameras: "📷",
  Audio: "🔊",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ currency?: Currency }>;
}) {
  const { currency = "EUR" } = await searchParams;
  const items = await fetchProducts(currency, false);
  const hero = items[0];
  const topSelling = [...items].sort((a, b) => b.stockQty - a.stockQty).slice(0, 4);
  const featured = items.filter((item) => item.featured).slice(0, 4);

  const categoriesMap = new Map<string, number>();
  for (const item of items) {
    const key = item.category || "Uncategorized";
    categoriesMap.set(key, (categoriesMap.get(key) || 0) + 1);
  }
  const categories = Array.from(categoriesMap.entries()).map(([name, productCount]) => ({
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    productCount,
    icon: categoryIcons[name] || "📦",
  }));

  return (
    <div>
      {hero ? (
        <div style={{ background: "linear-gradient(135deg, var(--surface) 0%, var(--bg) 100%)", borderBottom: "1px solid var(--border)" }}>
          <div className="container">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center", padding: "64px 0" }}>
              <div>
                <span className="badge badge-teal" style={{ marginBottom: 16, display: "inline-block" }}>Featured Product</span>
                <h1 className="page-title" style={{ marginBottom: 16, marginTop: 8 }}>{hero.name}</h1>
                <p style={{ color: "var(--muted)", marginBottom: 24, fontSize: "1.05rem", lineHeight: 1.6 }}>
                  {hero.description || "Premium product selection with secure crypto checkout."}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
                  <span style={{ fontSize: "2rem", fontWeight: 700, color: "var(--accent)" }}>
                    {hero.price.toFixed(2)} {hero.currency}
                  </span>
                  <span className={hero.stockQty > 0 ? "badge badge-green" : "badge badge-error"}>
                    {hero.stockQty > 0 ? "In Stock" : "Out of Stock"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <Link className="btn btn-primary btn-lg" href={`/product/${hero.slug}?currency=${currency}`}>View Product</Link>
                  <Link className="btn btn-ghost btn-lg" href={`/search?currency=${currency}`}>Browse Catalog</Link>
                </div>
              </div>
              <div>
                {hero.imageUrl ? (
                  <img
                    src={hero.imageUrl}
                    alt={hero.name}
                    style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover", borderRadius: 16, border: "1px solid var(--border)" }}
                  />
                ) : (
                  <div className="product-card-img-placeholder" style={{ aspectRatio: "16/10", borderRadius: 16 }} />
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div style={{ background: "var(--primary)", padding: "14px 0" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>
            🎉 Launch Promotion: Use <b>COINCART10</b> for 10% off.
          </span>
          <span className="small" style={{ color: "rgba(255,255,255,0.8)" }}>Valid through December 31, 2026</span>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 44 }}>
        <section style={{ marginBottom: 40 }}>
          <div className="home-tabs">
            <a className="home-tab" href="#promotions">Promotions</a>
            <a className="home-tab" href="#top-selling">Top Selling</a>
            <a className="home-tab" href="#reviews">Reviews</a>
          </div>
        </section>

        <section style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 className="section-title" style={{ margin: 0 }}>Shop by Category</h2>
            <Link className="btn btn-ghost" href={`/search?currency=${currency}`}>View Full Catalog</Link>
          </div>
          <AnimatedGroup className="category-grid" preset="blur-slide">
            {categories.map((cat) => (
              <Link key={cat.slug} className="category-card" href={`/search?currency=${currency}&category=${encodeURIComponent(cat.name)}`}>
                <div className="category-icon">{cat.icon}</div>
                <div className="category-label">{cat.name}</div>
                <div className="caption">{cat.productCount} products</div>
              </Link>
            ))}
          </AnimatedGroup>
        </section>

        <section id="promotions" style={{ marginBottom: 48 }}>
          <h2 className="section-title" style={{ marginBottom: 16 }}>Promotions</h2>
          <div className="surface" style={{ display: "grid", gap: 10 }}>
            <p style={{ fontWeight: 700, margin: 0 }}>Crypto Launch Offer</p>
            <p className="small" style={{ margin: 0 }}>Apply coupon <b>COINCART10</b> during checkout.</p>
            <p className="small" style={{ margin: 0 }}>Eligible on selected product lines. Terms apply.</p>
            <div>
              <Link className="btn btn-primary" href={`/search?currency=${currency}`}>Shop Offers</Link>
            </div>
          </div>
        </section>

        <section id="top-selling" style={{ marginBottom: 48 }}>
          <h2 className="section-title" style={{ marginBottom: 16 }}>Top Selling</h2>
          <AnimatedGroup className="product-grid" preset="blur-slide">
            {(topSelling.length ? topSelling : featured).map((item) => (
              <FlipCard
                key={`top-${item.id}`}
                name={item.name}
                imageUrl={item.imageUrl}
                price={item.price}
                currency={item.currency}
                stockQty={item.stockQty}
                description={item.description}
                sku={item.sku}
                href={`/product/${item.slug}?currency=${currency}`}
              />
            ))}
          </AnimatedGroup>
        </section>

        <section id="reviews" style={{ marginBottom: 64 }}>
          <h2 className="section-title" style={{ marginBottom: 16 }}>Reviews</h2>
          <AnimatedGroup className="grid-3" preset="blur-slide">
            {[
              { name: "A. Laurent", text: "Checkout was straightforward and shipping status communication was clear.", score: "5.0 / 5" },
              { name: "M. Novak", text: "Product packaging and delivery timing matched expectations for cross-border shipping.", score: "4.8 / 5" },
              { name: "E. Rossi", text: "Support responded within one business day and resolved my order question quickly.", score: "4.9 / 5" },
            ].map((review) => (
              <div key={review.name} className="surface">
                <p style={{ fontWeight: 700, marginBottom: 10 }}>{review.score}</p>
                <p className="small" style={{ marginBottom: 14, lineHeight: 1.6 }}>{review.text}</p>
                <p className="caption">{review.name}</p>
              </div>
            ))}
          </AnimatedGroup>
        </section>
      </div>
    </div>
  );
}
