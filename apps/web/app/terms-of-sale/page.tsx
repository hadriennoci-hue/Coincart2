export const runtime = 'edge';

export default function TermsOfSalePage() {
  return (
    <div className="card">
      <h2>Terms of Sale</h2>

      <p>
        <strong>GENERAL CONDITIONS</strong>
      </p>

      <h3>1. Introduction</h3>
      <p>1.1 Parties and definitions:</p>
      <ol>
        <li>“Client” is any person wishing to make a transaction on Coincart.</li>
        <li>“Supplier” means one of Coincart suppliers (as of February 19th 2025, ACER Predator).</li>
        <li>“Merchant” is Coincart, the platform processing the sales.</li>
        <li>“Transporter” is the company that ships the Orders (DHL in Europe).</li>
      </ol>
      <p>
        1.2 Purpose of this agreement: The purpose of this agreement is to define the terms and responsibilities of
        each party during the order of a Product on Coincart by the Client.
      </p>

      <h3>2. Purpose</h3>
      <p>
        2.2 Coincart administrates the usage of the platform, listing Suppliers products and processing sales for
        Clients. Coincart transfers the orders to the Supplier, communicates the shipping URL and information to the
        Client, and answers any question the Client might have regarding order, refund or warranty. If there is a
        problem with the order, Coincart pledges to do everything possible to help the Client resolve the situation.
      </p>

      <h3>3. Products</h3>
      <p>3.1 As of February 20th 2025, Coincart sells all the ACER / Predator catalog and may add more brands.</p>
      <p>
        3.2 Availability: Coincart updates availability daily. If a product is unavailable, Coincart offers either:
        (a) waiting for supplier restock, or (b) immediate 100% refund including shipping and gas fees.
      </p>
      <p>3.3 Pricing: Prices are subject to change and do not include shipping fees shown separately at checkout.</p>

      <h3>4. Payment terms</h3>
      <p>4.1 Payment processor: Coincart uses BTCPay Server.</p>
      <p>4.2 Cryptos accepted (as listed on source page): BTC, USDT (TRON), XMR.</p>
      <p>
        4.3 Payment processing: Coincart waits for blockchain confirmation before considering payment confirmed and
        starting order processing.
      </p>

      <h3>5. Order acceptance and cancellation</h3>
      <p>
        5.1 Coincart reserves the right to cancel orders (for example: insufficient shipping data, missing/invalid
        contact info, unavailable supplier stock, or other reasons). In those cases Coincart notifies by email and
        refunds 100%.
      </p>
      <p>5.2 The Client can cancel within 14 days after receiving the product, subject to section 8 conditions.</p>

      <h3>6. Shipping and delivery</h3>
      <p>6.1 The Supplier processes orders via DHL, and so does Coincart.</p>
      <p>6.2 After payment confirmation, supplier shipping usually starts in about 2 days.</p>
      <p>
        6.3 After shipping, the Transporter uses Client address and phone data. The Client is responsible for
        receiving the shipment.
      </p>
      <p>6.4 Delivery times vary by destination (for example 2-4 days in France depending on location).</p>

      <h3>7. Customer responsibilities</h3>
      <p>7.1 Client agrees to receive contractual communications electronically.</p>
      <p>
        7.2 By placing an order, the Client agrees to these terms, confirms legal age (18+), and legal entitlement to
        use the chosen payment method.
      </p>
      <p>7.3 A valid order requires at least a valid address, delivery phone number, and email.</p>
      <p>
        7.4-7.6 Client-provided address/phone/email are used for supplier and transporter processing, shipping updates
        and order communication. Incorrect details can cause delivery or support issues.
      </p>
      <p>7.7 Client is responsible for complying with local laws regarding cryptocurrency transactions.</p>

      <h3>8. 14 days free return</h3>
      <p>8.1 The Client has a fourteen-day withdrawal period from shipment completion.</p>
      <p>
        8.2 To withdraw, Client must send an unambiguous request before the deadline. Identification details from the
        purchase are required for validation.
      </p>
      <p>8.3-8.4 Coincart confirms return instructions; Client returns product without undue delay.</p>
      <p>
        8.5 After supplier receipt and inspection, Coincart refunds (excluding delivery costs), using the original
        payment method.
      </p>

      <h3>9. Warranty (if applicable)</h3>
      <p>
        Coincart applies supplier/manufacturer warranties where available. For warranty activation, contact support by
        email.
      </p>

      <h3>10. Limitation of liability</h3>
      <p>
        Coincart shall not be liable for delivery errors on supplier/transporter side, or product issues, but will do
        everything possible to help resolve issues.
      </p>

      <h3>11. Amendment to terms</h3>
      <p>Coincart reserves the right to change these terms.</p>

      <h3>12. Contact information</h3>
      <p>
        <a href="mailto:coincartstore@proton.me">coincartstore@proton.me</a>
      </p>

      <h3>13. User accounts responsibilities</h3>
      <p>The Client may create an account (not mandatory) with email and password.</p>
      <p>Account may include order-related information such as shipping URL and status.</p>
    </div>
  );
}

