"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { getCart } from "../lib/cart";

export function SiteHeader() {
  const [cartCount, setCartCount] = useState(0);
  const [showBar, setShowBar] = useState(true);

  useEffect(() => {
    const sync = () => {
      const count = getCart().reduce((acc, item) => acc + item.quantity, 0);
      setCartCount(count);
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const cartLabel = useMemo(() => (cartCount > 0 ? `Cart (${cartCount})` : "Cart"), [cartCount]);

  return (
    <div style={{ position: "sticky", top: 0, zIndex: 100 }}>
      {showBar && (
        <div style={{
          background: "var(--primary)",
          color: "#fff",
          fontSize: "0.8rem",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "6px 16px",
          position: "relative",
          whiteSpace: "nowrap",
        }}>
          <span>Use <b>COINCART10</b> for 10% off — Valid through December 31, 2026</span>
          <button
            onClick={() => setShowBar(false)}
            aria-label="Dismiss"
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              padding: 4,
              borderRadius: 4,
            }}
          >
            <X size={13} />
          </button>
        </div>
      )}
    <header style={{
      zIndex: 100,
      width: "100%",
      height: "var(--navbar-h)",
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      display: "flex",
      alignItems: "center",
    }}>
      <div className="header-inner" style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 32px",
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}>
        {/* Logo */}
        <Link href="/" aria-label="Coincart home" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <img
            src="/coincart-logo-mark.png"
            alt="Coincart"
            style={{ height: 51, width: "auto", display: "block" }}
          />
          <span className="header-logo-text" style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "0.01em" }}>Coincart</span>
        </Link>

        {/* Search */}
        <form action="/search" method="get" style={{ flex: 1, maxWidth: 540 }}>
          <input
            name="q"
            placeholder="Search products..."
            className="input"
            style={{ width: "100%" }}
          />
        </form>

        {/* Actions */}
        <nav style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
          <Link href="/cart" className="btn btn-ghost" style={{ position: "relative", padding: "7px 14px", fontSize: "0.8rem" }}>
            {cartLabel}
            {cartCount > 0 && (
              <span style={{
                position: "absolute",
                top: -6, right: -6,
                background: "var(--accent)",
                color: "#fff",
                borderRadius: "50%",
                width: 18, height: 18,
                fontSize: "0.65rem",
                fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
    </div>
  );
}
