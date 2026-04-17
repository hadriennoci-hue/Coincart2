/**
 * Static review data for Coincart.
 * Reviews are sourced from the Judge.me CSV export and stored as a
 * pre-built JSON file. No API calls needed — fully static, edge-compatible.
 */
import reviewsData from "./reviews-data.json";

export interface ProductReview {
  id: string;
  title?: string | null;
  body: string;
  rating: number;
  reviewerName: string;
  createdAt?: string | null;
  verified: boolean;
}

export interface ProductReviewSummary {
  averageRating: number;
  reviewCount: number;
}

type ReviewsMap = Record<string, ProductReview[]>;
const data = reviewsData as ReviewsMap;

/** All reviews for a given product handle, newest-first, up to limit. */
export function getReviewsByHandle(handle: string, limit = 6): ProductReview[] {
  return (data[handle] ?? []).slice(0, limit);
}

/** Summary (average rating + count) for a single product. */
export function getReviewSummary(handle: string): ProductReviewSummary {
  const reviews = data[handle] ?? [];
  const reviewCount = reviews.length;
  if (reviewCount === 0) return { averageRating: 0, reviewCount: 0 };
  const averageRating =
    Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10;
  return { averageRating, reviewCount };
}

/** Map of product_handle → { averageRating, reviewCount } for all reviewed products. */
export function getAllReviewSummaries(): Record<string, ProductReviewSummary> {
  const result: Record<string, ProductReviewSummary> = {};
  for (const handle of Object.keys(data)) {
    result[handle] = getReviewSummary(handle);
  }
  return result;
}

/** Summary + up to `limit` reviews for display on product pages. */
export function getProductReviewsPayload(
  handle: string,
  limit = 6,
): { summary: ProductReviewSummary; reviews: ProductReview[] } {
  return {
    summary: getReviewSummary(handle),
    reviews: getReviewsByHandle(handle, limit),
  };
}
