import Link from "next/link";

export const runtime = 'edge';

export default function AccountPage() {
  return (
    <div>
      {/* Page Hero */}
      <div className="page-hero-sm">
        <div className="container">
          <h1 className="page-title" style={{ marginBottom: 12 }}>
            Account Access
          </h1>
          <p style={{ color: "var(--muted)", maxWidth: 560 }}>
            No login required — Coincart uses guest checkout for all orders.
          </p>
        </div>
      </div>

      <div className="container-narrow" style={{ paddingTop: 48, paddingBottom: 64 }}>
        {/* Main Info Card */}
        <div className="surface" style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: "2.5rem",
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            🛒
          </div>
          <h2
            className="card-title"
            style={{ marginBottom: 12, textAlign: "center" }}
          >
            Guest Checkout — No Account Needed
          </h2>
          <p
            style={{
              color: "var(--muted)",
              textAlign: "center",
              lineHeight: 1.6,
              marginBottom: 0,
            }}
          >
            Account login and order history are currently not required.
            Coincart uses guest checkout — no account needed to order. Your
            order confirmation and tracking information are sent directly to
            your email.
          </p>
        </div>

        {/* Info Boxes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
          <div className="surface">
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.75rem", flexShrink: 0 }}>📦</span>
              <div>
                <h3 style={{ margin: "0 0 8px", fontSize: "1rem" }}>
                  Track Your Order
                </h3>
                <p className="small" style={{ color: "var(--muted)", margin: 0 }}>
                  Your order ID is included in the confirmation email sent after
                  checkout. Use your order ID and the email you provided to
                  contact us for status updates or delivery tracking information.
                </p>
              </div>
            </div>
          </div>

          <div className="surface">
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.75rem", flexShrink: 0 }}>🎧</span>
              <div>
                <h3 style={{ margin: "0 0 8px", fontSize: "1rem" }}>
                  Order Support
                </h3>
                <p className="small" style={{ color: "var(--muted)", margin: "0 0 12px" }}>
                  For any order-related issues — payment, delivery, product
                  problems, or returns — reach out to our support team via the
                  contact form. Include your order ID and the email used at
                  checkout.
                </p>
                <Link
                  className="btn btn-teal btn-sm"
                  href="/contact-us"
                >
                  Go to Contact Form
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <Link className="btn btn-ghost" href="/">
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}
