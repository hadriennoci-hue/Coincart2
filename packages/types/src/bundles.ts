import type { Currency } from "./contracts";

export type BundleRule = {
  id: string;
  primarySku: string;
  secondarySku: string;
  savings: Record<Currency, number>;
};

export type BundlePricedLine = {
  sku: string;
  quantity: number;
  unitPrice: number;
};

export type BundleMatch = {
  ruleId: string;
  primarySku: string;
  secondarySku: string;
  quantity: number;
  savingsPerBundle: number;
  totalSavings: number;
};

export const bundleRules: BundleRule[] = [
  {
    id: "galea-330-plus-mouse",
    primarySku: "GP.HDS11.01P",
    secondarySku: "GP.MCE11.03S",
    savings: {
      EUR: 10,
      USD: 11,
    },
  },
  {
    id: "galea-330-plus-controller",
    primarySku: "GP.HDS11.01P",
    secondarySku: "GP.OTH11.074",
    savings: {
      EUR: 15,
      USD: 16,
    },
  },
];

export const calculateBundleDiscount = (
  lines: BundlePricedLine[],
  currency: Currency,
) => {
  const quantityBySku = new Map<string, number>();
  for (const line of lines) {
    const sku = String(line.sku || "").trim().toUpperCase();
    if (!sku) continue;
    quantityBySku.set(sku, (quantityBySku.get(sku) || 0) + Math.max(0, line.quantity));
  }

  const rulesByPrimary = new Map<string, BundleRule[]>();
  for (const rule of bundleRules) {
    const primarySku = rule.primarySku.trim().toUpperCase();
    const existing = rulesByPrimary.get(primarySku) || [];
    existing.push(rule);
    rulesByPrimary.set(primarySku, existing);
  }

  const matches: BundleMatch[] = [];

  for (const [primarySku, rules] of rulesByPrimary.entries()) {
    let remainingPrimary = quantityBySku.get(primarySku) || 0;
    if (remainingPrimary <= 0) continue;

    const secondaryRemaining = new Map<string, number>();
    for (const rule of rules) {
      secondaryRemaining.set(
        rule.secondarySku.trim().toUpperCase(),
        quantityBySku.get(rule.secondarySku.trim().toUpperCase()) || 0,
      );
    }

    const prioritizedRules = [...rules].sort(
      (a, b) => b.savings[currency] - a.savings[currency],
    );

    for (const rule of prioritizedRules) {
      if (remainingPrimary <= 0) break;
      const secondarySku = rule.secondarySku.trim().toUpperCase();
      const remainingSecondary = secondaryRemaining.get(secondarySku) || 0;
      if (remainingSecondary <= 0) continue;

      const quantity = Math.min(remainingPrimary, remainingSecondary);
      if (quantity <= 0) continue;

      const savingsPerBundle = rule.savings[currency];
      matches.push({
        ruleId: rule.id,
        primarySku,
        secondarySku,
        quantity,
        savingsPerBundle,
        totalSavings: Number((quantity * savingsPerBundle).toFixed(2)),
      });

      remainingPrimary -= quantity;
      secondaryRemaining.set(secondarySku, remainingSecondary - quantity);
    }
  }

  const totalSavings = Number(
    matches.reduce((sum, match) => sum + match.totalSavings, 0).toFixed(2),
  );

  return { matches, totalSavings };
};
