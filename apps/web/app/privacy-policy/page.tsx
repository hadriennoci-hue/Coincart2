export const runtime = 'edge';

export default function PrivacyPolicyPage() {
  return (
    <div>
      {/* Page Hero */}
      <div className="page-hero-sm">
        <div className="container-sm">
          <h1 className="page-title" style={{ marginBottom: 12 }}>
            COINCART GLOBAL PRIVACY POLICY
          </h1>
          <p style={{ color: "var(--muted)", maxWidth: 560 }}>
            We care about your privacy. Read how we collect, use, and protect
            your personal data.
          </p>
        </div>
      </div>

      <div className="container-sm" style={{ paddingTop: 48, paddingBottom: 64 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Section 1 */}
          <div className="surface">
            <h2
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--primary)",
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              1. Introduction
            </h2>
            <p style={{ color: "var(--muted)", lineHeight: 1.65, margin: 0 }}>
              When creating an account, or before acquiring a Product, we will
              ask you to review this Policy and accept its contents before
              proceeding. You should read this policy in full before proceeding.
              If you don&apos;t want us to collect, use, or share your personal
              information as outlined in this Privacy Policy, or if you are
              under 18 years old and unsupervised by parents or legal guardians,
              please stop using our Websites or App.
            </p>
          </div>

          {/* Section 2 — Data Table */}
          <div className="surface">
            <h2
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--primary)",
                marginBottom: 16,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              2. Data Collected
            </h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px 14px",
                      background: "var(--surface-2)",
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderRadius: "6px 0 0 6px",
                    }}
                  >
                    Data Type
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px 14px",
                      background: "var(--surface-2)",
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderRadius: "0 6px 6px 0",
                    }}
                  >
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    type: "Basic identification data",
                    detail: "Email address",
                  },
                  { type: "Wallet data", detail: "Wallet address" },
                  {
                    type: "Shipping data",
                    detail: "Shipping name and address, shipping phone number",
                  },
                  {
                    type: "Transaction data",
                    detail:
                      "Data about transactions made on our Websites and App, such as amount, currency, payment method, date and/or timestamp, and products purchased.",
                  },
                  {
                    type: "Customer Support data",
                    detail:
                      "Data provided during customer support exchanges, or in response to customer surveys.",
                  },
                ].map((row, i) => (
                  <tr
                    key={row.type}
                    style={{
                      background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                    }}
                  >
                    <td
                      style={{
                        padding: "12px 14px",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "var(--text)",
                        borderBottom: "1px solid var(--border)",
                        verticalAlign: "top",
                      }}
                    >
                      {row.type}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        fontSize: "0.875rem",
                        color: "var(--muted)",
                        borderBottom: "1px solid var(--border)",
                        lineHeight: 1.5,
                      }}
                    >
                      {row.detail}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 3 */}
          <div className="surface">
            <h2
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--primary)",
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              3. Why do we process your personal data?
            </h2>
            <p style={{ color: "var(--muted)", lineHeight: 1.65, margin: "0 0 8px" }}>
              3.1 To open and maintain your account.
            </p>
            <p style={{ color: "var(--muted)", lineHeight: 1.65, margin: 0 }}>
              3.2 To operate shipping and customer support.
            </p>
          </div>

          {/* Section 4 */}
          <div className="surface">
            <h2
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--primary)",
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              4. How can you exercise your data subject rights?
            </h2>
            <p style={{ color: "var(--muted)", lineHeight: 1.65, marginBottom: 12 }}>
              Under certain circumstances, you have the following rights under
              data protection laws:
            </p>
            <ul
              style={{
                color: "var(--muted)",
                lineHeight: 1.65,
                paddingLeft: 20,
                margin: "0 0 16px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <li>
                Right to access, correct, or erase your personal data to verify
                lawful processing and request correction or deletion where
                applicable.
              </li>
              <li>
                Right to object to processing of your personal data where we
                rely on legitimate interest, if your situation impacts your
                fundamental rights and freedoms.
              </li>
              <li>
                Right to request restriction of processing, including when data
                accuracy is disputed, use is unlawful but deletion is not
                requested, retention is needed for legal claims, or an objection
                is pending verification.
              </li>
              <li>
                Right to request transfer of your personal data to you or a
                third party.
              </li>
              <li>
                Right to withdraw consent at any time where processing is based
                on consent.
              </li>
            </ul>
            <p style={{ color: "var(--muted)", lineHeight: 1.65, marginBottom: 8 }}>
              To exercise your rights, contact us at{" "}
              <a
                href="mailto:coincart@coincart.store"
                style={{ color: "var(--primary)" }}
              >
                coincart@coincart.store
              </a>
              .
            </p>
            <p style={{ color: "var(--muted)", lineHeight: 1.65, marginBottom: 8 }}>
              You will not have to pay a fee to access your personal data (or to
              exercise any other rights). However, we may charge a reasonable
              fee if your request is unreasonable, repetitive, or excessive, or
              refuse to comply in these circumstances.
            </p>
            <p style={{ color: "var(--muted)", lineHeight: 1.65, marginBottom: 8 }}>
              We try to respond to all legitimate requests within one month. It
              may take longer for complex or multiple requests, in which case we
              will notify you.
            </p>
            <p style={{ color: "var(--muted)", lineHeight: 1.65, margin: 0 }}>
              We retain data only as long as necessary for its purpose. Data no
              longer needed is irreversibly anonymized or securely destroyed.
              Data related to exercise of rights above is retained for 12 months
              from the request.
            </p>
          </div>

          {/* Section 5 */}
          <div className="surface">
            <h2
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--primary)",
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              5. How long do we keep your personal data?
            </h2>
            <p style={{ color: "var(--muted)", lineHeight: 1.65, marginBottom: 8 }}>
              We keep personal data for as long as needed to fulfill the purpose
              for which it was collected, including selling products and
              protecting our, your, or others&apos; interests.
            </p>
            <p style={{ color: "var(--muted)", lineHeight: 1.65, marginBottom: 8 }}>
              If you have an account with us, we keep account-activity data
              while the account exists.
            </p>
            <p style={{ color: "var(--muted)", lineHeight: 1.65, margin: 0 }}>
              We keep tax-relevant information for a minimum of 7 years.
            </p>
          </div>

          {/* Section 6 */}
          <div className="surface">
            <h2
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--primary)",
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              6. Minors
            </h2>
            <p style={{ color: "var(--muted)", lineHeight: 1.65, marginBottom: 8 }}>
              Our website and services are not intended for children under 16
              years of age.
            </p>
            <p style={{ color: "var(--muted)", lineHeight: 1.65, margin: 0 }}>
              We do not knowingly collect personal information from children
              under 16. If you are under 16, do not use or provide information
              without parental consent. If we learn we have collected personal
              data from a child under 16 without verified parental consent, we
              will delete that information.
            </p>
          </div>

          {/* Section 7 */}
          <div className="surface">
            <h2
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--primary)",
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              7. Miscellaneous
            </h2>
            <p style={{ color: "var(--muted)", lineHeight: 1.65, marginBottom: 8 }}>
              7.1 If you have questions about this Privacy Policy and how we
              handle your data, email{" "}
              <a
                href="mailto:coincart@coincart.store"
                style={{ color: "var(--primary)" }}
              >
                coincart@coincart.store
              </a>
              .
            </p>
            <p style={{ color: "var(--muted)", lineHeight: 1.65, marginBottom: 8 }}>
              7.2 As our platform evolves, we may modify this Privacy Policy
              from time to time. Changes will be made on this page and, when
              significant, we will inform you.
            </p>
            <p style={{ color: "var(--muted)", lineHeight: 1.65, margin: 0 }}>
              If you wish to contact us for any matter related to the Coincart
              Global Privacy Policy or how we process your personal data,
              contact us at{" "}
              <a
                href="mailto:coincart@coincart.store"
                style={{ color: "var(--primary)" }}
              >
                coincart@coincart.store
              </a>
              .
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
