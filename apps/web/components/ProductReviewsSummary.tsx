import type { ProductReviewSummary } from "../lib/reviews";

const renderStars = (rating: number) => {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return Array.from({ length: 5 }, (_, index) => (index < rounded ? "★" : "☆")).join("");
};

export function ProductReviewsSummary({
  summary,
  dark = false,
}: {
  summary: ProductReviewSummary;
  dark?: boolean;
}) {
  if (!summary.reviewCount) return null;

  const textColor = dark ? "rgba(255,255,255,0.9)" : "var(--text)";
  const mutedColor = dark ? "rgba(255,255,255,0.5)" : "var(--muted)";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginTop: 4,
        fontSize: "0.95rem",
        color: textColor,
      }}
    >
      <span style={{ color: "#f59e0b", letterSpacing: 1.5, fontSize: "1rem" }}>
        {renderStars(summary.averageRating)}
      </span>
      <span style={{ fontWeight: 700 }}>{summary.averageRating.toFixed(1)}</span>
      <a
        href="#product-reviews"
        style={{
          color: mutedColor,
          textDecoration: "underline",
          textUnderlineOffset: 3,
        }}
      >
        {summary.reviewCount} review{summary.reviewCount === 1 ? "" : "s"}
      </a>
    </div>
  );
}
