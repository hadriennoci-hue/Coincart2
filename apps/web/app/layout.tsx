import "./globals.css";
import { Inter, Space_Grotesk } from "next/font/google";
import type { Metadata } from "next";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/Footer";
import { ToastProvider } from "../components/ui/ToastProvider";
import { BackgroundPaths } from "../components/ui/background-paths";

export const runtime = 'edge';

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://coincart-web.pages.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Coincart - Crypto Electronics Store",
    template: "%s | Coincart",
  },
  description:
    "Buy Laptops, PCs, Acer Monitors, Gaming Laptops, GPUs, Desktops & More.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  keywords: [
    "crypto electronics store",
    "buy electronics with crypto",
    "EU electronics delivery",
    "BTC checkout",
    "Monero checkout",
    "Coincart",
  ],
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Coincart - Crypto Electronics Store",
    description:
      "Buy Laptops, PCs, Acer Monitors, Gaming Laptops, GPUs, Desktops & More.",
    siteName: "Coincart",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coincart - Crypto Electronics Store",
    description:
      "Buy Laptops, PCs, Acer Monitors, Gaming Laptops, GPUs, Desktops & More.",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Coincart",
    url: siteUrl,
    logo: `${siteUrl}/favicon.png`,
  };

  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <BackgroundPaths />
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
        <ToastProvider />
      </body>
    </html>
  );
}
