import Link from "next/link";
import type { Metadata } from "next";
import { fetchProducts, type Currency } from "../../lib/api";
import { FlipCard } from "../../components/ui/FlipCard";
import { SortSelect } from "../../components/ui/SortSelect";
import { SearchFilters } from "../../components/ui/SearchFilters";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Search",
  description: "Search Coincart products by category, specs, and usage.",
  robots: {
    index: false,
    follow: true,
  },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    collection?: string;
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
    collection = "",
    keyboard_layout = "",
    usage = "",
    screen_size = "",
    ram_memory = "",
    ssd_size = "",
    max_resolution = "",
    sort = "default",
  } = await searchParams;
  const currency: Currency = "EUR";

  // Fetch all products (no category filter) to populate filter dropdowns
  const allItems = await fetchProducts(currency, false, { q, collection });

  const categoriesMap = new Map<string, number>();
  for (const item of allItems) {
    const key = item.category || "Uncategorized";
    categoriesMap.set(key, (categoriesMap.get(key) || 0) + 1);
  }
  const categories = Array.from(categoriesMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  const uniq = <T,>(vals: (T | null | undefined)[]): T[] =>
    [...new Set(vals.filter((v): v is T => v != null && String(v).trim() !== ""))];

  const keyboardLayouts = uniq(allItems.map((i) => i.keyboardLayout)).sort();
  const usages = uniq(allItems.map((i) => i.usage)).sort();
  const screenSizes = uniq(allItems.map((i) => i.screenSize)).sort((a, b) => parseFloat(a) - parseFloat(b));
  const ramOptions = uniq(allItems.map((i) => i.ramMemory)).sort((a, b) => a - b);
  const ssdOptions = uniq(allItems.map((i) => i.ssdSize)).sort((a, b) => a - b);

  // Fetch filtered results
  const items = await fetchProducts(currency, false, {
    q,
    category,
    collection,
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
      className="container search-layout"
      style={{ paddingTop: 24, paddingBottom: 64, display: "flex", gap: 28, alignItems: "flex-start" }}
    >
      {/* Sidebar filters */}
      <aside className="search-aside">
        <SearchFilters
          category={category}
          collection={collection}
          keyboard_layout={keyboard_layout}
          usage={usage}
          screen_size={screen_size}
          ram_memory={ram_memory}
          ssd_size={ssd_size}
          max_resolution={max_resolution}
          q={q}
          categories={categories}
          keyboardLayouts={keyboardLayouts}
          usages={usages}
          screenSizes={screenSizes}
          ramOptions={ramOptions}
          ssdOptions={ssdOptions}
        />
      </aside>

      {/* Results */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: 12 }}>Search Products</h1>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
          <h2 className="section-title" style={{ margin: 0, fontSize: "1.25rem" }}>
            Results <span className="caption">({items.length})</span>
          </h2>
          <SortSelect
            sort={sort}
            q={q}
            category={category}
            collection={collection}
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
