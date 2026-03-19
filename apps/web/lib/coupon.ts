"use client";

const COUPON_KEY = "coincart.coupon.v1";
const SUPPORTED_COUPON = "COINCART5";

const normalizeCoupon = (value: string | null | undefined) => String(value || "").trim().toUpperCase();

export const getStoredCoupon = (): string | null => {
  if (typeof window === "undefined") return null;
  const code = normalizeCoupon(window.localStorage.getItem(COUPON_KEY));
  return code || null;
};

export const setStoredCoupon = (code: string | null) => {
  if (typeof window === "undefined") return;
  const normalized = normalizeCoupon(code);
  if (!normalized) {
    window.localStorage.removeItem(COUPON_KEY);
  } else {
    window.localStorage.setItem(COUPON_KEY, normalized);
  }
  window.dispatchEvent(new Event("couponupdate"));
};

export const isSupportedCoupon = (code: string | null) =>
  normalizeCoupon(code) === SUPPORTED_COUPON;

export const computeCouponDiscount = (total: number, code: string | null) => {
  if (!isSupportedCoupon(code)) return 0;
  return total * 0.05;
};
