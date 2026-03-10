import Link from "next/link";
import { fetchProducts, type Currency } from "../../lib/api";
import { AnimatedGroup } from "../../components/ui/AnimatedGroup";
import { FlipCard } from "../../components/ui/FlipCard";

export const runtime = "edge";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
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
  const currency: Currency = "EUR";

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

  const categoriesMap = new Map<string, number>();
  for (const item of items) {
    const key = item.category || "Uncategorized";
    categoriesMap.set(key, (categoriesMap.get(key) || 0) + 1);
  }
  const categories = Array.from(categoriesMap.entries()).map(([name, productCount]) => ({
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    productCount,
  }));

  const hasFilters = !!(
    q || category || keyboard_layout || usage || screen_size || ram_memory || ssd_size || max_resolution || sort !== "default"
  );

  return (
    <div className="container" style={{ paddingTop: 16, paddingBottom: 64 }}>
      <section style={{ marginBottom: 16 }}>
        <details open={hasFilters}>
          <summary
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 16px",
              background: "var(--surface)",
              borderRadius: hasFilters ? "8px 8px 0 0" : 8,
              border: "1px solid var(--border)",
              listStyle: "none",
              fontWeight: 600,
              fontSize: "0.875rem",
              color: "var(--text)",
              flexWrap: "wrap",
              rowGap: 8,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.5 }}>
                <path d="M1 3h12M3 7h8M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Filters
            </span>
            {categories.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }} onClick={(e) => e.preventDefault()}>
                <Link className={`btn btn-sm ${!category ? "btn-teal" : "btn-ghost"}`} href={`/search?currency=${currency}`} style={{ borderRadius: 999, padding: "4px 12px", fontSize: "0.75rem" }}>
                  All ({items.length})
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    className={`btn btn-sm ${category === cat.name ? "btn-teal" : "btn-ghost"}`}
                    href={`/search?currency=${currency}&category=${encodeURIComponent(cat.name)}`}
                    style={{ borderRadius: 999, padding: "4px 12px", fontSize: "0.75rem" }}
                  >
                    {cat.name} ({cat.productCount})
                  </Link>
                ))}
              </div>
            )}
          </summary>
          <form
            method="get"
            action="/search"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderTop: "none",
              borderRadius: "0 0 8px 8px",
              padding: 16,
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 16 }}>
              <label className="form-label">Search<input className="input" name="q" defaultValue={q} placeholder="Product name or SKU" /></label>
              <label className="form-label">Category<input className="input" name="category" defaultValue={category} placeholder="e.g. Laptops" /></label>
              <label className="form-label">Keyboard Layout<input className="input" name="keyboard_layout" defaultValue={keyboard_layout} /></label>
              <label className="form-label">Usage<input className="input" name="usage" defaultValue={usage} /></label>
              <label className="form-label">Screen Size<input className="input" name="screen_size" defaultValue={screen_size} /></label>
              <label className="form-label">RAM (GB)<input className="input" name="ram_memory" defaultValue={ram_memory} /></label>
              <label className="form-label">SSD (GB)<input className="input" name="ssd_size" defaultValue={ssd_size} /></label>
              <label className="form-label">
                Sort
                <select className="select" name="sort" defaultValue={sort}>
                  <option value="default">Default</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="popularity">Popularity</option>
                  <option value="newest">Newest</option>
                </select>
              </label>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" type="submit">Apply</button>
              <Link className="btn btn-ghost" href={`/search`}>Reset</Link>
            </div>
          </form>
        </details>
      </section>

      <section>
        <h2 className="section-title" style={{ marginBottom: 16, marginTop: 24, fontSize: "1.25rem" }}>
          Results <span className="caption">({items.length})</span>
        </h2>
        {items.length === 0 ? (
          <div className="surface" style={{ textAlign: "center", padding: 48 }}>
            <h3 style={{ marginBottom: 8 }}>No products found</h3>
            <p className="small" style={{ marginBottom: 18 }}>Try broader filters or reset your search.</p>
            <Link className="btn btn-primary" href={`/search`}>Reset Search</Link>
          </div>
        ) : (
          <AnimatedGroup className="product-grid" preset="blur-slide">
            {items.map((item) => (
              <FlipCard
                key={item.id}
                name={item.name}
                imageUrl={item.imageUrl}
                price={item.price}
                currency={item.currency}
                stockQty={item.stockQty}
                description={item.description}
                sku={item.sku}
                href={`/product/${item.slug}`}
              />
            ))}
          </AnimatedGroup>
        )}
      </section>
    </div>
  );
}
