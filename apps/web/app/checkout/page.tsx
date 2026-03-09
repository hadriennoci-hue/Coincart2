"use client";

import { useEffect, useState } from "react";
import { createCheckoutSession, type Currency } from "../../lib/api";
import { clearCart, getCart } from "../../lib/cart";

export default function CheckoutPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
      <p className="small">Guest checkout. Email required, phone optional.</p>
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
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button className="button secondary" onClick={() => setCurrency("USD")}>USD</button>
        <button className="button secondary" onClick={() => setCurrency("EUR")}>EUR</button>
      </div>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <button className="button" onClick={submit} disabled={loading || !email}>
        {loading ? "Creating session..." : "Create BTCPay session"}
      </button>
    </div>
  );
}