"use client";

import { useState } from "react";
import Link from "next/link";

interface SearchFiltersProps {
  category: string;
  collection: string;
  keyboard_layout: string;
  usage: string;
  screen_size: string;
  ram_memory: string;
  ssd_size: string;
  max_resolution: string;
  q: string;
  collections: [string, number][];
  keyboardLayouts: string[];
  usages: string[];
  screenSizes: string[];
  ramOptions: number[];
  ssdOptions: number[];
}

export function SearchFilters({
  category,
  collection,
  keyboard_layout,
  usage,
  screen_size,
  ram_memory,
  ssd_size,
  max_resolution,
  q,
  collections,
  keyboardLayouts,
  usages,
  screenSizes,
  ramOptions,
  ssdOptions,
}: SearchFiltersProps) {
  const [open, setOpen] = useState(false);

  const hasActiveFilters =
    collection || category || keyboard_layout || usage || screen_size || ram_memory || ssd_size || max_resolution;

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="search-filter-toggle"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 3h12M3 7h8M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Filters
        {hasActiveFilters && <span className="search-filter-dot" />}
      </button>

      {/* Filter form â€” always visible on desktop, toggle on mobile */}
      <form
        method="get"
        action="/search"
        className={`search-filter-form${open ? " search-filter-form--open" : ""}`}
      >
        {q && <input type="hidden" name="q" value={q} />}
        <div className="search-filter-header">
          <span style={{ fontWeight: 700, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.5 }}>
              <path d="M1 3h12M3 7h8M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Filters
          </span>
          {/* Close button on mobile */}
          <button
            type="button"
            className="search-filter-close"
            onClick={() => setOpen(false)}
            aria-label="Close filters"
          >
            âœ•
          </button>
        </div>

        <label className="form-label" style={{ gap: 6 }}>
          Collection
          <select className="select" name="collection" defaultValue={collection || category}>
            <option value="">All collections</option>
            {collections.map(([name, count]) => (
              <option key={name} value={name}>
                {name} ({count})
              </option>
            ))}
          </select>
        </label>

        {keyboardLayouts.length > 0 && (
          <label className="form-label" style={{ gap: 6 }}>
            Keyboard Layout
            <select className="select" name="keyboard_layout" defaultValue={keyboard_layout}>
              <option value="">All layouts</option>
              {keyboardLayouts.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>
        )}

        {usages.length > 0 && (
          <label className="form-label" style={{ gap: 6 }}>
            Usage
            <select className="select" name="usage" defaultValue={usage}>
              <option value="">All usages</option>
              {usages.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>
        )}

        {screenSizes.length > 0 && (
          <label className="form-label" style={{ gap: 6 }}>
            Screen Size
            <select className="select" name="screen_size" defaultValue={screen_size}>
              <option value="">All sizes</option>
              {screenSizes.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>
        )}

        {ramOptions.length > 0 && (
          <label className="form-label" style={{ gap: 6 }}>
            RAM (GB)
            <select className="select" name="ram_memory" defaultValue={ram_memory}>
              <option value="">All RAM</option>
              {ramOptions.map((v) => (
                <option key={v} value={String(v)}>{v} GB</option>
              ))}
            </select>
          </label>
        )}

        {ssdOptions.length > 0 && (
          <label className="form-label" style={{ gap: 6 }}>
            SSD (GB)
            <select className="select" name="ssd_size" defaultValue={ssd_size}>
              <option value="">All SSD</option>
              {ssdOptions.map((v) => (
                <option key={v} value={String(v)}>{v} GB</option>
              ))}
            </select>
          </label>
        )}

        <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
          <button className="btn btn-primary btn-sm" type="submit" style={{ flex: 1 }}>Apply</button>
          <Link className="btn btn-ghost btn-sm" href="/search" style={{ flex: 1, textAlign: "center" }}>Reset</Link>
        </div>
      </form>
    </>
  );
}
