import type { CollectionKey } from "./collections";

/**
 * Maps a product's collection key to a prioritised list of cross-sell SKUs.
 * The current product's own SKU is always excluded at call time.
 * SKUs are manufacturer part numbers shared across both Coincart and Komputerzz.
 */
const CROSS_SELL_SKUS: Partial<Record<CollectionKey, string[]>> = {
  "gaming-laptops":     ["GP.MCE11.039", "GP.MCE11.03S", "GP.HDS11.01P"],
  "work-laptops":       ["GP.MCE11.039", "GP.MCE11.03S", "GP.HDS11.01L"],
  "mice":               ["NH.QVEEB.004", "GP.HDS11.01P", "UM.QX1EE.307", "DP.Z4EWW.P01"],
  "gaming-monitors":    ["GP.MCE11.039", "GP.MCE11.03S", "GP.HDS11.01P"],
  "monitors":           ["GP.MCE11.039", "GP.MCE11.03S", "GP.HDS11.01L"],
  "ultrawide-monitors": ["GP.MCE11.039", "GP.MCE11.03S", "GP.HDS11.01P"],
  "foldable-monitors":  ["GP.MCE11.039", "GP.HDS11.01L", "NH.QVEEB.004"],
  "headsets-earbuds":   ["GP.MCE11.039", "GP.MCE11.03S", "NH.QVEEB.004"],
  "keyboards":          ["GP.MCE11.039", "GP.MCE11.03S", "GP.HDS11.01P"],
  "controllers":        ["GP.HDS11.01P", "GP.HDS11.01L", "NH.QVEEB.004"],
  "desktops":           ["DP.Z4EWW.P01", "GP.MCE11.039", "GP.HDS11.01P"],
  "storage":            ["NH.QVEEB.004", "UM.QX1EE.307", "GP.MCE11.039"],
  "accessories":        ["GP.MCE11.039", "NH.QVEEB.004", "GP.HDS11.01L"],
  "docking-stations":   ["NH.QVEEB.004", "GP.MCE11.039", "GP.HDS11.01L"],
  "gaming-chairs":      ["GP.MCE11.039", "GP.HDS11.01P", "NH.QVEEB.004"],
  "graphics-cards":     ["DP.Z4EWW.P01", "GP.MCE11.039", "GP.HDS11.01P"],
  "webcams":            ["GP.HDS11.01L", "NH.QVEEB.004", "GP.MCE11.039"],
};

/**
 * Returns up to `limit` cross-sell SKUs for a given collection,
 * excluding the current product's own SKU.
 */
export function getCrossSellSkus(
  collectionKey: string,
  currentSku: string,
  limit = 3,
): string[] {
  const skus = CROSS_SELL_SKUS[collectionKey as CollectionKey] ?? [];
  return skus.filter((sku) => sku !== currentSku).slice(0, limit);
}
