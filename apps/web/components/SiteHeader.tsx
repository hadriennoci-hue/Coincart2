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
    <header className="header">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Link href="/">
          <h1 style={{ margin: 0 }}>Coincart</h1>
        </Link>
      </div>

      <form action="/" method="get" style={{ display: "flex", gap: 8, flex: 1, maxWidth: 560 }}>
        <input
          name="q"
          placeholder="Search products..."
          style={{ flex: 1, border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px" }}
        />
        <button className="button secondary" type="submit">
          Search
        </button>
      </form>

      <div style={{ display: "flex", gap: 10 }}>
        <Link className="button secondary" href="/cart">
          {cartLabel}
        </Link>
        <Link className="button secondary" href="/account">
          Account
        </Link>
      </div>
    </header>
  );
}

