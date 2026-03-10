import type { MetadataRoute } from "next";

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

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://coincart-web.pages.dev";
  const now = new Date();
  return staticRoutes.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: path === "" ? 1 : 0.7,
  }));
}
