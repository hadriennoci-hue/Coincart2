"use client";

import { useState } from "react";
import Link from "next/link";

interface SearchFiltersProps {
  category: string;
  keyboard_layout: string;
  usage: string;
  screen_size: string;
  ram_memory: string;
  ssd_size: string;
  max_resolution: string;
  q: string;
  categories: [string, number][];
}

export function SearchFilters({
  category,
  keyboard_layout,
  usage,
  screen_size,
  ram_memory,
  ssd_size,
  max_resolution,
  q,
  categories,
}: SearchFiltersProps) {
  const [open, setOpen] = useState(false);

  const hasActiveFilters = category || keyboard_layout || usage || screen_size || ram_memory || ssd_size || max_resolution;

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

      {/* Filter form — always visible on desktop, toggle on mobile */}
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
            ✕
          </button>
        </div>

        <label className="form-label" style={{ gap: 6 }}>
          Category
          <select className="select" name="category" defaultValue={category}>
            <option value="">All categories</option>
            {categories.map(([name, count]) => (
              <option key={name} value={name}>
                {name} ({count})
              </option>
            ))}
          </select>
        </label>

        <label className="form-label" style={{ gap: 6 }}>
          Keyboard Layout
          <input className="input" name="keyboard_layout" defaultValue={keyboard_layout} placeholder="e.g. AZERTY" />
        </label>

        <label className="form-label" style={{ gap: 6 }}>
          Usage
          <input className="input" name="usage" defaultValue={usage} placeholder="e.g. Gaming" />
        </label>

        <label className="form-label" style={{ gap: 6 }}>
          Screen Size
          <input className="input" name="screen_size" defaultValue={screen_size} placeholder='e.g. 15.6"' />
        </label>

        <label className="form-label" style={{ gap: 6 }}>
          RAM (GB)
          <input className="input" name="ram_memory" defaultValue={ram_memory} placeholder="e.g. 16" />
        </label>

        <label className="form-label" style={{ gap: 6 }}>
          SSD (GB)
          <input className="input" name="ssd_size" defaultValue={ssd_size} placeholder="e.g. 512" />
        </label>

        <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
          <button className="btn btn-primary btn-sm" type="submit" style={{ flex: 1 }}>Apply</button>
          <Link className="btn btn-ghost btn-sm" href="/search" style={{ flex: 1, textAlign: "center" }}>Reset</Link>
        </div>
      </form>
    </>
  );
}
