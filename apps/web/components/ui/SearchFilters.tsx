"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { FormEventHandler } from "react";
import { isDisplayCollectionKey, isLaptopCollectionKey } from "../../lib/collections";

interface SearchFiltersProps {
  category: string;
  collection: string;
  group: string;
  cpu: string;
  gpu: string;
  resolution: string;
  refresh_rate: string;
  storage: string;
  keyboard_layout: string;
  usage: string;
  screen_size: string;
  ram_memory: string;
  ssd_size: string;
  max_resolution: string;
  q: string;
  collections: Array<{ key: string; label: string; count: number }>;
  cpuOptions: string[];
  gpuOptions: string[];
  laptopResolutionOptions: string[];
  displayResolutionOptions: string[];
  refreshRateOptions: number[];
  storageOptions: string[];
  keyboardLayouts: string[];
  usages: string[];
  screenSizes: string[];
  ramOptions: number[];
  ssdOptions: number[];
}

type CollectionBucketKey = "accessories" | "desktops" | "laptops" | "monitors";

const collectionBuckets: Array<{
  key: CollectionBucketKey;
  label: string;
  matches: string[];
}> = [
  {
    key: "laptops",
    label: "Laptops",
    matches: ["gaming-laptops", "work-laptops"],
  },
  {
    key: "desktops",
    label: "Desktops",
    matches: ["desktops"],
  },
  {
    key: "monitors",
    label: "Monitors",
    matches: ["gaming-monitors", "monitors", "ultrawide-monitors", "foldable-monitors", "projectors"],
  },
  {
    key: "accessories",
    label: "Accessories",
    matches: [
      "graphics-cards",
      "mice",
      "keyboards",
      "headsets-earbuds",
      "audio",
      "accessories",
      "connectivity",
      "docking-stations",
      "laptop-bags",
      "storage",
      "webcams",
      "cameras",
      "controllers",
      "gaming-chairs",
      "gaming-consoles",
      "gaming-desks",
      "electric-scooters",
    ],
  },
];

