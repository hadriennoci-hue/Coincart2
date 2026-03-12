import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AddToCartButton } from "../../../components/AddToCartButton";
import { ProductVariantSelect } from "../../../components/ProductVariantSelect";
import { ProductImageGallery } from "../../../components/ProductImageGallery";
import { fetchProductBySlug, fetchProducts, type Currency } from "../../../lib/api";
import { fmtPrice } from "../../../lib/format";

export const runtime = 'edge';

type ProductPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ currency?: Currency }>;
};

export async function generateMetadata({ params, searchParams }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { currency = "EUR" } = await searchParams;
  const product = await fetchProductBySlug(slug, currency);
  if (!product) {
    return { title: "Product not found" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://coincart-web.pages.dev";
  const canonical = `${siteUrl}/product/${product.slug}`;
  const image =
    Array.isArray(product.imageUrls) && product.imageUrls.length > 0
      ? product.imageUrls[0]
      : product.imageUrl || undefined;

  return {
    title: product.name,
    description: product.description || `${product.name} - pay with crypto on Coincart.`,
    alternates: { canonical },
    openGraph: {
      title: product.name,
      description: product.description || `${product.name} - pay with crypto on Coincart.`,
      type: "website",
      url: canonical,
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
  };
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { slug } = await params;
  const { currency = "EUR" } = await searchParams;
  const product = await fetchProductBySlug(slug, currency);
  if (!product) return notFound();

  const allProducts = await fetchProducts(currency, false);
  const productNameKey = product.name.trim().toLowerCase();
  const productCategoryKey = (product.category || "").trim().toLowerCase();
  const variantOptions = allProducts
    .filter((item) => {
      if (!item.keyboardLayout) return false;
      const itemNameKey = item.name.trim().toLowerCase();
      const itemCategoryKey = (item.category || "").trim().toLowerCase();
      return itemNameKey === productNameKey && itemCategoryKey === productCategoryKey;
    })
    .map((item) => ({
      slug: item.slug,
      keyboardLayout: item.keyboardLayout as string,
      sku: item.sku,
    }))
    .sort((a, b) => a.keyboardLayout.localeCompare(b.keyboardLayout));
  const hasVariants = variantOptions.length > 1;

  const imageGallery =
    Array.isArray(product.imageUrls) && product.imageUrls.length > 0
      ? product.imageUrls
      : product.imageUrl
        ? [product.imageUrl]
        : [];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://coincart-web.pages.dev";
  const productUrl = `${siteUrl}/product/${product.slug}?currency=${currency}`;
  const collectionKey = (product.collection || product.category || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const attributeValueMap = new Map<string, string>();
  if (product.brand) attributeValueMap.set("brand", product.brand);
  if (product.cpu) attributeValueMap.set("cpu", product.cpu);
  if (product.gpu) attributeValueMap.set("gpu", product.gpu);
  if (product.ramMemory) attributeValueMap.set("ram", `${product.ramMemory} GB`);
  if (product.storage) attributeValueMap.set("storage", product.storage);
  if (product.ssdSize) attributeValueMap.set("ssd", `${product.ssdSize} GB`);
  if (product.screenSize) attributeValueMap.set("screen_size", product.screenSize);
  if (product.displayType) attributeValueMap.set("display_type", product.displayType);
  if (product.resolution) attributeValueMap.set("resolution", product.resolution);
  if (product.maxResolution) attributeValueMap.set("max_resolution", product.maxResolution);
  if (product.refreshRate) attributeValueMap.set("refresh_rate", `${product.refreshRate} Hz`);
  if (product.keyboardLayout) attributeValueMap.set("keyboard_layout", product.keyboardLayout);
  if (product.usage) attributeValueMap.set("usage", product.usage);

  const orderByCollection: Record<string, string[]> = {
    laptops: [
      "brand",
      "cpu",
      "gpu",
      "ram",
      "storage",
      "ssd",
      "screen_size",
      "resolution",
      "max_resolution",
      "refresh_rate",
      "keyboard_layout",
      "usage",
    ],
    displays: [
      "brand",
      "screen_size",
      "display_type",
      "resolution",
      "max_resolution",
      "refresh_rate",
      "usage",
    ],
  };
  const labelByKey: Record<string, string> = {
    brand: "Brand",
    cpu: "CPU",
    gpu: "GPU",
    ram: "RAM",
    storage: "Storage",
    ssd: "SSD",
    screen_size: "Screen Size",
    display_type: "Display Type",
    resolution: "Resolution",
    max_resolution: "Max Resolution",
    refresh_rate: "Refresh Rate",
    keyboard_layout: "Keyboard Layout",
    usage: "Usage",
  };
  const preferredOrder = orderByCollection[collectionKey] || Object.keys(labelByKey);
  const specRows: Array<{ label: string; value: string }> = [];
  const usedKeys = new Set<string>();
  for (const key of preferredOrder) {
    const value = attributeValueMap.get(key);
    if (!value) continue;
    specRows.push({ label: labelByKey[key] || key, value });
    usedKeys.add(key);
  }
  for (const [key, value] of attributeValueMap.entries()) {
    if (usedKeys.has(key)) continue;
    specRows.push({ label: labelByKey[key] || key, value });
  }

  const extraRows: Array<{ label: string; value: string }> = [];
  const derivedTags: string[] = [];
  for (const attribute of product.extraAttributes || []) {
    const name = attribute.name.trim();
    const options = attribute.options.map((item) => item.trim()).filter(Boolean);
    if (!name || options.length === 0) continue;
    if (name.toLowerCase() === "tag" || name.toLowerCase() === "tags") {
      derivedTags.push(...options);
      continue;
    }
    extraRows.push({ label: name, value: options.join(", ") });
  }
  const tags = Array.from(new Set([...(product.tags || []), ...derivedTags]));
  const allSpecRows = [...specRows, ...extraRows];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: imageGallery.length > 0 ? imageGallery : undefined,
    sku: product.sku,
    description: product.description || undefined,
    category: product.category || undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency,
      price: product.price.toFixed(2),
      availability:
        product.stockQty > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: productUrl,
    },
  };

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Two-column layout: image gallery | product info */}
      <div
        className="pdp-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "48% 1fr",
          gap: 48,
          marginBottom: 40,
          alignItems: "start",
        }}
      >
        {/* Left: Product Image Gallery */}
        <div>
          <ProductImageGallery images={imageGallery} alt={product.name} />
        </div>

        {/* Right: All product info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {product.category && (
            <span className="badge badge-teal" style={{ alignSelf: "flex-start" }}>
              {product.category}
            </span>
          )}

          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 500,
              color: "var(--text)",
              margin: 0,
              lineHeight: 1.25,
            }}
          >
            {product.name}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              className={product.stockQty > 0 ? "badge badge-green" : "badge badge-error"}
            >
              {product.stockQty > 0 ? "In Stock" : "Out of Stock"}
            </span>
            <span className="caption" style={{ color: "var(--muted)" }}>SKU: {product.sku}</span>
          </div>

          <div className="divider" style={{ margin: "4px 0" }} />

          <span
            style={{
              fontSize: "1.5rem",
              fontWeight: 500,
              color: "var(--text)",
            }}
          >
            {fmtPrice(product.price, product.currency)}
          </span>

          {product.description && (
            <p
              style={{
                color: "var(--muted)",
                lineHeight: 1.6,
                margin: 0,
                fontSize: "0.9rem",
              }}
            >
              {product.description}
            </p>
          )}

          <div className="divider" style={{ margin: "4px 0" }} />

          {hasVariants && (
            <ProductVariantSelect
              currency={currency}
              currentSlug={product.slug}
              options={variantOptions}
            />
          )}

          <AddToCartButton sku={product.sku} />
        </div>
      </div>

      {/* Specs Table */}
      <div className="surface">
        <h2 className="card-title" style={{ marginBottom: 20 }}>
          Product Specifications
        </h2>
        {allSpecRows.length > 0 ? (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <tbody>
              {allSpecRows.map((row, i, arr) => (
                <tr
                  key={row.label}
                  style={{
                    borderBottom:
                      i < arr.length - 1
                        ? "1px solid var(--border)"
                        : "none",
                  }}
                >
                  <td
                    style={{
                      padding: "12px 0",
                      width: "40%",
                      color: "var(--muted)",
                      fontSize: "0.875rem",
                    }}
                  >
                    {row.label}
                  </td>
                  <td
                    style={{
                      padding: "12px 0",
                      color: "var(--text)",
                      fontWeight: 500,
                    }}
                  >
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="small" style={{ color: "var(--muted)", margin: 0 }}>
            No technical attributes available for this product.
          </p>
        )}
        {tags.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div className="small" style={{ color: "var(--muted)", marginBottom: 8 }}>
              Tags
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {tags.map((tag) => (
                <span key={tag} className="badge badge-gray">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
