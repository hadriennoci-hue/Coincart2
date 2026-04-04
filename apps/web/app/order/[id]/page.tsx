import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchOrder } from "../../../lib/api";
import { fmtPrice } from "../../../lib/format";

export const runtime = 'edge';

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await fetchOrder(id);
  if (!order) return notFound();

  const isPaid =
    order.status === "paid" ||
    order.status === "confirmed" ||
    order.status === "fulfilled";
  const isPending = order.status === "pending_payment";
  const isCancelled = order.status === "cancelled";

  const statusBadgeClass = isPaid
    ? "badge badge-green"
    : isPending
      ? "badge badge-warning"
      : isCancelled
        ? "badge badge-error"
        : "badge badge-gray";

  const itemsSubtotal = order.items.reduce(
    (acc, item) => acc + item.unitPrice * item.quantity,
    0,
  );
  const discountAmount = Math.max(0, order.discountAmount || 0);
  const subtotal = Math.max(0, itemsSubtotal - discountAmount);

  return (
    <div
      className="container-narrow"
      style={{ paddingTop: 64, paddingBottom: 64 }}
    >
      {/* Status Header */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: isPaid
              ? "rgba(34,197,94,0.15)"
              : isPending
                ? "rgba(234,179,8,0.15)"
                : "rgba(239,68,68,0.15)",
            border: `2px solid ${isPaid ? "var(--accent)" : isPending ? "#EAB308" : "var(--error)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
            margin: "0 auto 20px",
          }}
        >
          {isPaid ? "✓" : isPending ? "⏳" : "✕"}
        </div>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            marginBottom: 8,
            color: "var(--text)",
          }}
        >
          {isPaid ? "Order Confirmed" : isPending ? "Awaiting Payment" : "Order " + order.status}
        </h1>
        <div className="caption" style={{ marginBottom: 12 }}>
          Order ID: {order.orderNumber || order.id}
        </div>
        <span className={statusBadgeClass}>
          {order.status.replace("_", " ").toUpperCase()}
        </span>
      </div>

      {/* Items Card */}
      <div className="surface" style={{ marginBottom: 20 }}>
        <h2 className="card-title" style={{ marginBottom: 16 }}>
          Items Ordered
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {order.items.map((item, index) => (
            <div
              key={item.sku}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderBottom:
                  index < order.items.length - 1
                    ? "1px solid var(--border)"
                    : "none",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>
                  {item.productName}
                </div>
                <div className="caption">Qty: {item.quantity}</div>
              </div>
              <div style={{ fontWeight: 600, color: "var(--text)" }}>
                {fmtPrice(item.unitPrice, order.currency)}
              </div>
            </div>
          ))}
        </div>

        <div className="divider" style={{ margin: "16px 0" }} />

        {/* Totals */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="small" style={{ color: "var(--muted)" }}>Subtotal</span>
            <span>
              {fmtPrice(itemsSubtotal, order.currency)}
            </span>
          </div>
          {discountAmount > 0 ? (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="small" style={{ color: "var(--muted)" }}>
                {order.couponCode ? `Discounts (${order.couponCode})` : "Discounts"}
              </span>
              <span style={{ color: "var(--accent)" }}>
                -{fmtPrice(discountAmount, order.currency)}
              </span>
            </div>
          ) : null}
          {discountAmount > 0 ? (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="small" style={{ color: "var(--muted)" }}>Subtotal after discount</span>
              <span>
                {fmtPrice(subtotal, order.currency)}
              </span>
            </div>
          ) : null}
          {typeof order.shippingCost === "number" && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="small" style={{ color: "var(--muted)" }}>
                Shipping
                {order.shippingMethod ? ` (${order.shippingMethod})` : ""}
                {order.estimatedDeliveryDays
                  ? ` · ${order.estimatedDeliveryDays} days`
                  : ""}
              </span>
              <span>
                {fmtPrice(order.shippingCost, order.currency)}
              </span>
            </div>
          )}
          <div className="divider" style={{ margin: "4px 0" }} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 700 }}>Grand Total</span>
            <span
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "var(--accent)",
              }}
            >
              {fmtPrice(order.totalAmount, order.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="surface" style={{ marginBottom: 24 }}>
        <div className="caption" style={{ marginBottom: 4 }}>
          Confirmation sent to
        </div>
        <div style={{ fontWeight: 500 }}>{order.customerEmail}</div>
      </div>

      {/* Payment Status / BTCPay */}
      {isPaid ? (
        <div
          style={{
            background: "rgba(34,197,94,0.1)",
            border: "1px solid var(--accent)",
            borderRadius: 12,
            padding: "16px 20px",
            textAlign: "center",
            marginBottom: 24,
            color: "var(--accent)",
            fontWeight: 600,
          }}
        >
          ✓ Payment received — your order is being processed
        </div>
      ) : null}

      <Link className="btn btn-ghost btn-full" href="/">
        Back to Catalog
      </Link>
    </div>
  );
}
