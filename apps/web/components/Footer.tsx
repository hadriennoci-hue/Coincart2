"use client";

import Link from "next/link";

export function SiteFooter() {
  return (
    <footer style={{
      background: "var(--surface)",
      borderTop: "1px solid var(--border)",
      padding: "11px 0",
    }}>
      <div className="container">
        <div className="footer-inner">
          {/* Logo */}
          <Link href="/" className="footer-logo" aria-label="Coincart home" style={{ display: "inline-flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <img
              src="/coincart-logo-mark.png"
              alt="Coincart"
              style={{ height: 51, width: "auto", display: "block" }}
            />
            <span className="footer-logo-text" style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "0.01em" }}>Coincart</span>
          </Link>

          {/* Right side: links + copyright */}
          <div className="footer-right">
            <div className="footer-links" style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
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
            <p className="caption footer-copy" style={{ color: "var(--muted-2)" }}>© {new Date().getFullYear()} Coincart</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
