"use client";

import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";

type VariantOption = {
  slug: string;
  keyboardLayout: string;
  sku: string;
};

export function ProductVariantSelect({
  currency,
  currentSlug,
  options,
}: {
  currency: "EUR" | "USD";
  currentSlug: string;
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
      Keyboard Layout
      <select className="select" value={currentSlug} onChange={onChange} aria-label="Keyboard Layout">
        {options.map((option) => (
          <option key={option.slug} value={option.slug}>
            {option.keyboardLayout} ({option.sku})
          </option>
        ))}
      </select>
    </label>
  );
}
