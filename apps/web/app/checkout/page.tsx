"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createCheckoutSession, fetchProductsBySkus, type Currency, type Product } from "../../lib/api";
import { getBundleDiscountForCart } from "../../lib/bundles";
import { fmtPrice } from "../../lib/format";
import { clearCart, getCart, type CartLine } from "../../lib/cart";
import { computeCouponDiscount, getStoredCoupon, isSupportedCoupon, setStoredCoupon } from "../../lib/coupon";
import { calculateShippingCost, ESTIMATED_DELIVERY_DAYS, SHIPPING_FREE_THRESHOLD_EUR, SHIPPING_METHOD } from "../../lib/shipping";

const euCountries = [
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "BG", name: "Bulgaria" },
  { code: "HR", name: "Croatia" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czechia" },
  { code: "DK", name: "Denmark" },
  { code: "EE", name: "Estonia" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "GR", name: "Greece" },
  { code: "HU", name: "Hungary" },
  { code: "IE", name: "Ireland" },
  { code: "IT", name: "Italy" },
  { code: "LV", name: "Latvia" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MT", name: "Malta" },
  { code: "NL", name: "Netherlands" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "RO", name: "Romania" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" },
];

export default function CheckoutPage() {
  const [shippingName, setShippingName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("FR");
  const [streetAddress, setStreetAddress] = useState("");
  const [secondaryAddress, setSecondaryAddress] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [cartProducts, setCartProducts] = useState<Product[]>([]);
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get("currency");
    if (c === "USD" || c === "EUR") setCurrency(c);
  }, []);

  useEffect(() => {
    const loadCart = () => {
      const lines = getCart();
      setCartLines(lines);
      if (lines.length === 0) {
        setCartProducts([]);
        return;
      }
      fetchProductsBySkus(lines.map((l) => l.sku), currency)
        .then(setCartProducts)
        .catch(() => setCartProducts([]));
    };

    loadCart();
    window.addEventListener("cartupdate", loadCart);
    return () => window.removeEventListener("cartupdate", loadCart);
  }, [currency]);

  useEffect(() => {
    const syncCoupon = () => {
      const stored = getStoredCoupon();
      setAppliedCoupon(stored);
      setCouponCode(stored || "");
    };
    syncCoupon();
    window.addEventListener("couponupdate", syncCoupon);
    return () => window.removeEventListener("couponupdate", syncCoupon);
  }, []);

  const normalizeSku = (value: string) => value.trim().toUpperCase();
  const productBySku = new Map(cartProducts.map((product) => [normalizeSku(product.sku), product]));
  const summaryRows = cartLines.map((line) => {
    const product = productBySku.get(normalizeSku(line.sku));
    const unitPrice =
      typeof product?.price === "number"
        ? product.price
        : typeof line.snapshot?.price === "number"
          ? line.snapshot.price
          : 0;
    const name = product?.name || line.snapshot?.name || line.sku;
    return {
      sku: line.sku,
      quantity: line.quantity,
      name,
      lineTotal: unitPrice * line.quantity,
    };
  });
  const subtotal = summaryRows.reduce((acc, line) => acc + line.lineTotal, 0);
  const bundleDiscount = getBundleDiscountForCart(cartLines, productBySku, currency).totalSavings;
  const discountedSubtotal = Math.max(0, subtotal - bundleDiscount);
  const couponDiscount = computeCouponDiscount(discountedSubtotal, appliedCoupon);
  const payableSubtotal = Math.max(0, discountedSubtotal - couponDiscount);
  const shippingCost = calculateShippingCost(currency, discountedSubtotal);
  const grandTotal = payableSubtotal + shippingCost;

  const missingRequired = {
    shippingName: shippingName.trim().length === 0,
    streetAddress: streetAddress.trim().length === 0,
    city: city.trim().length === 0,
    postcode: postcode.trim().length === 0,
    email: email.trim().length === 0,
    phone: phone.trim().length === 0,
  };
  const hasMissingRequired = Object.values(missingRequired).some(Boolean);
  const showMissing = (key: keyof typeof missingRequired) =>
    attemptedSubmit && missingRequired[key] ? (
      <span style={{ color: "var(--error)", marginLeft: 4 }}>*</span>
    ) : null;

  const submit = async () => {
    try {
      setAttemptedSubmit(true);
      setLoading(true);
      setError("");
      if (hasMissingRequired) throw new Error("Please fill all required fields.");
      if (!agreeTerms) throw new Error("Please accept the Terms of Sale and Privacy Policy.");
      const lines = getCart();
      if (lines.length === 0) throw new Error("Cart is empty");
      const session = await createCheckoutSession({
        email,
        phone,
        shippingName,
        companyName: companyName.trim() || undefined,
        streetAddress,
        secondaryAddress: secondaryAddress.trim() || undefined,
        city,
        postcode,
        shippingCountry: country,
        shippingNotes: orderNotes.trim() || undefined,
        agreeTermsAccepted: agreeTerms,
        currency,
        couponCode: isSupportedCoupon(appliedCoupon) ? appliedCoupon || undefined : undefined,
        lines,
      });
      clearCart();
      window.location.href = session.checkoutUrl || `/order/${session.orderId}`;
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
      <div className="checkout-layout">
        {/* Left: Form */}
        <div>
          <h1 className="page-title" style={{ marginBottom: 8 }}>
            Checkout
          </h1>
          <p className="small" style={{ marginBottom: 32, color: "var(--muted)" }}>
            Guest checkout - no account required.
          </p>

          {/* Shipping Details */}
          <div className="surface" style={{ marginBottom: 20 }}>
            <h2 className="card-title" style={{ marginBottom: 20 }}>
              Shipping Details
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label className="form-label">
                Full Name *
                <input
                  className="input"
                  value={shippingName}
                  onChange={(e) => setShippingName(e.target.value)}
                  placeholder="Your full name"
                />
              </label>
              <label className="form-label">
                Company Name{" "}
                <span style={{ color: "var(--muted-2)" }}>(optional)</span>
                <input
                  className="input"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Company or organization"
                />
              </label>
              <label className="form-label">
                Country *
                <select
                  className="select"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  {euCountries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-label">
                Street Address *
                <input
                  className="input"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="Street and house number"
                />
              </label>
              <label className="form-label">
                Secondary Address{" "}
                <span style={{ color: "var(--muted-2)" }}>(optional)</span>
                <input
                  className="input"
                  value={secondaryAddress}
                  onChange={(e) => setSecondaryAddress(e.target.value)}
                  placeholder="Apartment, suite, floor, etc."
                />
              </label>
              <div className="checkout-two-col">
                <label className="form-label">
                  City *
                  {showMissing("city")}
                  <input
                    className="input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                  />
                </label>
                <label className="form-label">
                  Postcode *
                  {showMissing("postcode")}
                  <input
                    className="input"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    placeholder="Postal code"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="surface" style={{ marginBottom: 20 }}>
            <h2 className="card-title" style={{ marginBottom: 20 }}>
              Contact{" "}
              <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--muted)" }}>(used by the transporter)</span>
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label className="form-label">
                Email *
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </label>
              <label className="form-label">
                Phone *{" "}
                <span style={{ color: "var(--muted-2)" }}>(will be communicated to DHL)</span>
                <input
                  className="input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+33 6 00 00 00 00"
                />
              </label>
            </div>
          </div>

          {/* Order Notes */}
          <div className="surface" style={{ marginBottom: 20 }}>
            <h2 className="card-title" style={{ marginBottom: 20 }}>
              Order Notes{" "}
              <span style={{ color: "var(--muted-2)", fontWeight: 400 }}>
                (optional)
              </span>
            </h2>
            <label className="form-label">
              Notes
              <textarea
                className="textarea"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows={4}
                placeholder="Any special instructions or notes for your order..."
              />
            </label>
          </div>

          {/* Terms */}
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              cursor: "pointer",
              marginBottom: 16,
            }}
          >
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              style={{ marginTop: 2, flexShrink: 0 }}
            />
            <span className="small">
              I have read and agree to the{" "}
              <Link
                href="/terms-of-sale"
                style={{ color: "var(--primary)", textDecoration: "underline" }}
              >
                Terms of Sale
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy-policy"
                style={{ color: "var(--primary)", textDecoration: "underline" }}
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid var(--error)",
                borderRadius: 8,
                padding: "10px 14px",
                color: "var(--error)",
                fontSize: "0.875rem",
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Right: Order Summary */}
        <div className="checkout-summary-column">
          <div className="surface" style={{ marginBottom: 16 }}>
            <h2 className="card-title" style={{ marginBottom: 20 }}>
              Order Summary
            </h2>

            {/* Cart Items */}
            {summaryRows.length > 0 && (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                  {summaryRows.map((line) => (
                    <div
                      key={line.sku}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, minWidth: 0 }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--muted)", flexShrink: 0, paddingTop: 1 }}>x{line.quantity}</span>
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--text)",
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {line.name}
                        </span>
                      </div>
                      <span style={{ fontSize: "0.8rem", fontWeight: 600, flexShrink: 0, color: "var(--muted)", paddingTop: 1 }}>
                        {fmtPrice(line.lineTotal, currency)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="divider" style={{ marginBottom: 16 }} />
              </>
            )}

            {/* Coupon */}
            <div style={{ marginBottom: 20 }}>
              <label className="form-label">
                Coupon Code
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="input"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    style={{ flex: 1 }}
                  />
                  <button
                    className="btn btn-ghost"
                    onClick={() => setStoredCoupon(couponCode)}
                    type="button"
                  >
                    Apply
                  </button>
                </div>
              </label>
              {isSupportedCoupon(appliedCoupon) && (
                <div className="small text-success" style={{ marginTop: 6 }}>
                  Coupon COINCART5 applied - 5% off
                </div>
              )}
              {appliedCoupon && !isSupportedCoupon(appliedCoupon) && (
                <div className="small text-error" style={{ marginTop: 6 }}>
                  Invalid coupon code
                </div>
              )}
            </div>

            <div className="divider" style={{ marginBottom: 16 }} />

            {/* Shipping Info */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{SHIPPING_METHOD}</div>
                  <div className="caption">Estimated {ESTIMATED_DELIVERY_DAYS} business days</div>
                </div>
                <div style={{ fontWeight: 600, color: "var(--text)" }}>
                  {shippingCost === 0 ? "Free" : fmtPrice(shippingCost, currency)}
                </div>
              </div>
              <div className="caption">
                Free shipping over {SHIPPING_FREE_THRESHOLD_EUR}€
              </div>
            </div>

            {summaryRows.length > 0 && (
              <>
                <div className="divider" style={{ margin: "0 0 16px" }} />
                {bundleDiscount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span className="small" style={{ color: "var(--accent)" }}>Bundle savings</span>
                    <span style={{ fontWeight: 600, color: "var(--accent)" }}>
                      -{fmtPrice(bundleDiscount, currency)}
                    </span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span className="small" style={{ color: "var(--accent)" }}>Discount</span>
                    <span style={{ fontWeight: 600, color: "var(--accent)" }}>
                      -{fmtPrice(couponDiscount, currency)}
                    </span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span style={{ fontWeight: 700 }}>Total</span>
                  <span style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--accent)" }}>
                    {fmtPrice(grandTotal, currency)}
                  </span>
                </div>
              </>
            )}

            <p className="small" style={{ color: "var(--muted)", marginBottom: 4 }}>
              Shipping is available within the EU only.{" "}
              <Link
                href="/shipping-policy"
                style={{ color: "var(--primary)", textDecoration: "underline" }}
              >
                See shipping policy
              </Link>
              .
            </p>
          </div>

          <button
            className="btn btn-primary btn-full btn-lg"
            onClick={submit}
            disabled={loading || hasMissingRequired || !agreeTerms}
            type="button"
          >
            {loading ? "Creating session..." : "Pay with crypto"}
          </button>

          <div className="caption" style={{ marginTop: 10, textAlign: "center" }}>
            Secure: You will be redirected to BTCPay Server
          </div>
        </div>
      </div>
    </div>
  );
}
