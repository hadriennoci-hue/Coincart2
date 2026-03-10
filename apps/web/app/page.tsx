import Link from "next/link";
import { fetchProducts, type Currency } from "../lib/api";

export const runtime = 'edge';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    currency?: Currency;
    q?: string;
    category?: string;
    keyboard_layout?: string;
    usage?: string;
    screen_size?: string;
    ram_memory?: string;
    ssd_size?: string;
    max_resolution?: string;
    sort?: "default" | "price_asc" | "price_desc" | "popularity" | "newest";
  }>;
}) {
  const {
    currency = "USD",
    q = "",
    category = "",
    keyboard_layout = "",
    usage = "",
    screen_size = "",
    ram_memory = "",
    ssd_size = "",
    max_resolution = "",
    sort = "default",
  } = await searchParams;

  const items = await fetchProducts(currency, false, {
    q,
    category,
    keyboard_layout,
    usage,
    screen_size,
    ram_memory,
    ssd_size,
    max_resolution,
    sort,
  });

  const query = q.trim().toLowerCase();
  const filtered = query
    ? items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.sku.toLowerCase().includes(query),
      )
    : items;

  const hero = filtered[0];

  const categoriesMap = new Map<string, number>();
  for (const item of filtered) {
    const key = item.category || "Uncategorized";
    categoriesMap.set(key, (categoriesMap.get(key) || 0) + 1);
  }
  const categories = Array.from(categoriesMap.entries()).map(
    ([name, productCount]) => ({
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      name,
      productCount,
    }),
  );

  const featured = filtered.filter((item) => (item as any).featured).slice(0, 4);
  const featuredGrid = featured.length > 0 ? featured : filtered.slice(0, 4);

  const hasFilters = !!(
    q ||
    category ||
    keyboard_layout ||
    usage ||
    screen_size ||
    ram_memory ||
    ssd_size ||
    max_resolution ||
    sort !== "default"
  );

  const categoryEmojis: Record<string, string> = {
    laptop: "💻",
    desktop: "🖥️",
    monitor: "🖱️",
    gpu: "🎮",
    keyboard: "⌨️",
    mouse: "🖱️",
    headset: "🎧",
    tablet: "📱",
  };

  return (
    <div>
      {/* Hero Banner */}
      {hero ? (
        <div
          style={{
            background: "linear-gradient(135deg, var(--surface) 0%, var(--bg) 100%)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="container">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 48,
                alignItems: "center",
                padding: "64px 0",
              }}
            >
              <div>
                <span className="badge badge-teal" style={{ marginBottom: 16, display: "inline-block" }}>
                  Featured Product
                </span>
                <h1
                  className="page-title"
                  style={{ marginBottom: 16, marginTop: 8 }}
                >
                  {hero.name}
                </h1>
                <p
                  style={{
                    color: "var(--muted)",
                    marginBottom: 24,
                    fontSize: "1.05rem",
                    lineHeight: 1.6,
                  }}
                >
                  {hero.description || "High-performance device from our current catalog."}
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    marginBottom: 32,
                  }}
                >
                  <span
                    style={{
                      fontSize: "2rem",
                      fontWeight: 700,
                      color: "var(--accent)",
                    }}
                  >
                    {hero.price.toFixed(2)} {hero.currency}
                  </span>
                  <span
                    className={
                      hero.stockQty > 0 ? "badge badge-green" : "badge badge-error"
                    }
                  >
                    {hero.stockQty > 0 ? "In Stock" : "Out of Stock"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <Link
                    className="btn btn-primary btn-lg"
                    href={`/product/${hero.slug}?currency=${currency}`}
                  >
                    View Product
                  </Link>
                  <Link
                    className="btn btn-ghost btn-lg"
                    href={`/cart?currency=${currency}`}
                  >
                    View Cart
                  </Link>
                </div>
              </div>
              <div>
                {hero.imageUrl ? (
                  <img
                    src={hero.imageUrl}
                    alt={hero.name}
                    style={{
                      width: "100%",
                      aspectRatio: "16/10",
                      objectFit: "cover",
                      borderRadius: 16,
                      border: "1px solid var(--border)",
                    }}
                  />
                ) : (
                  <div
                    className="product-card-img-placeholder"
                    style={{ aspectRatio: "16/10", borderRadius: 16 }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Trust Badges */}
      <div
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              padding: "20px 0",
            }}
          >
            {[
              { icon: "₿", label: "Payment methods", value: "BTC / XMR / ZEC / USDC" },
              { icon: "🔒", label: "Privacy first", value: "Only shipping details needed" },
              { icon: "🚚", label: "Shipping region", value: "Europe coverage" },
              { icon: "💬", label: "Customer support", value: "Response within 24h" },
            ].map((badge, i) => (
              <div
                key={badge.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "0 24px",
                  borderRight: i < 3 ? "1px solid var(--border)" : "none",
                }}
              >
                <span style={{ fontSize: "1.5rem" }}>{badge.icon}</span>
                <div>
                  <div className="caption">{badge.label}</div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      color: "var(--text)",
                    }}
                  >
                    {badge.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Promo Banner */}
      <div style={{ background: "var(--primary)", padding: "14px 0" }}>
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{ fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}
          >
            🎉 Crypto Launch Offer — Use coupon code{" "}
            <span
              style={{
                background: "rgba(255,255,255,0.2)",
                padding: "2px 10px",
                borderRadius: 6,
                fontFamily: "monospace",
                fontSize: "1rem",
                letterSpacing: 1,
              }}
            >
              COINCART10
            </span>
            {" "}at checkout for 10% off
          </span>
          <span className="small" style={{ color: "rgba(255,255,255,0.75)" }}>
            Valid through December 31, 2026
          </span>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 48 }}>
        {/* Categories */}
        {categories.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <h2 className="section-title" style={{ marginBottom: 20 }}>
              Categories
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <Link
                className={`btn ${!category ? "btn-teal" : "btn-ghost"}`}
                href={`/?currency=${currency}`}
                style={{ borderRadius: 999 }}
              >
                All Products ({filtered.length})
              </Link>
              {categories.map((cat) => {
                const emoji = categoryEmojis[cat.name.toLowerCase()] || "📦";
                const isActive = category === cat.name;
                return (
                  <Link
                    key={cat.slug}
                    className={`btn ${isActive ? "btn-teal" : "btn-ghost"}`}
                    href={`/?currency=${currency}&category=${encodeURIComponent(cat.name)}`}
                    style={{ borderRadius: 999 }}
                  >
                    {emoji} {cat.name} ({cat.productCount})
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Filters */}
        <section style={{ marginBottom: 48 }}>
          <details open={hasFilters}>
            <summary
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 20px",
                background: "var(--surface)",
                borderRadius: hasFilters ? "12px 12px 0 0" : 12,
                border: "1px solid var(--border)",
                listStyle: "none",
                fontWeight: 600,
                color: "var(--text)",
              }}
            >
              <span>🔍 Filters &amp; Search</span>
              {hasFilters && <span className="badge badge-teal">Active</span>}
              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <span className="caption">Currency:</span>
                <Link
                  className={`btn btn-sm ${currency === "USD" ? "btn-teal" : "btn-ghost"}`}
                  href={`/?currency=USD${q ? `&q=${q}` : ""}${category ? `&category=${category}` : ""}`}
                >
                  USD
                </Link>
                <Link
                  className={`btn btn-sm ${currency === "EUR" ? "btn-teal" : "btn-ghost"}`}
                  href={`/?currency=EUR${q ? `&q=${q}` : ""}${category ? `&category=${category}` : ""}`}
                >
                  EUR
                </Link>
              </div>
            </summary>
            <form
              method="get"
              action="/"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderTop: "none",
                borderRadius: "0 0 12px 12px",
                padding: 20,
              }}
            >
              <input type="hidden" name="currency" value={currency} />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 14,
                  marginBottom: 16,
                }}
              >
                <label className="form-label">
                  Search
                  <input
                    className="input"
                    name="q"
                    defaultValue={q}
                    placeholder="Product name or SKU"
                  />
                </label>
                <label className="form-label">
                  Category
                  <input
                    className="input"
                    name="category"
                    defaultValue={category}
                    placeholder="e.g. laptop"
                  />
                </label>
                <label className="form-label">
                  Keyboard Layout
                  <input
                    className="input"
                    name="keyboard_layout"
                    defaultValue={keyboard_layout}
                    placeholder="e.g. AZERTY"
                  />
                </label>
                <label className="form-label">
                  Usage
                  <input
                    className="input"
                    name="usage"
                    defaultValue={usage}
                    placeholder="e.g. gaming"
                  />
                </label>
                <label className="form-label">
                  Screen Size
                  <input
                    className="input"
                    name="screen_size"
                    defaultValue={screen_size}
                    placeholder='e.g. 15.6"'
                  />
                </label>
                <label className="form-label">
                  RAM (GB)
                  <input
                    className="input"
                    name="ram_memory"
                    defaultValue={ram_memory}
                    placeholder="e.g. 16"
                  />
                </label>
                <label className="form-label">
                  SSD (GB)
                  <input
                    className="input"
                    name="ssd_size"
                    defaultValue={ssd_size}
                    placeholder="e.g. 1024"
                  />
                </label>
                <label className="form-label">
                  Sort
                  <select
                    className="select"
                    name="sort"
                    defaultValue={sort}
                  >
                    <option value="default">Default</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="popularity">Popularity</option>
                    <option value="newest">Newest</option>
                  </select>
                </label>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-primary" type="submit">
                  Apply Filters
                </button>
                <Link className="btn btn-ghost" href={`/?currency=${currency}`}>
                  Reset
                </Link>
              </div>
            </form>
          </details>
        </section>

        {/* Featured Products Grid */}
        {featuredGrid.length > 0 && (
          <section style={{ marginBottom: 56 }}>
            <h2 className="section-title" style={{ marginBottom: 24 }}>
              Featured Products
            </h2>
            <div className="product-grid">
              {featuredGrid.map((item) => (
                <Link
                  key={`featured-${item.id}`}
                  className="product-card"
                  href={`/product/${item.slug}?currency=${currency}`}
                  style={{ textDecoration: "none" }}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="product-card-img"
                    />
                  ) : (
                    <div className="product-card-img-placeholder" />
                  )}
                  <div className="product-card-body">
                    {item.category && (
                      <span
                        className="badge badge-gray"
                        style={{ marginBottom: 8, display: "inline-block" }}
                      >
                        {item.category}
                      </span>
                    )}
                    <div className="card-title" style={{ marginBottom: 4 }}>
                      {item.name}
                    </div>
                    <div className="caption">{item.sku}</div>
                  </div>
                  <div className="product-card-footer">
                    <span className="product-card-price">
                      {item.price.toFixed(2)} {item.currency}
                    </span>
                    <span
                      className={
                        item.stockQty > 0
                          ? "badge badge-green"
                          : "badge badge-error"
                      }
                    >
                      {item.stockQty > 0 ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* All Products */}
        <section style={{ marginBottom: 56 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <h2 className="section-title" style={{ margin: 0 }}>
              All Products{" "}
              <span className="caption" style={{ marginLeft: 8 }}>
                ({filtered.length} items)
              </span>
            </h2>
          </div>

          {filtered.length === 0 ? (
            <div className="surface" style={{ textAlign: "center", padding: 48 }}>
              <div style={{ fontSize: "3rem", marginBottom: 16 }}>🔍</div>
              <h3 style={{ marginBottom: 8 }}>No products found</h3>
              <p className="small" style={{ marginBottom: 20 }}>
                Try broader filters or reset the catalog search to see all
                available products.
              </p>
              <Link className="btn btn-teal" href={`/?currency=${currency}`}>
                Reset Filters
              </Link>
            </div>
          ) : (
            <div className="product-grid">
              {filtered.map((item) => (
                <Link
                  key={item.id}
                  className="product-card"
                  href={`/product/${item.slug}?currency=${currency}`}
                  style={{ textDecoration: "none" }}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="product-card-img"
                    />
                  ) : (
                    <div className="product-card-img-placeholder" />
                  )}
                  <div className="product-card-body">
                    {item.category && (
                      <span
                        className="badge badge-gray"
                        style={{ marginBottom: 8, display: "inline-block" }}
                      >
                        {item.category}
                      </span>
                    )}
                    <div className="card-title" style={{ marginBottom: 4 }}>
                      {item.name}
                    </div>
                    <div className="caption">{item.sku}</div>
                  </div>
                  <div className="product-card-footer">
                    <span className="product-card-price">
                      {item.price.toFixed(2)} {item.currency}
                    </span>
                    <span
                      className={
                        item.stockQty > 0
                          ? "badge badge-green"
                          : "badge badge-error"
                      }
                    >
                      {item.stockQty > 0 ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
