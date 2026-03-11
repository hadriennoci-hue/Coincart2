import Link from "next/link";
import { fetchProducts, type Currency } from "../../lib/api";
import { FlipCard } from "../../components/ui/FlipCard";
import { SortSelect } from "../../components/ui/SortSelect";

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

  // Fetch all products (no category filter) to populate category dropdown
  const allItems = await fetchProducts(currency, false, { q });
  const categoriesMap = new Map<string, number>();
  for (const item of allItems) {
    const key = item.category || "Uncategorized";
    categoriesMap.set(key, (categoriesMap.get(key) || 0) + 1);
  }
  const categories = Array.from(categoriesMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  // Fetch filtered results
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

  return (
    <div
      className="container"
      style={{ paddingTop: 24, paddingBottom: 64, display: "flex", gap: 28, alignItems: "flex-start" }}
    >
      {/* Sidebar filters */}
      <aside
        style={{
          width: 220,
          flexShrink: 0,
          position: "sticky",
          top: "calc(var(--navbar-h) + 24px)",
        }}
      >
        <form
          method="get"
          action="/search"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.5 }}>
              <path d="M1 3h12M3 7h8M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Filters
          </div>

          <label className="form-label" style={{ gap: 6 }}>
            Category
            <select className="select" name="category" defaultValue={category}>
              <option value="">All categories</option>
              {categories.map(([name, count]) => (
                <option key={name} value={name}>
                  {name} ({count})
                </option>
              ))}
            </select>
          </label>

          <label className="form-label" style={{ gap: 6 }}>
            Keyboard Layout
            <input className="input" name="keyboard_layout" defaultValue={keyboard_layout} placeholder="e.g. AZERTY" />
          </label>

          <label className="form-label" style={{ gap: 6 }}>
            Usage
            <input className="input" name="usage" defaultValue={usage} placeholder="e.g. Gaming" />
          </label>

          <label className="form-label" style={{ gap: 6 }}>
            Screen Size
            <input className="input" name="screen_size" defaultValue={screen_size} placeholder='e.g. 15.6"' />
          </label>

          <label className="form-label" style={{ gap: 6 }}>
            RAM (GB)
            <input className="input" name="ram_memory" defaultValue={ram_memory} placeholder="e.g. 16" />
          </label>

          <label className="form-label" style={{ gap: 6 }}>
            SSD (GB)
            <input className="input" name="ssd_size" defaultValue={ssd_size} placeholder="e.g. 512" />
          </label>

          <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
            <button className="btn btn-primary btn-sm" type="submit" style={{ flex: 1 }}>Apply</button>
            <Link className="btn btn-ghost btn-sm" href="/search" style={{ flex: 1, textAlign: "center" }}>Reset</Link>
          </div>
        </form>
      </aside>

      {/* Results */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
          <h2 className="section-title" style={{ margin: 0, fontSize: "1.25rem" }}>
            Results <span className="caption">({items.length})</span>
          </h2>
          <SortSelect
            sort={sort}
            q={q}
            category={category}
            keyboard_layout={keyboard_layout}
            usage={usage}
            screen_size={screen_size}
            ram_memory={ram_memory}
            ssd_size={ssd_size}
            max_resolution={max_resolution}
          />
        </div>

        {items.length === 0 ? (
          <div className="surface" style={{ textAlign: "center", padding: 48 }}>
            <h3 style={{ marginBottom: 8 }}>No products found</h3>
            <p className="small" style={{ marginBottom: 18 }}>Try broader filters or reset your search.</p>
            <Link className="btn btn-primary" href="/search">Reset Search</Link>
          </div>
        ) : (
          <div className="product-grid">
            {items.map((item) => (
              <FlipCard
                key={item.id}
                name={item.name}
                imageUrl={item.imageUrl}
                price={item.price}
                promoPrice={item.promoPrice}
                currency={item.currency}
                stockQty={item.stockQty}
                description={item.description}
                sku={item.sku}
                href={`/product/${item.slug}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
