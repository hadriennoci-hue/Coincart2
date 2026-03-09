export const runtime = 'edge';

export default function ContactUsPage() {
  return (
    <div className="card">
      <h2>Contact Us</h2>
      <p>
        For all support requests (orders, delivery, returns, warranty, business inquiries), contact us at:
      </p>
      <p>
        <a href="mailto:coincartstore@proton.me">coincartstore@proton.me</a>
      </p>
      <p className="small">We aim to respond within 24 hours.</p>

      <h3>Suggested email subject</h3>
      <ul>
        <li>Order support (payment, delivery, product)</li>
        <li>Return request</li>
        <li>Warranty support</li>
        <li>Business proposal</li>
        <li>Other</li>
      </ul>

      <h3>To speed up support, include</h3>
      <ul>
        <li>Order ID (if available)</li>
        <li>Email used for purchase</li>
        <li>Product reference / serial number (if relevant)</li>
        <li>Clear description of your request</li>
      </ul>
    </div>
  );
}

