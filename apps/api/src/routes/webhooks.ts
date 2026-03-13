import { Hono } from "hono";
import { btcpayWebhookSchema } from "@coincart/types";
import { applyBtcPayWebhook, getOrderById, getOrderByInvoiceId } from "@coincart/core";
import { orderEvents } from "@coincart/db";
import { and, eq } from "drizzle-orm";
import type { AppContext } from "../types";

export const webhookRoutes = new Hono<AppContext>();

const ADMIN_ORDER_EMAIL = "coincartstore@proton.me";

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const extractSignature = (headerValue: string | undefined) => {
  if (!headerValue) return null;
  const match = headerValue.match(/(?:sha256=)?([a-fA-F0-9]{64})/);
  return match ? match[1].toLowerCase() : null;
};

const constantTimeEquals = (left: string, right: string) => {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return mismatch === 0;
};

const computeHmacSha256Hex = async (secret: string, payload: string) => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toHex(new Uint8Array(signature));
};

const formatAddress = (parts: Array<string | null | undefined>) =>
  parts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");

const sendResendEmail = async (input: {
  resendApiKey: string;
  from: string;
  to: string | string[];
  subject: string;
  text: string;
  html: string;
}) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: input.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Failed to send email (${response.status}) ${errorBody}`);
  }
};

const sendOrderConfirmationEmails = async (
  resendApiKey: string,
  from: string,
  order: NonNullable<Awaited<ReturnType<typeof getOrderById>>>,
) => {
  const itemsText = order.items
    .map((item) => `- ${item.productName} (${item.sku}) x${item.quantity}: ${item.lineTotal.toFixed(2)} ${order.currency}`)
    .join("\n");

  const shippingLine =
    typeof order.shippingCost === "number"
      ? `Shipping${order.shippingMethod ? ` (${order.shippingMethod})` : ""}: ${order.shippingCost.toFixed(2)} ${order.currency}`
      : "Shipping: N/A";
  const shippingAddress = formatAddress([
    order.shippingName,
    order.shippingAddress1,
    order.shippingAddress2,
    order.shippingCity,
    order.shippingZip,
    order.shippingCountry,
  ]);
  const billingAddress = formatAddress([
    order.billingName,
    order.billingAddress1,
    order.billingAddress2,
    order.billingCity,
    order.billingZip,
    order.billingCountry,
  ]);

  const orderRef = order.orderNumber || order.id;
  const customerSubject = `Coincart - Payment Received for Order ${orderRef}`;
  const customerText = [
    `Hello,`,
    "",
    `We have just received payment for your order ${orderRef} and we are now preparing it.`,
    `You will receive another email once shipment is done, with your tracking ID and tracking URL.`,
    `Please note the transporter will also send shipping notifications to the phone number you provided.`,
    "",
    `Order details:`,
    itemsText || "-",
    "",
    `Currency: ${order.currency}`,
    `Subtotal: ${order.items.reduce((acc, item) => acc + item.lineTotal, 0).toFixed(2)} ${order.currency}`,
    order.discountAmount > 0
      ? `Discount${order.couponCode ? ` (${order.couponCode})` : ""}: -${order.discountAmount.toFixed(2)} ${order.currency}`
      : "",
    shippingLine,
    `Total: ${order.totalAmount.toFixed(2)} ${order.currency}`,
    "",
    `Shipping address: ${shippingAddress || "N/A"}`,
    `Billing address: ${billingAddress || "N/A"}`,
    "",
    `Invoice: ${order.btcpayInvoiceId || "N/A"}`,
  ]
    .filter(Boolean)
    .join("\n");

  const htmlItems = order.items
    .map(
      (item) =>
        `<li>${item.productName} (${item.sku}) x${item.quantity} - ${item.lineTotal.toFixed(2)} ${order.currency}</li>`,
    )
    .join("");

  const customerHtml = `
    <h2>Payment Received</h2>
    <p>Hello,</p>
    <p>We have just received payment for your order <strong>${orderRef}</strong> and we are now preparing it.</p>
    <p>You will receive another email once shipment is done, with your tracking ID and tracking URL.</p>
    <p>Please note the transporter will also send shipping notifications to the phone number you provided.</p>
    <p><strong>Order details:</strong></p>
    <ul>${htmlItems || "<li>-</li>"}</ul>
    <p><strong>Currency:</strong> ${order.currency}</p>
    <p><strong>Subtotal:</strong> ${order.items.reduce((acc, item) => acc + item.lineTotal, 0).toFixed(2)} ${order.currency}</p>
    ${order.discountAmount > 0 ? `<p><strong>Discount${order.couponCode ? ` (${order.couponCode})` : ""}:</strong> -${order.discountAmount.toFixed(2)} ${order.currency}</p>` : ""}
    <p><strong>${shippingLine}</strong></p>
    <p><strong>Total:</strong> ${order.totalAmount.toFixed(2)} ${order.currency}</p>
    <p><strong>Shipping address:</strong> ${shippingAddress || "N/A"}</p>
    <p><strong>Billing address:</strong> ${billingAddress || "N/A"}</p>
    <p><strong>Invoice:</strong> ${order.btcpayInvoiceId || "N/A"}</p>
  `;

  const managementSubject = `Coincart - Paid Order ${orderRef} (Ready to Ship)`;
  const managementText = [
    `Paid order received: ${orderRef}`,
    "",
    `Customer email: ${order.customerEmail}`,
    `Customer phone: ${order.customerPhone || "N/A"}`,
    `Company: ${order.companyName || "N/A"}`,
    "",
    `Shipping address: ${shippingAddress || "N/A"}`,
    `Billing address: ${billingAddress || "N/A"}`,
    `Order notes: ${order.shippingNotes || "N/A"}`,
    "",
    `Items:`,
    itemsText || "-",
    "",
    `Currency: ${order.currency}`,
    `Subtotal: ${order.items.reduce((acc, item) => acc + item.lineTotal, 0).toFixed(2)} ${order.currency}`,
    order.discountAmount > 0
      ? `Discount${order.couponCode ? ` (${order.couponCode})` : ""}: -${order.discountAmount.toFixed(2)} ${order.currency}`
      : "",
    shippingLine,
    `Total: ${order.totalAmount.toFixed(2)} ${order.currency}`,
    "",
    `Invoice: ${order.btcpayInvoiceId || "N/A"}`,
  ]
    .filter(Boolean)
    .join("\n");

  const managementHtml = `
    <h2>Paid Order Ready to Ship</h2>
    <p><strong>Order ID:</strong> ${orderRef}</p>
    <p><strong>Customer email:</strong> ${order.customerEmail}</p>
    <p><strong>Customer phone:</strong> ${order.customerPhone || "N/A"}</p>
    <p><strong>Company:</strong> ${order.companyName || "N/A"}</p>
    <p><strong>Shipping address:</strong> ${shippingAddress || "N/A"}</p>
    <p><strong>Billing address:</strong> ${billingAddress || "N/A"}</p>
    <p><strong>Order notes:</strong> ${order.shippingNotes || "N/A"}</p>
    <p><strong>Items:</strong></p>
    <ul>${htmlItems || "<li>-</li>"}</ul>
    <p><strong>Currency:</strong> ${order.currency}</p>
    <p><strong>Subtotal:</strong> ${order.items.reduce((acc, item) => acc + item.lineTotal, 0).toFixed(2)} ${order.currency}</p>
    ${order.discountAmount > 0 ? `<p><strong>Discount${order.couponCode ? ` (${order.couponCode})` : ""}:</strong> -${order.discountAmount.toFixed(2)} ${order.currency}</p>` : ""}
    <p><strong>${shippingLine}</strong></p>
    <p><strong>Total:</strong> ${order.totalAmount.toFixed(2)} ${order.currency}</p>
    <p><strong>Invoice:</strong> ${order.btcpayInvoiceId || "N/A"}</p>
  `;

  await sendResendEmail({
    resendApiKey,
    from,
    to: order.customerEmail,
    subject: customerSubject,
    text: customerText,
    html: customerHtml,
  });

  await sendResendEmail({
    resendApiKey,
    from,
    to: ADMIN_ORDER_EMAIL,
    subject: managementSubject,
    text: managementText,
    html: managementHtml,
  });
};

webhookRoutes.post("/btcpay", async (c) => {
  try {
    const rawBody = await c.req.text();
    const body = JSON.parse(rawBody);
    const parsed = btcpayWebhookSchema.safeParse(body);
    const webhookSecret = c.var.btcpayWebhookSecret;

    if (webhookSecret) {
      const providedSignature = extractSignature(
        c.req.header("btcpay-sig") || c.req.header("x-btcpay-sig") || undefined,
      );
      if (!providedSignature) {
        return c.json({ error: "Missing BTCPay signature" }, 401);
      }
      const expectedSignature = await computeHmacSha256Hex(webhookSecret, rawBody);
      if (!constantTimeEquals(providedSignature, expectedSignature)) {
        return c.json({ error: "Invalid BTCPay signature" }, 401);
      }
    }

    const deliveryId =
      c.req.header("btcpay-sig") ||
      c.req.header("x-delivery-id") ||
      (parsed.success ? parsed.data.deliveryId : undefined) ||
      (body?.deliveryId as string | undefined) ||
      crypto.randomUUID();

    const event =
      (parsed.success ? parsed.data.event : undefined) ||
      (body?.event as string | undefined) ||
      (body?.type as string | undefined) ||
      "";

    const invoiceId =
      (parsed.success ? parsed.data.invoiceId : undefined) ||
      (body?.invoiceId as string | undefined) ||
      (body?.invoice?.id as string | undefined) ||
      "";

    if (!event || !invoiceId) {
      return c.json({ error: "Missing BTCPay event or invoiceId" }, 400);
    }

    const result = await applyBtcPayWebhook(c.var.db, {
      deliveryId,
      event,
      invoiceId,
      raw: parsed.success ? parsed.data.raw : body,
    });

    const normalizedEvent = event.toLowerCase();
    const isSuccessfulPaymentEvent =
      normalizedEvent.includes("confirmed") ||
      normalizedEvent.includes("paid") ||
      normalizedEvent.includes("settled") ||
      normalizedEvent.includes("completed");

    if (isSuccessfulPaymentEvent) {
      const { resendApiKey, contactFromEmail } = c.var.contact;
      const order =
        (result.orderId ? await getOrderById(c.var.db, result.orderId) : null) ||
        (await getOrderByInvoiceId(c.var.db, invoiceId));

      if (resendApiKey && order) {
        const alreadySent = await c.var.db
          .select({ id: orderEvents.id })
          .from(orderEvents)
          .where(and(eq(orderEvents.orderId, order.id), eq(orderEvents.type, "email.order_confirmation_sent")))
          .limit(1);

        if (alreadySent.length === 0) {
          await sendOrderConfirmationEmails(resendApiKey, contactFromEmail, order);
          await c.var.db.insert(orderEvents).values({
            orderId: order.id,
            type: "email.order_confirmation_sent",
            message: "Order confirmation emails sent",
            payload: { invoiceId, event },
          });
        }
      }
    }

    return c.json(result);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});
