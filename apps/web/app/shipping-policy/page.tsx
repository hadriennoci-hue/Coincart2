export const runtime = 'edge';

export default function ShippingPolicyPage() {
  return (
    <div>
      {/* Page Hero */}
      <div className="page-hero-sm">
        <div className="container">
          <h1 className="page-title" style={{ marginBottom: 12 }}>
            Shipping Policy
          </h1>
          <p style={{ color: "var(--muted)", maxWidth: 560 }}>
            EU only &mdash; DHL Standard delivery across all eligible European
            Union countries.
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 48, paddingBottom: 64 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "60% 40%",
            gap: 32,
            alignItems: "start",
          }}
        >
          {/* Left: Info Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                padding: "24px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
              }}
            >
              <span style={{ fontSize: "2.5rem", flexShrink: 0 }}>🚚</span>
              <div>
                <div className="caption" style={{ marginBottom: 4 }}>
                  Shipping Method
                </div>
                <div
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "var(--text)",
                  }}
                >
                  DHL Standard
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                padding: "24px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
              }}
            >
              <span style={{ fontSize: "2.5rem", flexShrink: 0 }}>📅</span>
              <div>
                <div className="caption" style={{ marginBottom: 4 }}>
                  Delivery Time
                </div>
                <div
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "var(--text)",
                  }}
                >
                  5 Business Days
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                padding: "24px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
              }}
            >
              <span style={{ fontSize: "2.5rem", flexShrink: 0 }}>💶</span>
              <div>
                <div className="caption" style={{ marginBottom: 4 }}>
                  Shipping Cost
                </div>
                <div
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "var(--text)",
                  }}
                >
                  &euro;10 Flat Rate
                </div>
              </div>
            </div>
          </div>

          {/* Right: Policy Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="surface">
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "var(--text)",
                  marginBottom: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Address Data Usage
              </h3>
              <p className="small" style={{ color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
                Your shipping name, address, and contact information are used
                only to process your order and coordinate delivery with
                logistics partners.
              </p>
            </div>

            <div className="surface">
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "var(--text)",
                  marginBottom: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Delivery Responsibility
              </h3>
              <p className="small" style={{ color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
                Please ensure all shipping information is complete and accurate.
                Incorrect or incomplete data may result in delays or failed
                delivery. After shipping, the transporter uses client address
                and phone data — the client is responsible for receiving the
                shipment.
              </p>
            </div>

            <div
              style={{
                background: "var(--primary)",
                borderRadius: 12,
                padding: 20,
              }}
            >
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                EU Countries Only
              </h3>
              <p
                style={{
                  color: "rgba(255,255,255,0.85)",
                  margin: 0,
                  fontSize: "0.875rem",
                  lineHeight: 1.6,
                }}
              >
                Coincart currently ships only to countries within the European
                Union (EU). Orders with non-EU shipping destinations are not
                accepted at checkout.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
