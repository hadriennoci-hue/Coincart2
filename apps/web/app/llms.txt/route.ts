export const runtime = "edge";

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://coincart-web.pages.dev";
  const body = [
    "# Coincart",
    "",
    "Coincart is an ecommerce storefront for electronics purchasable with crypto.",
    "Primary market: Europe (EU shipping).",
    "",
    "## Key URLs",
    `- Home: ${siteUrl}/`,
    `- Search: ${siteUrl}/search`,
    `- FAQ: ${siteUrl}/faq`,
    `- Terms of Sale: ${siteUrl}/terms-of-sale`,
    `- Privacy Policy: ${siteUrl}/privacy-policy`,
    `- Shipping Policy: ${siteUrl}/shipping-policy`,
    "",
    "## Crawling",
    `- robots: ${siteUrl}/robots.txt`,
    `- sitemap: ${siteUrl}/sitemap.xml`,
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
