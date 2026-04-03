"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, Search, X } from "lucide-react";
import { getCart } from "../lib/cart";

type DesktopMenuKey = "accessories" | "desktops" | "laptops" | "monitors" | null;

const laptopMenuSections = [
  {
    title: "Shop laptops",
    links: [
      { label: "Gaming Laptops", href: "/search?collection=gaming-laptops" },
      { label: "Work Laptops", href: "/search?collection=work-laptops" },
      { label: "View all laptops", href: "/search?group=laptops" },
    ],
  },
  {
    title: "Shop by specs",
    links: [
      { label: "RTX 4050", href: "/search?q=RTX%204050" },
      { label: "RTX 4060", href: "/search?q=RTX%204060" },
      { label: "RTX 4070", href: "/search?q=RTX%204070" },
      { label: "RTX 4080", href: "/search?q=RTX%204080" },
      { label: "16GB RAM", href: "/search?group=laptops&ram_memory=16" },
      { label: "1TB SSD", href: "/search?group=laptops&ssd_size=1000" },
    ],
  },
  {
    title: "Shop by size",
    links: [
      { label: '14"', href: "/search?group=laptops&screen_size=14.0%22" },
      { label: '15.6"', href: "/search?group=laptops&screen_size=15.6%22" },
      { label: '17"', href: "/search?group=laptops&screen_size=17.3%22" },
    ],
  },
];

const desktopMenuSections = [
  {
    title: "Shop desktops",
    links: [
      { label: "Desktop PCs", href: "/search?collection=desktops" },
      { label: "Mini Desktops", href: "/search?group=desktops&q=mini" },
      { label: "View all desktops", href: "/search?group=desktops" },
    ],
  },
  {
    title: "Popular setups",
    links: [
      { label: "Gaming", href: "/search?group=desktops&q=gaming" },
      { label: "Office", href: "/search?group=desktops&q=office" },
      { label: "Compact", href: "/search?group=desktops&q=small" },
    ],
  },
  {
    title: "Shop by use",
    links: [
      { label: "Home office", href: "/search?group=desktops&q=office" },
      { label: "Family PC", href: "/search?group=desktops&q=home" },
      { label: "Performance", href: "/search?group=desktops&q=performance" },
    ],
  },
];

const monitorMenuSections = [
  {
    title: "Shop monitors",
    links: [
      { label: "Gaming Monitors", href: "/search?collection=gaming-monitors" },
      { label: "Monitors", href: "/search?collection=monitors" },
      { label: "View all monitors", href: "/search?group=monitors" },
    ],
  },
  {
    title: "Specialized",
    links: [
      { label: "Ultrawide Monitors", href: "/search?collection=ultrawide-monitors" },
      { label: "Foldable Monitors", href: "/search?collection=foldable-monitors" },
      { label: "Projectors", href: "/search?collection=projectors" },
    ],
  },
  {
    title: "Shop by need",
    links: [
      { label: "High refresh", href: "/search?group=monitors&refresh_rate=144" },
      { label: "4K displays", href: "/search?group=monitors&resolution=3840x2160" },
      { label: "Large screens", href: "/search?group=monitors&screen_size=34.0%22" },
    ],
  },
];

const accessoryMenuSections = [
  {
    title: "Shop accessories",
    links: [
      { label: "Graphics Cards", href: "/search?collection=graphics-cards" },
      { label: "Mice", href: "/search?collection=mice" },
      { label: "Keyboards", href: "/search?collection=keyboards" },
      { label: "View all accessories", href: "/search?group=accessories" },
    ],
  },
  {
    title: "Desk setup",
    links: [
      { label: "Headsets & Earbuds", href: "/search?collection=headsets-earbuds" },
      { label: "Docking Stations", href: "/search?collection=docking-stations" },
      { label: "Connectivity", href: "/search?collection=connectivity" },
    ],
  },
  {
    title: "Carry and add-ons",
    links: [
      { label: "Laptop Bags", href: "/search?collection=laptop-bags" },
      { label: "Storage", href: "/search?collection=storage" },
      { label: "Webcams", href: "/search?collection=webcams" },
    ],
  },
];

