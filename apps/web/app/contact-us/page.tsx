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
  const [subject, setSubject] = useState<(typeof subjectOptions)[number]>(
    subjectOptions[0],
  );
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);

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
      setStatus({
        type: "ok",
        text: "Your message has been sent. We will get back to you shortly.",
      });
      setFirstName("");
      setLastName("");
      setEmail("");
      setSubject(subjectOptions[0]);
      setMessage("");
      setCompany("");
    } catch (error) {
      setStatus({
        type: "error",
        text: (error as Error).message || "Failed to send message.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Page Hero */}
      <div className="page-hero-sm">
        <div className="container">
          <h1 className="page-title" style={{ marginBottom: 12 }}>
            Contact Us
          </h1>
          <p style={{ color: "var(--muted)", maxWidth: 560 }}>
            Order support, suggestions, business proposals, and other requests.
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 48, paddingBottom: 64 }}>
        <div className="surface">
            <h2 className="card-title" style={{ marginBottom: 24 }}>
              Send a Message
            </h2>
            <form
              onSubmit={onSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <label className="form-label">
                  First Name *
                  <input
                    className="input"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                  />
                </label>
                <label className="form-label">
                  Last Name *
                  <input
                    className="input"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                  />
                </label>
              </div>

              <label className="form-label">
                Email *
                <input
                  className="input"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </label>

              <label className="form-label">
                Subject *
                <select
                  className="select"
                  required
                  value={subject}
                  onChange={(e) =>
                    setSubject(e.target.value as (typeof subjectOptions)[number])
                  }
                >
                  {subjectOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-label">
                Comment or Message *
                <textarea
                  className="textarea"
                  required
                  rows={7}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your request in detail..."
                />
              </label>

              {/* Hidden honeypot field for bots */}
              <input
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                style={{
                  position: "absolute",
                  left: "-9999px",
                  opacity: 0,
                  pointerEvents: "none",
                }}
              />

              <button
                className="btn btn-primary btn-full"
                type="submit"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Message"}
              </button>

              {status ? (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    fontSize: "0.875rem",
                    background:
                      status.type === "ok"
                        ? "rgba(34,197,94,0.1)"
                        : "rgba(239,68,68,0.1)",
                    border: `1px solid ${status.type === "ok" ? "var(--accent)" : "var(--error)"}`,
                    color:
                      status.type === "ok" ? "var(--accent)" : "var(--error)",
                  }}
                >
                  {status.text}
                </div>
              ) : null}
            </form>
        </div>
      </div>
    </div>
  );
}

