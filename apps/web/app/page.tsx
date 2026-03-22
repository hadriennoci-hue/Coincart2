import Link from "next/link";
import { fetchCollections, fetchProducts, type Currency } from "../lib/api";
import { collectionByKey, collectionMeta } from "../lib/collections";
import { FlipCard } from "../components/ui/FlipCard";
import { TestimonialsColumn, type Testimonial } from "../components/ui/TestimonialsColumn";
import { PredatorHero } from "../components/ui/PredatorHero";
import { BrandsGrid } from "../components/ui/BrandsGrid";

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
    text: "Ordered again from this seller, everything is great! I had a custom request - getting a QWERTY laptop to a non-QWERTY country, and they found a way to do that, re-shipped it for me as fast as possible.",
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
    role: "Donor - Liberator",
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

const HOME_HERO_SKU = process.env.NEXT_PUBLIC_HERO_SKU || "NH.QW0EH.003";

const COLLECTION_ICONS = {
  audio: "\u{1F3A7}",
  cases: "\u{1F392}",
  desktops: "\u{1F5A5}\u{FE0F}",
  displays: "\u{1F4FA}",
  "input-devices": "\u{2328}\u{FE0F}",
  laptops: "\u{1F4BB}",
  lifestyle: "\u{1F6F5}",
  tablets: "\u{1F4F1}",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ currency?: Currency }>;
}) {
  const { currency = "EUR" } = await searchParams;
  const items = await fetchProducts(currency, false);
  const latestItems = await fetchProducts(currency, false, { sort: "newest" });
  const rawCollections = await fetchCollections(currency);
  const collections = rawCollections.length > 0
    ? rawCollections
    : collectionMeta.map((entry) => ({
        id: entry.key,
        key: entry.key,
        label: entry.label,
        productCount: items.filter((p) => (p.collection || "").trim() === entry.key).length,
      }));
  const hero =
    items.find((item) => item.sku === HOME_HERO_SKU) ??
    items.find((item) => item.collection === "laptops") ??
    items[0];
  const heroCategory = (hero?.collection || hero?.category || "").toLowerCase();
  const heroCategoryLabel =
    collectionByKey[heroCategory as keyof typeof collectionByKey]?.label || hero?.collection || hero?.category;
  const heroIsLaptop = heroCategory.includes("laptop");
  const heroIsMonitor = heroCategory.includes("monitor") || heroCategory.includes("display");
  const heroSpecs = !hero
    ? []
    : heroIsLaptop
      ? [
          hero.screenSize ? `Screen: ${hero.screenSize}` : null,
          hero.resolution ? `Resolution: ${hero.resolution}` : null,
          hero.cpu ? `Processor: ${hero.cpu}` : null,
          hero.ramMemory ? `RAM: ${hero.ramMemory} GB` : null,
          hero.storage || (hero.ssdSize ? `Storage: ${hero.ssdSize} GB` : null),
          hero.gpu ? `GPU: ${hero.gpu}` : null,
          hero.brand ? `Brand: ${hero.brand}` : null,
        ].filter((value): value is string => Boolean(value))
      : heroIsMonitor
        ? [
            hero.screenSize ? `Screen: ${hero.screenSize}` : null,
            hero.resolution ? `Resolution: ${hero.resolution}` : null,
            hero.refreshRate ? `Refresh: ${hero.refreshRate} Hz` : null,
            hero.displayType ? `Panel: ${hero.displayType}` : null,
          ].filter((value): value is string => Boolean(value))
        : [];
  const promotions = latestItems
    .filter((item) => typeof item.promoPrice === "number" && item.promoPrice > 0)
    .slice(0, 8);
  const topSellingFallback = latestItems.slice(0, 8);
  const topSelling = topSellingFallback;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://coincart-web.pages.dev";
  const homeJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Coincart",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
  const topJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: topSelling.slice(0, 8).map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteUrl}/product/${item.slug}`,
      name: item.name,
    })),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(topJsonLd) }} />
      <PredatorHero
        name={hero?.name || "Featured Product"}
        category={heroCategoryLabel}
        description={hero?.description}
        specs={heroSpecs}
        price={hero?.price || 0}
        promoPrice={hero?.promoPrice}
        currency={hero?.currency || currency}
        stockQty={hero?.stockQty || 0}
        href={hero ? `/product/${hero.slug}?currency=${currency}` : `/search?currency=${currency}&collection=laptops`}
      />

      {/* Trust strip */}
      <div className="trust-strip">
        <div className="container">
          <div className="trust-strip-inner">
            <div className="trust-item">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              <span className="trust-label">3-5 days delivery in Europe</span>
            </div>
            <div className="trust-divider" />
            <div className="trust-item">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.546zM17.15 10.27c.24-1.6-.977-2.46-2.64-3.03l.54-2.16-1.316-.33-.524 2.1c-.347-.087-.703-.168-1.057-.248l.527-2.115-1.315-.33-.54 2.16c-.287-.066-.57-.13-.843-.198l.001-.007-1.815-.453-.35 1.406s.977.224.956.237c.534.134.63.487.614.767l-.616 2.47c.037.01.085.023.137.044l-.14-.035-.864 3.462c-.065.163-.232.407-.607.314.013.019-.957-.239-.957-.239L7 15.93l1.713.428c.319.08.631.163.939.242l-.546 2.19 1.314.328.54-2.162c.36.098.708.188 1.05.273l-.538 2.154 1.316.33.546-2.187c2.25.426 3.944.254 4.655-1.782.574-1.637-.028-2.582-1.21-3.198.862-.199 1.51-.766 1.682-1.938zm-3.012 4.225c-.408 1.637-3.17.752-4.065.53l.725-2.906c.896.224 3.767.667 3.34 2.376zm.408-4.245c-.372 1.493-2.669.734-3.416.548l.657-2.636c.747.186 3.152.533 2.76 2.088z"/>
              </svg>
              <span className="trust-label">Pay with crypto</span>
            </div>
            <div className="trust-divider" />
            <div className="trust-item">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span className="trust-label">24/7 support</span>
            </div>
            <div className="trust-divider" />
            <div className="trust-item">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span className="trust-label">Official Acer reseller</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 24 }}>
        <section style={{ marginBottom: 40 }}>
          <div className="category-grid">
            {collections.map(({ key, label, productCount }) => (
              <a
                key={key}
                className="category-card"
                href={`/search?currency=${currency}&collection=${encodeURIComponent(key)}`}
              >
                <div className="category-icon">{COLLECTION_ICONS[key] || "\u{1F4C1}"}</div>
                <div className="category-label">{label}</div>
                <div className="caption">{productCount} products</div>
              </a>
            ))}
          </div>
        </section>

        <section id="promotions" style={{ marginBottom: 48 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid var(--border)", borderRadius: 8, padding: "4px 16px", fontSize: "0.8rem", color: "var(--muted)" }}>
              Promotions
            </div>
          </div>
          <div className="product-grid">
            {promotions.map((item) => (
              <FlipCard
                key={`promo-${item.id}`}
                name={item.name}
                imageUrl={item.imageUrl}
                price={item.price}
                promoPrice={item.promoPrice}
                currency={item.currency}
                stockQty={item.stockQty}
                description={item.description}
                sku={item.sku}
                href={`/product/${item.slug}?currency=${currency}`}
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
              />
            ))}
          </div>
        </section>

        <section id="top-selling" style={{ marginBottom: 48 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid var(--border)", borderRadius: 8, padding: "4px 16px", fontSize: "0.8rem", color: "var(--muted)" }}>
              Top Selling
            </div>
          </div>
          <div className="product-grid">
            {topSelling.map((item) => (
              <FlipCard
                key={`top-${item.id}`}
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
                href={`/product/${item.slug}?currency=${currency}`}
              />
            ))}
          </div>
        </section>

        <section id="partners" style={{ marginBottom: 12 }}>
          <div className="divider" style={{ marginBottom: 12 }} />
          <BrandsGrid
            title="Partners"
            brands={[
              { name: "Acer", logo: "https://cdn.worldvectorlogo.com/logos/acer-2011.svg" },
              { name: "Predator", logo: "https://images.seeklogo.com/logo-png/44/3/acer-predator-logo-png_seeklogo-441422.png", height: 72 },
              { name: "Jiushark", logo: "/jiushark_nobg.png", noFilter: true },
            ]}
          />
          <div className="divider" style={{ marginTop: 12 }} />
        </section>

        <section id="reviews" style={{ marginBottom: 64 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid var(--border)", borderRadius: 8, padding: "4px 16px", marginBottom: 24, fontSize: "0.8rem", color: "var(--muted)" }}>
              Reviews from XMR Bazaar
            </div>
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
