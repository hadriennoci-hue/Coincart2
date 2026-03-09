export const runtime = 'edge';

export default function ShippingPolicyPage() {
  return (
    <div className="card">
      <h2>Shipping Policy</h2>
      <p>
        Coincart currently ships only to countries within the European Union (EU). Orders with non-EU shipping
        destinations are not accepted at checkout.
      </p>

      <h3>Shipping Method</h3>
      <p>DHL Standard</p>

      <h3>Delivery Time</h3>
      <p>Estimated 5 business days after order processing.</p>

      <h3>Shipping Cost</h3>
      <p>Fixed 10 EUR per order across eligible EU destinations.</p>
      <p className="small">
        If checkout currency is USD, the shipping fee is converted at checkout using Coincart conversion settings.
      </p>

      <h3>Address and Contact Data Usage</h3>
      <p>
        Your shipping name, address, and contact information are used only to process your order and coordinate
        delivery with logistics partners.
      </p>

      <h3>Delivery Responsibility</h3>
      <p>
        Please ensure all shipping information is complete and accurate. Incorrect or incomplete data may result in
        delays or failed delivery.
      </p>
    </div>
  );
}

