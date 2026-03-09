import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchOrder } from "../../../lib/api";

export const runtime = "edge";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await fetchOrder(id);
  if (!order) return notFound();

  return (
    <div className="card">
      <h2>Order {order.id}</h2>
      <p className="small">Status: {order.status}</p>
      <p className="small">Customer: {order.customerEmail}</p>
      <div style={{ borderTop: "1px solid var(--line)", marginTop: 12 }}>
        {order.items.map((item) => (
          <div key={item.sku} style={{ paddingTop: 10 }}>
            <b>{item.productName}</b>
            <p className="small">{item.quantity} x {item.unitPrice.toFixed(2)} {order.currency}</p>
          </div>
        ))}
      </div>
      <h3>
        Total: {order.totalAmount.toFixed(2)} {order.currency}
      </h3>
      {order.btcpayCheckoutUrl && (
        <p>
          <a className="button" href={order.btcpayCheckoutUrl}>
            Open BTCPay checkout
          </a>
        </p>
      )}
      <Link className="button secondary" href="/">
        Back to catalog
      </Link>
    </div>
  );
}
