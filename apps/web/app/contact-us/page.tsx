"use client";

import { useState } from "react";
import { sendContactMessage } from "../../lib/api";

export const runtime = 'edge';

const subjectOptions = [
  "The product / brand I want is not listed (provide link)",
  "Order support (payment, delivery, product)",
  "Suggestion for Coincart",
  "Business proposal for Coincart",
  "Other",
] as const;

export default function ContactUsPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<(typeof subjectOptions)[number]>(subjectOptions[0]);
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      await sendContactMessage({
        firstName,
        lastName,
        email,
        subject,
        message,
        company,
      });
      setStatus({ type: "ok", text: "Your message has been sent. We will get back to you shortly." });
      setFirstName("");
      setLastName("");
      setEmail("");
      setSubject(subjectOptions[0]);
      setMessage("");
      setCompany("");
    } catch (error) {
      setStatus({ type: "error", text: (error as Error).message || "Failed to send message." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Contact Us</h2>
      <p className="small">Use this form for order support, suggestions, business proposals, and other requests.</p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>First name *</span>
            <input
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10, background: "white" }}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Last name *</span>
            <input
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10, background: "white" }}
            />
          </label>
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Email *</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10, background: "white" }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Subject *</span>
          <select
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value as (typeof subjectOptions)[number])}
            style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10, background: "white" }}
          >
            {subjectOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Comment or Message *</span>
          <textarea
            required
            rows={7}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10, background: "white" }}
          />
        </label>

        {/* Hidden honeypot field for bots */}
        <input
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }}
        />

        <button className="button" type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Message"}
        </button>

        {status ? <p className="small" style={{ color: status.type === "ok" ? "#0b7a37" : "#b3261e" }}>{status.text}</p> : null}
      </form>
    </div>
  );
}

