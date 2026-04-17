import type { ProductReview, ProductReviewSummary } from "../lib/reviews";

const renderStars = (rating: number) => {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return Array.from({ length: 5 }, (_, index) => (index < rounded ? "★" : "☆")).join("");
};

const formatReviewDate = (value?: string | null) => {
  if (!value) return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" }).format(new Date(timestamp));
};

const initialsFromName = (name: string) => {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return "A";
  return parts.map((part) => part[0]!.toUpperCase()).join("");
};

export function ProductReviewsSection({
  summary,
  reviews,
}: {
  summary: ProductReviewSummary;
  reviews: ProductReview[];
}) {
  if (!summary.reviewCount) return null;

  return (
    <section
      id="product-reviews"
      className="surface"
      style={{ marginTop: 24, padding: 24 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "end",
          gap: 16,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 className="card-title" style={{ marginBottom: 8 }}>
            Customer Reviews
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "#f59e0b", letterSpacing: 1.5 }}>
              {renderStars(summary.averageRating)}
            </span>
            <span style={{ fontWeight: 700 }}>{summary.averageRating.toFixed(1)}</span>
            <span style={{ color: "var(--muted)" }}>
              based on {summary.reviewCount} review{summary.reviewCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {reviews.map((review) => (
          <article
            key={review.id}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 18,
              background: "var(--surface-2, #fff)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "999px",
                  background: "#111827",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  flexShrink: 0,
                }}
              >
                {initialsFromName(review.reviewerName)}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "var(--text)" }}>{review.reviewerName}</div>
                <div style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                  {formatReviewDate(review.createdAt) ?? "Verified buyer"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ color: "#f59e0b", letterSpacing: 1.2 }}>{renderStars(review.rating)}</span>
              {review.verified && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#047857",
                    background: "#ecfdf5",
                    borderRadius: 999,
                    padding: "4px 8px",
                  }}
                >
                  Verified
                </span>
              )}
            </div>

            {review.title && (
              <div style={{ fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>
                {review.title}
              </div>
            )}
            <p style={{ margin: 0, lineHeight: 1.6, color: "var(--text)", whiteSpace: "pre-line", opacity: 0.85 }}>
              {review.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
