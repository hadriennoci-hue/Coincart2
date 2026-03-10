"use client";

import Link from "next/link";

export function SiteFooter() {
  return (
    <footer style={{
      background: "var(--surface)",
      borderTop: "1px solid var(--border)",
      padding: "20px 0",
    }}>
      <div className="container">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          {/* Logo */}
          <Link href="/" aria-label="Coincart home" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <img
              src="/coincart-logo-mark.png"
              alt="Coincart"
              style={{ height: 68, width: "auto", display: "block" }}
            />
            <span style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "0.01em" }}>Coincart</span>
          </Link>

          {/* Legal links */}
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
            {[
              { href: "/contact-us", label: "Contact" },
              { href: "/faq", label: "FAQ" },
              { href: "/privacy-policy", label: "Privacy Policy" },
              { href: "/terms-of-sale", label: "Terms of Sale" },
              { href: "/shipping-policy", label: "Shipping Policy" },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="caption" style={{ color: "var(--muted-2)", transition: "color 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted-2)")}>
                {label}
              </Link>
            ))}
          </div>

          <p className="caption" style={{ color: "var(--muted-2)" }}>© {new Date().getFullYear()} Coincart</p>
        </div>
      </div>
    </footer>
  );
}
