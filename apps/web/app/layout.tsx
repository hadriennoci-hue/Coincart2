import "./globals.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/Footer";

export const runtime = 'edge';

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://coincart-web.pages.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Coincart - Crypto Electronics Store",
    template: "%s | Coincart",
  },
  description:
    "Buy electronics with crypto on Coincart. EU shipping, transparent policies, and secure BTCPay checkout.",
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Coincart - Crypto Electronics Store",
    description:
      "Buy electronics with crypto on Coincart. EU shipping, transparent policies, and secure BTCPay checkout.",
    siteName: "Coincart",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
