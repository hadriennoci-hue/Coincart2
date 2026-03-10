import "./globals.css";
import { Inter, Space_Grotesk } from "next/font/google";
import type { Metadata } from "next";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/Footer";
import { ToastProvider } from "../components/ui/ToastProvider";
import { BeamsBackground } from "../components/ui/beams-background";

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
    "Buy electronics with crypto on Coincart. EU shipping, transparent policies, and secure BTCPay checkout.",
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Coincart - Crypto Electronics Store",
    description:
      "Buy electronics with crypto on Coincart. EU shipping, transparent policies, and secure BTCPay checkout.",
    siteName: "Coincart",
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        <BeamsBackground />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <ToastProvider />
      </body>
    </html>
  );
}
