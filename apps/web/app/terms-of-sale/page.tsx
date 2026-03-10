export const runtime = 'edge';

export default function TermsOfSalePage() {
  const sectionStyle = {
    fontSize: "1rem" as const,
    fontWeight: 700 as const,
    color: "var(--primary)",
    marginBottom: 12,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  };

  const bodyStyle = {
    color: "var(--muted)",
    lineHeight: 1.65,
    marginBottom: 8,
  };

  return (
    <div>
      {/* Page Hero */}
      <div className="page-hero-sm">
        <div className="container-sm">
          <h1 className="page-title" style={{ marginBottom: 12 }}>
            Terms of Sale
          </h1>
          <p style={{ color: "var(--muted)", maxWidth: 560 }}>
            General Conditions — effective from February 2025
          </p>
        </div>
      </div>

      <div className="container-sm" style={{ paddingTop: 48, paddingBottom: 64 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Section 1 */}
          <div className="surface">
            <h2 style={sectionStyle}>1. Introduction</h2>
            <p style={bodyStyle}>1.1 Parties and definitions:</p>
            <ul
              style={{
                color: "var(--muted)",
                lineHeight: 1.65,
                paddingLeft: 20,
                margin: "0 0 16px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <li>
                <span style={{ color: "var(--text)", fontWeight: 500 }}>
                  &bull; &quot;Client&quot;
                </span>{" "}
                is any person wishing to make a transaction on Coincart.
              </li>
              <li>
                <span style={{ color: "var(--text)", fontWeight: 500 }}>
                  &bull; &quot;Supplier&quot;
                </span>{" "}
                means one of Coincart suppliers (as of February 19th 2025, ACER
                Predator).
              </li>
              <li>
                <span style={{ color: "var(--text)", fontWeight: 500 }}>
                  &bull; &quot;Merchant&quot;
                </span>{" "}
                is Coincart, the platform processing the sales.
              </li>
              <li>
                <span style={{ color: "var(--text)", fontWeight: 500 }}>
                  &bull; &quot;Transporter&quot;
                </span>{" "}
                is the company that ships the Orders (DHL in Europe).
              </li>
            </ul>
            <p style={{ ...bodyStyle, marginBottom: 0 }}>
              1.2 Purpose of this agreement: The purpose of this agreement is
              to define the terms and responsibilities of each party during the
              order of a Product on Coincart by the Client.
            </p>
          </div>

          {/* Section 2 */}
          <div className="surface">
            <h2 style={sectionStyle}>2. Purpose</h2>
            <p style={{ ...bodyStyle, marginBottom: 0 }}>
              2.2 Coincart administrates the usage of the platform, listing
              Suppliers products and processing sales for Clients. Coincart
              transfers the orders to the Supplier, communicates the shipping
              URL and information to the Client, and answers any question the
              Client might have regarding order, refund or warranty. If there is
              a problem with the order, Coincart pledges to do everything
              possible to help the Client resolve the situation.
            </p>
          </div>

          {/* Section 3 */}
          <div className="surface">
            <h2 style={sectionStyle}>3. Products</h2>
            <p style={bodyStyle}>
              3.1 As of February 20th 2025, Coincart sells all the ACER /
              Predator catalog and may add more brands.
            </p>
            <p style={bodyStyle}>
              3.2 Availability: Coincart updates availability daily. If a
              product is unavailable, Coincart offers either: (a) waiting for
              supplier restock, or (b) immediate 100% refund including shipping
              and gas fees.
            </p>
            <p style={{ ...bodyStyle, marginBottom: 0 }}>
              3.3 Pricing: Prices are subject to change and do not include
              shipping fees shown separately at checkout.
            </p>
          </div>

          {/* Section 4 */}
          <div className="surface">
            <h2 style={sectionStyle}>4. Payment Terms</h2>
            <p style={bodyStyle}>
              4.1 Payment processor: Coincart uses BTCPay Server.
            </p>
            <p style={bodyStyle}>
              4.2 Cryptos accepted (as listed on source page): BTC, USDT
              (TRON), XMR.
            </p>
            <p style={{ ...bodyStyle, marginBottom: 0 }}>
              4.3 Payment processing: Coincart waits for blockchain
              confirmation before considering payment confirmed and starting
              order processing.
            </p>
          </div>

          {/* Section 5 */}
          <div className="surface">
            <h2 style={sectionStyle}>5. Order Acceptance and Cancellation</h2>
            <p style={bodyStyle}>
              5.1 Coincart reserves the right to cancel orders (for example:
              insufficient shipping data, missing/invalid contact info,
              unavailable supplier stock, or other reasons). In those cases
              Coincart notifies by email and refunds 100%.
            </p>
            <p style={{ ...bodyStyle, marginBottom: 0 }}>
              5.2 The Client can cancel within 14 days after receiving the
              product, subject to section 8 conditions.
            </p>
          </div>

          {/* Section 6 */}
          <div className="surface">
            <h2 style={sectionStyle}>6. Shipping and Delivery</h2>
            <p style={bodyStyle}>
              6.1 The Supplier processes orders via DHL, and so does Coincart.
            </p>
            <p style={bodyStyle}>
              6.2 After payment confirmation, supplier shipping usually starts
              in about 2 days.
            </p>
            <p style={bodyStyle}>
              6.3 After shipping, the Transporter uses Client address and phone
              data. The Client is responsible for receiving the shipment.
            </p>
            <p style={{ ...bodyStyle, marginBottom: 0 }}>
              6.4 Delivery times vary by destination (for example 2-4 days in
              France depending on location).
            </p>
          </div>

          {/* Section 7 */}
          <div className="surface">
            <h2 style={sectionStyle}>7. Customer Responsibilities</h2>
            <p style={bodyStyle}>
              7.1 Client agrees to receive contractual communications
              electronically.
            </p>
            <p style={bodyStyle}>
              7.2 By placing an order, the Client agrees to these terms,
              confirms legal age (18+), and legal entitlement to use the chosen
              payment method.
            </p>
            <p style={bodyStyle}>
              7.3 A valid order requires at least a valid address, delivery
              phone number, and email.
            </p>
            <p style={bodyStyle}>
              7.4-7.6 Client-provided address/phone/email are used for supplier
              and transporter processing, shipping updates and order
              communication. Incorrect details can cause delivery or support
              issues.
            </p>
            <p style={{ ...bodyStyle, marginBottom: 0 }}>
              7.7 Client is responsible for complying with local laws regarding
              cryptocurrency transactions.
            </p>
          </div>

          {/* Section 8 */}
          <div className="surface">
            <h2 style={sectionStyle}>8. 14 Days Free Return</h2>
            <p style={bodyStyle}>
              8.1 The Client has a fourteen-day withdrawal period from shipment
              completion.
            </p>
            <p style={bodyStyle}>
              8.2 To withdraw, Client must send an unambiguous request before
              the deadline. Identification details from the purchase are
              required for validation.
            </p>
            <p style={bodyStyle}>
              8.3-8.4 Coincart confirms return instructions; Client returns
              product without undue delay.
            </p>
            <p style={{ ...bodyStyle, marginBottom: 0 }}>
              8.5 After supplier receipt and inspection, Coincart refunds
              (excluding delivery costs), using the original payment method.
            </p>
          </div>

          {/* Section 9 */}
          <div className="surface">
            <h2 style={sectionStyle}>9. Warranty (if applicable)</h2>
            <p style={{ ...bodyStyle, marginBottom: 0 }}>
              Coincart applies supplier/manufacturer warranties where available.
              For warranty activation, contact support by email.
            </p>
          </div>

          {/* Section 10 */}
          <div className="surface">
            <h2 style={sectionStyle}>10. Limitation of Liability</h2>
            <p style={{ ...bodyStyle, marginBottom: 0 }}>
              Coincart shall not be liable for delivery errors on
              supplier/transporter side, or product issues, but will do
              everything possible to help resolve issues.
            </p>
          </div>

          {/* Section 11 */}
          <div className="surface">
            <h2 style={sectionStyle}>11. Amendment to Terms</h2>
            <p style={{ ...bodyStyle, marginBottom: 0 }}>
              Coincart reserves the right to change these terms.
            </p>
          </div>

          {/* Section 12 */}
          <div className="surface">
            <h2 style={sectionStyle}>12. Contact Information</h2>
            <p style={{ ...bodyStyle, marginBottom: 0 }}>
              <a
                href="mailto:coincartstore@proton.me"
                style={{ color: "var(--primary)" }}
              >
                coincartstore@proton.me
              </a>
            </p>
          </div>

          {/* Section 13 */}
          <div className="surface">
            <h2 style={sectionStyle}>13. User Accounts Responsibilities</h2>
            <p style={bodyStyle}>
              The Client may create an account (not mandatory) with email and
              password.
            </p>
            <p style={{ ...bodyStyle, marginBottom: 0 }}>
              Account may include order-related information such as shipping URL
              and status.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
