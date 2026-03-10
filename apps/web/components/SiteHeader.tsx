"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCart } from "../lib/cart";

export function SiteHeader() {
  const [cartCount, setCartCount] = useState(0);

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
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      width: "100%",
      height: "var(--navbar-h)",
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      display: "flex",
      alignItems: "center",
    }}>
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 32px",
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "var(--primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L14.196 5V11L9 14L3.804 11V5L9 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="9" cy="9" r="2" fill="white"/>
            </svg>
          </div>
          <span style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text)" }}>Coincart</span>
        </Link>

        {/* Search */}
        <form action="/" method="get" style={{ flex: 1, maxWidth: 540, display: "flex", gap: 8 }}>
          <input
            name="q"
            placeholder="Search products..."
            className="input"
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-teal" style={{ flexShrink: 0 }}>Search</button>
        </form>

        {/* Actions */}
        <nav style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
          <Link href="/cart" className="btn btn-ghost" style={{ position: "relative" }}>
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
          <Link href="/account" className="btn btn-ghost">Account</Link>
        </nav>
      </div>
    </header>
  );
}
