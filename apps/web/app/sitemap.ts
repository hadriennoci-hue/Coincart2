import type { MetadataRoute } from "next";
import { fetchProducts } from "../lib/api";

const staticRoutes = [
  "",
  "/faq",
  "/privacy-policy",
  "/terms-of-sale",
  "/contact-us",
  "/cart",
  "/checkout",
  "/search",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://coincart-web.pages.dev";
  const now = new Date();

  const staticEntries = staticRoutes.map((path) => {
    const changeFrequency: "daily" | "weekly" = path === "" ? "daily" : "weekly";
    return {
      url: `${siteUrl}${path}`,
      lastModified: now,
      changeFrequency,
      priority: path === "" ? 1 : 0.65,
    };
  });

  const products = await fetchProducts("EUR", false).catch(() => []);
  const productEntries = products.map((product) => ({
    url: `${siteUrl}/product/${product.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.85,
  }));

  return [...staticEntries, ...productEntries];
}