export function SearchFilters({
  category,
  collection,
  group,
  cpu,
  gpu,
  resolution,
  refresh_rate,
  storage,
  keyboard_layout,
  usage,
  screen_size,
  ram_memory,
  ssd_size,
  max_resolution,
  q,
  collections,
  cpuOptions,
  gpuOptions,
  laptopResolutionOptions,
  displayResolutionOptions,
  refreshRateOptions,
  storageOptions,
  keyboardLayouts,
  usages,
  screenSizes,
  ramOptions,
  ssdOptions,
}: SearchFiltersProps) {
  const [open, setOpen] = useState(false);
  const normalizedCollection = (collection || category || "").trim().toLowerCase();
  const normalizedGroup = group.trim().toLowerCase();
  const defaultBucket =
    collectionBuckets.find((bucket) => bucket.matches.includes(normalizedCollection))?.key ||
    (collectionBuckets.some((bucket) => bucket.key === normalizedGroup) ? (normalizedGroup as CollectionBucketKey) : "");
  const [selectedCollection, setSelectedCollection] = useState(collection || category || "");
  const [selectedGroup, setSelectedGroup] = useState(group || defaultBucket);
  const [activeBucket, setActiveBucket] = useState<CollectionBucketKey | "">(defaultBucket as CollectionBucketKey | "");
  const [expandedBucket, setExpandedBucket] = useState<CollectionBucketKey | "">(defaultBucket as CollectionBucketKey | "");

  const getBucketCollections = (bucketKey: CollectionBucketKey | "") => {
    if (!bucketKey) return collections;
    const bucket = collectionBuckets.find((entry) => entry.key === bucketKey);
    if (!bucket) return collections;
    return collections.filter(({ key }) => bucket.matches.includes(key));
  };

  const visibleCollections = useMemo(
    () => getBucketCollections(activeBucket),
    [activeBucket, collections],
  );

  const taxonomyContext = (selectedCollection || selectedGroup || normalizedCollection || normalizedGroup).trim().toLowerCase();
  const isLaptopCollection = isLaptopCollectionKey(taxonomyContext) || taxonomyContext === "laptops";
  const isDisplayCollection = isDisplayCollectionKey(taxonomyContext) || taxonomyContext === "monitors";

  const hasActiveFilters =
    collection || category || cpu || gpu || resolution || refresh_rate || storage || keyboard_layout || usage || screen_size || ram_memory || ssd_size || max_resolution;
  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const params = new URLSearchParams();
    const formData = new FormData(form);

    for (const [key, rawValue] of formData.entries()) {
      if (typeof rawValue !== "string") continue;
      const value = rawValue.trim();
      if (!value) continue;
      params.set(key, value);
    }

    const query = params.toString();
    window.location.href = query ? `/search?${query}` : "/search";
  };

  return (
    <>
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

      <form
        method="get"
        action="/search"
        onSubmit={handleSubmit}
        className={`search-filter-form${open ? " search-filter-form--open" : ""}`}
      >
        {q && <input type="hidden" name="q" value={q} />}
        {!!selectedGroup && <input type="hidden" name="group" value={selectedGroup} />}
        {!!selectedCollection && <input type="hidden" name="collection" value={selectedCollection} />}
        <div className="search-filter-header">
          <span style={{ fontWeight: 700, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.5 }}>
              <path d="M1 3h12M3 7h8M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Filters
          </span>
          <button
            type="button"
            className="search-filter-close"
            onClick={() => setOpen(false)}
            aria-label="Close filters"
          >
            x
          </button>
        </div>

        <div className="search-filter-collection-desktop">
          <div className="search-filter-section-title">Collections</div>
          <div className="search-filter-accordion">
            {collectionBuckets.map((bucket) => (
              <div key={bucket.key} className={`search-filter-accordion-item${activeBucket === bucket.key ? " is-active" : ""}`}>
                <button
                  type="button"
                  className={`search-filter-accordion-trigger${expandedBucket === bucket.key ? " is-open" : ""}`}
                  onClick={() => {
                    setExpandedBucket((current) => (current === bucket.key ? "" : bucket.key));
                    setActiveBucket(bucket.key);
                    setSelectedGroup(bucket.key);
                    setSelectedCollection("");
                  }}
                >
                  <span>{bucket.label}</span>
                  <span className="search-filter-accordion-meta">
                    <span className="search-filter-accordion-count">
                      {getBucketCollections(bucket.key).reduce((sum, item) => sum + item.count, 0)}
                    </span>
                    <span className="search-filter-accordion-chevron" aria-hidden="true">+</span>
                  </span>
                </button>

                {expandedBucket === bucket.key && (
                  <div className="search-filter-subcollections">
                    <button
                      type="button"
                      className={`search-filter-subcollection${activeBucket === bucket.key && selectedCollection === "" ? " is-active" : ""}`}
                      onClick={() => {
                        setActiveBucket(bucket.key);
                        setSelectedCollection("");
                        setSelectedGroup(bucket.key);
                      }}
                    >
                      <span>{`All ${bucket.label.toLowerCase()}`}</span>
                    </button>

                    {getBucketCollections(bucket.key).map(({ key, label, count }) => (
                      <button
                        key={key}
                        type="button"
                        className={`search-filter-subcollection${selectedCollection === key ? " is-active" : ""}`}
                        onClick={() => {
                          setActiveBucket(bucket.key);
                          setSelectedCollection(key);
                          setSelectedGroup(bucket.key);
                        }}
                      >
                        <span>{label}</span>
                        <span className="search-filter-subcollection-count">{count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <label className="form-label search-filter-collection-mobile" style={{ gap: 6 }}>
          Collection
          <select
            className="select"
            name="collection-mobile"
            value={selectedCollection}
            onChange={(event) => {
              const nextCollection = event.target.value;
              setSelectedCollection(nextCollection);
              const nextBucket = collectionBuckets.find((bucket) => bucket.matches.includes(nextCollection))?.key || "";
              setActiveBucket(nextBucket);
              setExpandedBucket(nextBucket);
              setSelectedGroup(nextBucket || selectedGroup);
            }}
          >
            <option value="">All collections</option>
            {collections.map(({ key, label, count }) => (
              <option key={key} value={key}>
                {label} ({count})
              </option>
            ))}
          </select>
        </label>

        {isLaptopCollection && cpuOptions.length > 0 && (
          <label className="form-label" style={{ gap: 6 }}>
            CPU
            <select className="select" name="cpu" defaultValue={cpu}>
              <option value="">All CPUs</option>
              {cpuOptions.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>
        )}

        {isLaptopCollection && gpuOptions.length > 0 && (
          <label className="form-label" style={{ gap: 6 }}>
            GPU
            <select className="select" name="gpu" defaultValue={gpu}>
              <option value="">All GPUs</option>
              {gpuOptions.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>
        )}

        {isLaptopCollection && screenSizes.length > 0 && (
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

        {isLaptopCollection && laptopResolutionOptions.length > 0 && (
          <label className="form-label" style={{ gap: 6 }}>
            Resolution
            <select className="select" name="resolution" defaultValue={resolution}>
              <option value="">All resolutions</option>
              {laptopResolutionOptions.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>
        )}

        {isLaptopCollection && ramOptions.length > 0 && (
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

        {isLaptopCollection && storageOptions.length > 0 && (
          <label className="form-label" style={{ gap: 6 }}>
            Storage
            <select className="select" name="storage" defaultValue={storage}>
              <option value="">All storage</option>
              {storageOptions.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>
        )}

        {isDisplayCollection && displayResolutionOptions.length > 0 && (
          <label className="form-label" style={{ gap: 6 }}>
            Resolution
            <select className="select" name="resolution" defaultValue={resolution}>
              <option value="">All resolutions</option>
              {displayResolutionOptions.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>
        )}

        {isDisplayCollection && refreshRateOptions.length > 0 && (
          <label className="form-label" style={{ gap: 6 }}>
            Refresh Rate
            <select className="select" name="refresh_rate" defaultValue={refresh_rate}>
              <option value="">All refresh rates</option>
              {refreshRateOptions.map((v) => (
                <option key={v} value={String(v)}>{v} Hz</option>
              ))}
            </select>
          </label>
        )}

        {isLaptopCollection && keyboardLayouts.length > 0 && (
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

        {isLaptopCollection && usages.length > 0 && (
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

        {!isLaptopCollection && screenSizes.length > 0 && (
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

        {!isLaptopCollection && ramOptions.length > 0 && (
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
