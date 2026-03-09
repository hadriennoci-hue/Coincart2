import "./globals.css";
import Link from "next/link";
import { SiteHeader } from "../components/SiteHeader";

export const runtime = 'edge';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>
          <SiteHeader />
          {children}
          <footer className="card" style={{ marginTop: 24 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
              <Link className="button secondary" href="/faq">
                FAQ
              </Link>
              <Link className="button secondary" href="/privacy-policy">
                Privacy Policy
              </Link>
              <Link className="button secondary" href="/terms-of-sale">
                Terms of Sale
              </Link>
              <Link className="button secondary" href="/contact-us">
                Contact
              </Link>
            </div>
            <p className="small" style={{ margin: 0 }}>
              Pay safely with BTCPay Server. You will be redirected to our payment processor to complete your purchase.
            </p>
            <p className="small" style={{ marginBottom: 0 }}>© Coincart</p>
          </footer>
        </main>
      </body>
    </html>
  );
}
