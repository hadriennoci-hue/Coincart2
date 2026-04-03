"use client";

import { useRef } from "react";

interface SortSelectProps {
  sort: string;
  q: string;
  group: string;
  category: string;
  collection: string;
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
}

export function SortSelect({
  sort,
  q,
  group,
  category,
  collection,
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
}: SortSelectProps) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} method="get" action="/search" style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {q && <input type="hidden" name="q" value={q} />}
      {group && <input type="hidden" name="group" value={group} />}
      {category && <input type="hidden" name="category" value={category} />}
      {collection && <input type="hidden" name="collection" value={collection} />}
      {cpu && <input type="hidden" name="cpu" value={cpu} />}
      {gpu && <input type="hidden" name="gpu" value={gpu} />}
      {resolution && <input type="hidden" name="resolution" value={resolution} />}
      {refresh_rate && <input type="hidden" name="refresh_rate" value={refresh_rate} />}
      {storage && <input type="hidden" name="storage" value={storage} />}
      {keyboard_layout && <input type="hidden" name="keyboard_layout" value={keyboard_layout} />}
      {usage && <input type="hidden" name="usage" value={usage} />}
      {screen_size && <input type="hidden" name="screen_size" value={screen_size} />}
      {ram_memory && <input type="hidden" name="ram_memory" value={ram_memory} />}
      {ssd_size && <input type="hidden" name="ssd_size" value={ssd_size} />}
      {max_resolution && <input type="hidden" name="max_resolution" value={max_resolution} />}
      <span style={{ fontSize: "0.8rem", color: "var(--muted)", whiteSpace: "nowrap" }}>Sort:</span>
      <select
        className="select"
        name="sort"
        defaultValue={sort}
        style={{ fontSize: "0.8rem", padding: "5px 10px", minWidth: 160 }}
        onChange={() => formRef.current?.submit()}
      >
        <option value="default">Default</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
        <option value="popularity">Popularity</option>
        <option value="newest">Newest</option>
      </select>
    </form>
  );
}
