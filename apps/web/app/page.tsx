import Link from "next/link";
import { fetchProducts, fetchTopSellingProducts, type Currency } from "../lib/api";
import { AnimatedGroup } from "../components/ui/AnimatedGroup";
import { FlipCard } from "../components/ui/FlipCard";
import { TestimonialsColumn, type Testimonial } from "../components/ui/TestimonialsColumn";
import { InteractiveHoverButton } from "../components/ui/InteractiveHoverButton";

const allTestimonials: Testimonial[] = [
  {
    text: "Very good seller that offers all the Acer products without fee. Shipment are tracked. It's like Acer accepting XMR directly.",
    name: "Anonymous",
    date: "Jul 24, 2025",
  },
  {
    text: "Seller was very helpful and communicative. Despite experiencing some unfortunate delays through no fault of the seller, I received my package intact, well wrapped and fully working without any abnormalities.",
    name: "mntn",
    date: "Jul 18, 2025",
  },
  {
    text: "Just woke up to see the deal wrapped up perfectly: it was a smooth process! Loved the excellent communication throughout, and congrats on becoming a seasoned escrow user.",
    name: "AilliA",
    role: "Verified buyer",
    date: "Jul 12, 2025",
  },
  {
    text: "Ordered again from this seller, everything is great! I had a custom request — getting a QWERTY laptop to a non-QWERTY country, and they found a way to do that, re-shipped it for me as fast as possible.",
    name: "Anonymous",
    date: "Jul 12, 2025",
  },
  {
    text: "This seller was fantastic to work with! Incredibly dependable, honest, and professional from start to finish. It was a smooth transaction.",
    name: "AilliA",
    role: "Verified buyer",
    date: "Jun 23, 2025",
  },
  {
    text: "I had a great experience ordering a GPU from this seller. It was dispatched within 24h via express delivery, so it came to me very fast.",
    name: "cocoa21",
    role: "Donor – Liberator",
    date: "Jun 23, 2025",
  },
  {
    text: "Great customer, happy to do business with them!",
    name: "cypherpink",
    role: "Verified Seller",
    date: "Jan 27, 2025",
  },
];

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
  const topSellingFromSales = await fetchTopSellingProducts(currency, 4);
  const hero = items[0];
  const promotions = items.filter((item) => item.featured).slice(0, 4);
  const topSellingFallback = [...items].sort((a, b) => b.stockQty - a.stockQty).slice(0, 4);
  const topSelling = topSellingFromSales.length > 0 ? topSellingFromSales : topSellingFallback;

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
                  <InteractiveHoverButton text="View Product" variant="blue" href={`/product/${hero.slug}?currency=${currency}`} />
                  <InteractiveHoverButton text="Browse Catalog" variant="dark" href={`/search?currency=${currency}`} />
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
            <InteractiveHoverButton text="View Full Catalog" variant="dark" href={`/search?currency=${currency}`} />
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
          <AnimatedGroup className="product-grid" preset="blur-slide">
            {(promotions.length > 0 ? promotions : topSellingFallback).map((item) => (
              <FlipCard
                key={`promo-${item.id}`}
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

        <section id="top-selling" style={{ marginBottom: 48 }}>
          <h2 className="section-title" style={{ marginBottom: 16 }}>Top Selling</h2>
          <AnimatedGroup className="product-grid" preset="blur-slide">
            {topSelling.map((item) => (
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
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid var(--border)", borderRadius: 8, padding: "4px 16px", marginBottom: 16, fontSize: "0.8rem", color: "var(--muted)" }}>
              Reviews from XMR Bazaar
            </div>
            <h2 className="section-title">What our customers say</h2>
            <p className="small" style={{ marginTop: 10, maxWidth: 400, margin: "10px auto 0" }}>
              Real feedback from verified buyers on XMR Bazaar.
            </p>
          </div>

          <div className="testimonials-columns-wrap">
            <TestimonialsColumn testimonials={allTestimonials.slice(0, 3)} duration={18} />
            <TestimonialsColumn testimonials={allTestimonials.slice(3, 5)} duration={22} className="hidden-mobile" />
            <TestimonialsColumn testimonials={allTestimonials.slice(5, 7)} duration={16} className="hidden-tablet" />
          </div>
        </section>
      </div>
    </div>
  );
}
