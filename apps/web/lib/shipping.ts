import type { Currency } from "./api";

export const SHIPPING_METHOD = "DHL Standard";
export const ESTIMATED_DELIVERY_DAYS = 5;
export const SHIPPING_FEE_EUR = 7.9;
export const SHIPPING_FREE_THRESHOLD_EUR = 100;
const EUR_TO_USD = 1.1;

const roundCurrency = (value: number) => Number(value.toFixed(2));

export const shippingFeeForCurrency = (currency: Currency) =>
  currency === "EUR" ? SHIPPING_FEE_EUR : roundCurrency(SHIPPING_FEE_EUR * EUR_TO_USD);

export const shippingFreeThresholdForCurrency = (currency: Currency) =>
  currency === "EUR" ? SHIPPING_FREE_THRESHOLD_EUR : roundCurrency(SHIPPING_FREE_THRESHOLD_EUR * EUR_TO_USD);

export const calculateShippingCost = (currency: Currency, subtotalBeforeCouponDiscounts: number) => {
  const threshold = shippingFreeThresholdForCurrency(currency);
  if (subtotalBeforeCouponDiscounts >= threshold) return 0;
  return shippingFeeForCurrency(currency);
};
