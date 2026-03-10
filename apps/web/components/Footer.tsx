"use client";

import Link from "next/link";

export function SiteFooter() {
  return (
    <footer style={{
      background: "var(--surface)",
      borderTop: "1px solid var(--border)",
      padding: "48px 0 0",
    }}>
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 48, paddingBottom: 48 }}>
          {/* Brand */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Link href="/" aria-label="Coincart home" style={{ display: "inline-flex", alignItems: "center", width: "fit-content" }}>
              <img
                src="/coincart-logo.png"
                alt="Coincart"
                style={{ height: 38, width: "auto", display: "block" }}
              />
            </Link>
            <p className="small" style={{ lineHeight: 1.6, maxWidth: 300 }}>
              Buy electronics with crypto. EU shipping, official ACER partner, secure BTCPay checkout.
            </p>
            <p className="caption" style={{ color: "var(--muted-2)" }}>
              Pay safely with BTCPay Server. You will be redirected to our payment processor to complete your purchase.
            </p>
          </div>

          {/* Shop */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Shop</p>
            {[
              { href: "/", label: "Catalog" },
              { href: "/cart", label: "Cart" },
              { href: "/checkout", label: "Checkout" },
              { href: "/contact-us", label: "Contact" },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="small" style={{ color: "var(--muted)", transition: "color 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}>
                {label}
              </Link>
            ))}
          </div>

          {/* Legal */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Legal</p>
            {[
              { href: "/faq", label: "FAQ" },
              { href: "/privacy-policy", label: "Privacy Policy" },
              { href: "/terms-of-sale", label: "Terms of Sale" },
              { href: "/shipping-policy", label: "Shipping Policy" },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="small" style={{ color: "var(--muted)", transition: "color 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: "1px solid var(--border)",
          padding: "20px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}>
          <p className="caption">© {new Date().getFullYear()} Coincart. All rights reserved.</p>
          <p className="caption">Your shipping information is used to process order delivery.</p>
        </div>
      </div>
    </footer>
  );
}
