import { bundleRules, calculateBundleDiscount, type BundleRule } from "@coincart/types";
import type { Currency, Product } from "./api";
import type { CartLine } from "./cart";

const normalizeSku = (value: string) => value.trim().toUpperCase();

export type BundleProductOffer = BundleRule & {
  bundleProduct?: Product;
};

export const getBundleRulesForSku = (sku: string): BundleRule[] => {
  const normalizedSku = normalizeSku(sku);
  return bundleRules.filter((rule: BundleRule) => normalizeSku(rule.primarySku) === normalizedSku);
};

export const getBundleOffersForSku = (
  sku: string,
  bundleProducts: Product[],
): BundleProductOffer[] => {
  const bySku = new Map(bundleProducts.map((product) => [normalizeSku(product.sku), product]));
  return getBundleRulesForSku(sku)
    .map((rule: BundleRule) => ({
      ...rule,
      bundleProduct: bySku.get(normalizeSku(rule.secondarySku)),
    }))
    .filter((rule: BundleProductOffer) => Boolean(rule.bundleProduct));
};

export const getBundleDiscountForCart = (
  lines: CartLine[],
  productsBySku: Map<string, Product>,
  currency: Currency,
) =>
  calculateBundleDiscount(
    lines.map((line) => {
      const product = productsBySku.get(normalizeSku(line.sku));
      const snapshotPrice =
        typeof line.snapshot?.price === "number" && Number.isFinite(line.snapshot.price)
          ? line.snapshot.price
          : 0;
      return {
        sku: line.sku,
        quantity: line.quantity,
        unitPrice: product?.price ?? snapshotPrice,
      };
    }),
    currency,
  );
