"use client";

import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";

type VariantOption = {
  slug: string;
  label: string;
  sku: string;
};

export function ProductVariantSelect({
  currency,
  currentSlug,
  label,
  options,
}: {
  currency: "EUR" | "USD";
  currentSlug: string;
  label: string;
  options: VariantOption[];
}) {
  const router = useRouter();

  const onChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextSlug = event.target.value;
    if (!nextSlug || nextSlug === currentSlug) return;
    router.push(`/product/${nextSlug}?currency=${currency}`);
  };

  return (
    <label className="form-label" style={{ gap: 6 }}>
      {label}
      <select className="select" value={currentSlug} onChange={onChange} aria-label={label}>
        {options.map((option) => (
          <option key={option.slug} value={option.slug}>
            {option.label} ({option.sku})
          </option>
        ))}
      </select>
    </label>
  );
}
