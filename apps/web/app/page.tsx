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
  const filtered = query ? items.filter((item) => item.name.toLowerCase().includes(query) || item.sku.toLowerCase().includes(query)) : items;
  const hero = filtered[0];
  const categoriesMap = new Map<string, number>();
  for (const item of filtered) {
    const key = item.category || "Uncategorized";
    categoriesMap.set(key, (categoriesMap.get(key) || 0) + 1);
  }
  const categories = Array.from(categoriesMap.entries()).map(([name, productCount]) => ({
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    productCount,
  }));

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

      <form className="card" style={{ marginBottom: 16, display: "grid", gap: 10 }} method="get" action="/">
        <h3 style={{ margin: 0 }}>Filters</h3>
        <input type="hidden" name="currency" value={currency} />
        <label style={{ display: "grid", gap: 6 }}>
          <span>Search</span>
          <input defaultValue={q} name="q" style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10 }} />
        </label>
        <div className="grid">
          <label style={{ display: "grid", gap: 6 }}>
            <span>Category</span>
            <input
              name="category"
              defaultValue={category}
              placeholder="e.g. laptop"
              style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10 }}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Keyboard Layout</span>
            <input
              name="keyboard_layout"
              defaultValue={keyboard_layout}
              placeholder="e.g. AZERTY"
              style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10 }}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Usage</span>
            <input
              name="usage"
              defaultValue={usage}
              placeholder="e.g. gaming"
              style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10 }}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Screen Size</span>
            <input
              name="screen_size"
              defaultValue={screen_size}
              placeholder='e.g. 15.6"'
              style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10 }}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span>RAM (GB)</span>
            <input
              name="ram_memory"
              defaultValue={ram_memory}
              placeholder="e.g. 16"
              style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10 }}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span>SSD (GB)</span>
            <input
              name="ssd_size"
              defaultValue={ssd_size}
              placeholder="e.g. 1024"
              style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10 }}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Max Resolution</span>
            <input
              name="max_resolution"
              defaultValue={max_resolution}
              placeholder="e.g. 3840x2160"
              style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10 }}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Sort</span>
            <select name="sort" defaultValue={sort} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10 }}>
              <option value="default">Default</option>
              <option value="price_asc">Price (Low to High)</option>
              <option value="price_desc">Price (High to Low)</option>
              <option value="popularity">Popularity</option>
              <option value="newest">Newest</option>
            </select>
          </label>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="button" type="submit">Apply filters</button>
          <Link className="button secondary" href={`/?currency=${currency}`}>Reset</Link>
        </div>
      </form>

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
