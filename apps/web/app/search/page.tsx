import Link from "next/link";
import type { Metadata } from "next";
import { fetchProducts, type Currency } from "../../lib/api";
import { FlipCard } from "../../components/ui/FlipCard";
import { SortSelect } from "../../components/ui/SortSelect";
import { SearchFilters } from "../../components/ui/SearchFilters";
import { collectionMeta } from "../../lib/collections";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Search",
  description: "Search Coincart products by collection, specs, and usage.",
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
    cpu?: string;
    gpu?: string;
    resolution?: string;
    refresh_rate?: string;
    storage?: string;
    keyboard_layout?: string;
    usage?: string;
    screen_size?: string;
    ram_memory?: string;
    ssd_size?: string;
    max_resolution?: string;
    sort?: "default" | "price_asc" | "price_desc" | "popularity" | "newest";
  }>;
}) {
  const toCollectionKey = (value?: string | null) =>
    (value ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const {
    q = "",
    category = "",
    collection = "",
    cpu = "",
    gpu = "",
    resolution = "",
    refresh_rate = "",
    storage = "",
    keyboard_layout = "",
    usage = "",
    screen_size = "",
    ram_memory = "",
    ssd_size = "",
    max_resolution = "",
    sort = "default",
  } = await searchParams;
  const currency: Currency = "EUR";

  // Global in-stock set for collection selector counts (must not be narrowed by active collection filter)
  const collectionCountItems = (await fetchProducts(currency, false)).filter(
    (item) => item.stockQty > 0,
  );

  // Dynamic set for non-collection filters
  const allItems = (await fetchProducts(currency, false, { q, collection })).filter(
    (item) => item.stockQty > 0,
  );

  const collectionsMap = new Map<string, number>();
  for (const item of collectionCountItems) {
    const key = toCollectionKey(item.collection || item.category);
    if (!key) continue;
    collectionsMap.set(key, (collectionsMap.get(key) || 0) + 1);
  }
  const collections = collectionMeta
    .map((entry) => ({
      key: entry.key,
      label: entry.label,
      count: collectionsMap.get(entry.key) || 0,
    }));

  const uniq = <T,>(vals: (T | null | undefined)[]): T[] =>
    [...new Set(vals.filter((v): v is T => v != null && String(v).trim() !== ""))];

  const laptopItems = allItems.filter((item) => toCollectionKey(item.collection || item.category) === "laptops");
  const displayItems = allItems.filter((item) => toCollectionKey(item.collection || item.category) === "displays");
  const cpuOptions = uniq(laptopItems.map((i) => i.cpu)).sort();
  const gpuOptions = uniq(laptopItems.map((i) => i.gpu)).sort();
  const laptopResolutionOptions = uniq(laptopItems.map((i) => i.resolution || i.maxResolution)).sort();
  const displayResolutionOptions = uniq(displayItems.map((i) => i.resolution || i.maxResolution)).sort();
  const refreshRateOptions = uniq(displayItems.map((i) => i.refreshRate)).sort((a, b) => a - b);
  const storageOptions = uniq(laptopItems.map((i) => i.storage)).sort();
  const keyboardLayouts = uniq(allItems.map((i) => i.keyboardLayout)).sort();
  const usages = uniq(allItems.map((i) => i.usage)).sort();
  const screenSizes = uniq(allItems.map((i) => i.screenSize)).sort((a, b) => parseFloat(a) - parseFloat(b));
  const ramOptions = uniq(allItems.map((i) => i.ramMemory)).sort((a, b) => a - b);
  const ssdOptions = uniq(allItems.map((i) => i.ssdSize)).sort((a, b) => a - b);

  // Fetch filtered results
  const items = (await fetchProducts(currency, false, {
    q,
    category,
    collection,
    cpu,
    gpu,
    resolution,
    refresh_rate,
    storage,
    keyboard_layout,
    usage,
    screen_size,
    ram_memory,
    ssd_size,
    max_resolution,
    sort,
  })).filter((item) => item.stockQty > 0);

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
          cpu={cpu}
          gpu={gpu}
          resolution={resolution}
          refresh_rate={refresh_rate}
          storage={storage}
          keyboard_layout={keyboard_layout}
          usage={usage}
          screen_size={screen_size}
          ram_memory={ram_memory}
          ssd_size={ssd_size}
          max_resolution={max_resolution}
          q={q}
          collections={collections}
          cpuOptions={cpuOptions}
          gpuOptions={gpuOptions}
          laptopResolutionOptions={laptopResolutionOptions}
          displayResolutionOptions={displayResolutionOptions}
          refreshRateOptions={refreshRateOptions}
          storageOptions={storageOptions}
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
            cpu={cpu}
            gpu={gpu}
            resolution={resolution}
            refresh_rate={refresh_rate}
            storage={storage}
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
                collection={item.collection}
                category={item.category}
                brand={item.brand}
                cpu={item.cpu}
                gpu={item.gpu}
                screenSize={item.screenSize}
                resolution={item.resolution}
                maxResolution={item.maxResolution}
                refreshRate={item.refreshRate}
                ramMemory={item.ramMemory}
                ssdSize={item.ssdSize}
                storage={item.storage}
                displayType={item.displayType}
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