export function SiteHeader() {
  const [cartCount, setCartCount] = useState(0);
  const [showBar, setShowBar] = useState(true);
  const [desktopMenu, setDesktopMenu] = useState<DesktopMenuKey>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileLaptopsOpen, setMobileLaptopsOpen] = useState(true);

  useEffect(() => {
    const sync = () => {
      const count = getCart().reduce((acc, item) => acc + item.quantity, 0);
      setCartCount(count);
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    window.addEventListener("cartupdate", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener("cartupdate", sync);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const closeDesktopMenu = () => setDesktopMenu(null);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="site-header-wrap" style={{ position: "relative", zIndex: 30 }}>
      {showBar && (
        <div
          style={{
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
          }}
        >
          <span>Use <b>COINCART5</b> for 5% off. Valid through December 31, 2026</span>
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

      <header
        className="site-header"
        style={{
          zIndex: 100,
          width: "100%",
          minHeight: "var(--navbar-h)",
          background: "rgba(30, 41, 59, 0.95)",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          className="header-inner"
          onMouseLeave={closeDesktopMenu}
          style={{
            maxWidth: 1320,
            margin: "0 auto",
            padding: "0 24px",
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 14,
            minHeight: "var(--navbar-h)",
            position: "relative",
          }}
        >
          <div className="header-brand">
            <Link
              href="/"
              aria-label="Coincart home"
              className="header-logo-link"
              style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}
              onClick={closeMobileMenu}
            >
              <img src="/coincart-logo-mark.png" alt="Coincart" style={{ height: 68, width: "auto", display: "block" }} />
              <span className="header-logo-text" style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "0.01em" }}>
                Coincart
              </span>
            </Link>

            <button
              type="button"
              className="header-mobile-menu-btn btn btn-ghost"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((value) => !value)}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              <span className="header-mobile-menu-label">Menu</span>
            </button>
          </div>

          <form action="/search" method="get" className="header-search-form header-search-form--desktop" style={{ flex: "0 1 270px" }}>
            <div className="header-search-shell">
              <Search size={15} />
              <input name="q" placeholder="Search products..." className="input header-search-input" />
            </div>
          </form>

          <nav className="header-primary-nav" aria-label="Primary">
            <div
              className="header-nav-group"
              onMouseEnter={() => setDesktopMenu("laptops")}
              onFocus={() => setDesktopMenu("laptops")}
            >
              <button type="button" className={`header-nav-trigger${desktopMenu === "laptops" ? " is-active" : ""}`}>
                Laptops
                <ChevronDown size={15} />
              </button>
            </div>

            <div
              className="header-nav-group"
              onMouseEnter={() => setDesktopMenu("desktops")}
              onFocus={() => setDesktopMenu("desktops")}
            >
              <button type="button" className={`header-nav-trigger${desktopMenu === "desktops" ? " is-active" : ""}`}>
                Desktops
                <ChevronDown size={15} />
              </button>
            </div>

            <div
              className="header-nav-group"
              onMouseEnter={() => setDesktopMenu("monitors")}
              onFocus={() => setDesktopMenu("monitors")}
            >
              <button type="button" className={`header-nav-trigger${desktopMenu === "monitors" ? " is-active" : ""}`}>
                Monitors
                <ChevronDown size={15} />
              </button>
            </div>

            <div
              className="header-nav-group"
              onMouseEnter={() => setDesktopMenu("accessories")}
              onFocus={() => setDesktopMenu("accessories")}
            >
              <button type="button" className={`header-nav-trigger${desktopMenu === "accessories" ? " is-active" : ""}`}>
                Accessories
                <ChevronDown size={15} />
              </button>
            </div>

            <Link href="/#promotions" className="header-nav-link header-nav-link--accent">
              Deals
            </Link>
          </nav>

          <div className="header-actions">
            <form action="/search" method="get" className="header-search-form header-search-form--mobile">
              <div className="header-search-shell">
                <Search size={15} />
                <input name="q" placeholder="Search..." className="input header-search-input" />
              </div>
            </form>

            <Link href="/cart" className="btn btn-ghost header-cart-link" style={{ position: "relative" }}>
              Cart
              {cartCount > 0 && (
                <span className="header-cart-badge">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
          </div>

          {desktopMenu === "laptops" && (
            <div className="header-mega-panel header-mega-panel--wide">
              <div className="header-mega-grid header-mega-grid--three">
                {laptopMenuSections.map((section) => (
                  <div key={section.title} className="header-mega-column">
                    <div className="header-mega-title">{section.title}</div>
                    <div className="header-mega-links">
                      {section.links.map((link) => (
                        <Link key={link.label} href={link.href} className="header-mega-link" onClick={closeDesktopMenu}>
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {desktopMenu === "desktops" && (
            <div className="header-mega-panel header-mega-panel--wide">
              <div className="header-mega-grid header-mega-grid--three">
                {desktopMenuSections.map((section) => (
                  <div key={section.title} className="header-mega-column">
                    <div className="header-mega-title">{section.title}</div>
                    <div className="header-mega-links">
                      {section.links.map((link) => (
                        <Link key={link.label} href={link.href} className="header-mega-link" onClick={closeDesktopMenu}>
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {desktopMenu === "monitors" && (
            <div className="header-mega-panel header-mega-panel--wide">
              <div className="header-mega-grid header-mega-grid--three">
                {monitorMenuSections.map((section) => (
                  <div key={section.title} className="header-mega-column">
                    <div className="header-mega-title">{section.title}</div>
                    <div className="header-mega-links">
                      {section.links.map((link) => (
                        <Link key={link.label} href={link.href} className="header-mega-link" onClick={closeDesktopMenu}>
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {desktopMenu === "accessories" && (
            <div className="header-mega-panel header-mega-panel--wide header-mega-panel--right">
              <div className="header-mega-grid header-mega-grid--three">
                {accessoryMenuSections.map((section) => (
                  <div key={section.title} className="header-mega-column">
                    <div className="header-mega-title">{section.title}</div>
                    <div className="header-mega-links">
                      {section.links.map((link) => (
                        <Link key={link.label} href={link.href} className="header-mega-link" onClick={closeDesktopMenu}>
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {mobileMenuOpen && (
        <>
          <button type="button" className="header-mobile-backdrop" aria-label="Close menu" onClick={closeMobileMenu} />
          <div className="header-mobile-drawer">
            <div className="header-mobile-drawer-top">
              <div className="header-mobile-title">Menu</div>
              <button type="button" className="header-mobile-close" aria-label="Close menu" onClick={closeMobileMenu}>
                <X size={18} />
              </button>
            </div>

            <div className="header-mobile-nav">
              <button
                type="button"
                className="header-mobile-parent"
                onClick={() => setMobileLaptopsOpen((value) => !value)}
              >
                <span>Laptops</span>
                <ChevronDown size={16} className={mobileLaptopsOpen ? "is-open" : ""} />
              </button>

              {mobileLaptopsOpen && (
                <div className="header-mobile-subnav">
                  <Link href="/search?collection=gaming-laptops" onClick={closeMobileMenu}>Gaming</Link>
                  <Link href="/search?collection=work-laptops" onClick={closeMobileMenu}>Work</Link>
                  <Link href="/search?group=laptops" onClick={closeMobileMenu}>View all</Link>
                </div>
              )}
              <Link href="/search?group=desktops" className="header-mobile-link" onClick={closeMobileMenu}>Desktops</Link>
              <Link href="/#promotions" className="header-mobile-link" onClick={closeMobileMenu}>Deals</Link>

              <button type="button" className="header-mobile-parent header-mobile-parent--static">
                <span>Monitors</span>
              </button>
              <div className="header-mobile-subnav">
                <Link href="/search?collection=gaming-monitors" onClick={closeMobileMenu}>Gaming</Link>
                <Link href="/search?collection=monitors" onClick={closeMobileMenu}>Standard</Link>
                <Link href="/search?collection=ultrawide-monitors" onClick={closeMobileMenu}>Ultrawide</Link>
                <Link href="/search?group=monitors" onClick={closeMobileMenu}>View all</Link>
              </div>

              <button type="button" className="header-mobile-parent header-mobile-parent--static">
                <span>Accessories</span>
              </button>
              <div className="header-mobile-subnav">
                <Link href="/search?collection=graphics-cards" onClick={closeMobileMenu}>Graphics Cards</Link>
                <Link href="/search?collection=mice" onClick={closeMobileMenu}>Mice</Link>
                <Link href="/search?collection=keyboards" onClick={closeMobileMenu}>Keyboards</Link>
                <Link href="/search?collection=headsets-earbuds" onClick={closeMobileMenu}>Audio</Link>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}
