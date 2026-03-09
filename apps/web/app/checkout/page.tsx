"use client";

import { useEffect, useState } from "react";
import { createCheckoutSession, type Currency } from "../../lib/api";
import { clearCart, getCart } from "../../lib/cart";

export default function CheckoutPage() {
  const [shippingName, setShippingName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [secondaryAddress, setSecondaryAddress] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [currency, setCurrency] = useState<Currency>("USD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get("currency");
    if (c === "USD" || c === "EUR") setCurrency(c);
  }, []);

  const submit = async () => {
    try {
      setLoading(true);
      setError("");
      const lines = getCart();
      if (lines.length === 0) throw new Error("Cart is empty");
      const session = await createCheckoutSession({ email, phone: phone || undefined, currency, lines });
      clearCart();
      window.location.href = `/order/${session.orderId}`;
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <h2>Checkout</h2>
      <p className="small">Guest checkout. Shipping details are used to process your order.</p>
      <label>
        Shipping Name
        <input
          value={shippingName}
          onChange={(e) => setShippingName(e.target.value)}
          style={{ width: "100%", marginTop: 4, marginBottom: 10, padding: 8 }}
        />
      </label>
      <label>
        Company Name (optional)
        <input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          style={{ width: "100%", marginTop: 4, marginBottom: 10, padding: 8 }}
        />
      </label>
      <label>
        Country
        <input
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          style={{ width: "100%", marginTop: 4, marginBottom: 10, padding: 8 }}
        />
      </label>
      <label>
        Street Address
        <input
          value={streetAddress}
          onChange={(e) => setStreetAddress(e.target.value)}
          style={{ width: "100%", marginTop: 4, marginBottom: 10, padding: 8 }}
        />
      </label>
      <label>
        Secondary Address (optional)
        <input
          value={secondaryAddress}
          onChange={(e) => setSecondaryAddress(e.target.value)}
          style={{ width: "100%", marginTop: 4, marginBottom: 10, padding: 8 }}
        />
      </label>
      <label>
        City
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          style={{ width: "100%", marginTop: 4, marginBottom: 10, padding: 8 }}
        />
      </label>
      <label>
        Postcode
        <input
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          style={{ width: "100%", marginTop: 4, marginBottom: 10, padding: 8 }}
        />
      </label>
      <label>
        Email
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          style={{ width: "100%", marginTop: 4, marginBottom: 10, padding: 8 }}
        />
      </label>
      <label>
        Phone (optional)
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          type="tel"
          style={{ width: "100%", marginTop: 4, marginBottom: 10, padding: 8 }}
        />
      </label>
      <label>
        Order Notes (optional)
        <textarea
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          rows={4}
          style={{ width: "100%", marginTop: 4, marginBottom: 10, padding: 8 }}
        />
      </label>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button className="button secondary" onClick={() => setCurrency("USD")}>USD</button>
        <button className="button secondary" onClick={() => setCurrency("EUR")}>EUR</button>
      </div>
      <p className="small" style={{ marginTop: -4 }}>
        You will be redirected to BTCPay Server to complete your payment.
      </p>
      <label style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
        <span className="small">I have read and agree to the website terms and conditions.</span>
      </label>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <button className="button" onClick={submit} disabled={loading || !email || !agreeTerms}>
        {loading ? "Creating session..." : "Create BTCPay session"}
      </button>
    </div>
  );
}
