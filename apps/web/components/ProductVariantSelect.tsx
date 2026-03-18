"use client";

import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";

type VariantEntry = {
  slug: string;
  sku: string;
  optionValue: string;
  optionValue2?: string | null;
};

export function ProductVariantSelect({
  currency,
  currentSlug,
  label,
  label2,
  variants,
}: {
  currency: "EUR" | "USD";
  currentSlug: string;
  label: string;
  label2?: string | null;
  variants: VariantEntry[];
}) {
  const router = useRouter();

  const navigate = (slug: string) => {
    if (!slug || slug === currentSlug) return;
    router.push(`/product/${slug}?currency=${currency}`);
  };

  const current = variants.find((v) => v.slug === currentSlug);
  const currentOv1 = current?.optionValue ?? variants[0]?.optionValue ?? "";
  const currentOv2 = current?.optionValue2 ?? "";

  const findBest = (ov1: string, ov2: string) =>
    variants.find((v) => v.optionValue === ov1 && (v.optionValue2 ?? "") === ov2) ??
    variants.find((v) => v.optionValue === ov1) ??
    null;

  // 1D: single selector
  if (!label2) {
    const onChange = (e: ChangeEvent<HTMLSelectElement>) => navigate(e.target.value);
    return (
      <label className="form-label" style={{ gap: 6 }}>
        {label}
        <select className="select" value={currentSlug} onChange={onChange} aria-label={label}>
          {variants.map((v) => (
            <option key={v.slug} value={v.slug}>
              {v.optionValue} ({v.sku})
            </option>
          ))}
        </select>
      </label>
    );
  }

  // 2D: two selectors
  const option1Values = [...new Set(variants.map((v) => v.optionValue))].sort();
  const option2Values = [...new Set(variants.map((v) => v.optionValue2 ?? "").filter(Boolean))].sort();

  const onChangeOption1 = (e: ChangeEvent<HTMLSelectElement>) => {
    const target = findBest(e.target.value, currentOv2);
    if (target) navigate(target.slug);
  };

  const onChangeOption2 = (e: ChangeEvent<HTMLSelectElement>) => {
    const target = findBest(currentOv1, e.target.value);
    if (target) navigate(target.slug);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label className="form-label" style={{ gap: 6 }}>
        {label}
        <select className="select" value={currentOv1} onChange={onChangeOption1} aria-label={label}>
          {option1Values.map((ov1) => {
            const available = variants.some(
              (v) => v.optionValue === ov1 && (v.optionValue2 ?? "") === currentOv2,
            );
            return (
              <option key={ov1} value={ov1} disabled={!available}>
                {ov1}{!available ? " (unavailable)" : ""}
              </option>
            );
          })}
        </select>
      </label>
      <label className="form-label" style={{ gap: 6 }}>
        {label2}
        <select className="select" value={currentOv2} onChange={onChangeOption2} aria-label={label2 ?? ""}>
          {option2Values.map((ov2) => {
            const available = variants.some(
              (v) => v.optionValue === currentOv1 && (v.optionValue2 ?? "") === ov2,
            );
            return (
              <option key={ov2} value={ov2} disabled={!available}>
                {ov2}{!available ? " (unavailable)" : ""}
              </option>
            );
          })}
        </select>
      </label>
    </div>
  );
}
