import { Hono } from "hono";
import { btcpayWebhookSchema } from "@coincart/types";
import { applyBtcPayWebhook, getOrderById, getOrderByInvoiceId } from "@coincart/core";
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

  const subject = `Coincart order paid - ${order.id}`;
  const text = [
    `Order ${order.id} has been paid.`,
    "",
    `Customer: ${order.customerEmail}`,
    `Currency: ${order.currency}`,
    `Subtotal: ${order.items.reduce((acc, item) => acc + item.lineTotal, 0).toFixed(2)} ${order.currency}`,
    shippingLine,
    `Total: ${order.totalAmount.toFixed(2)} ${order.currency}`,
    "",
    "Items:",
    itemsText || "-",
    "",
    `Invoice: ${order.btcpayInvoiceId || "N/A"}`,
  ].join("\n");

  const htmlItems = order.items
    .map(
      (item) =>
        `<li>${item.productName} (${item.sku}) x${item.quantity} - ${item.lineTotal.toFixed(2)} ${order.currency}</li>`,
    )
    .join("");

  const html = `
    <h2>Order Paid</h2>
    <p><strong>Order ID:</strong> ${order.id}</p>
    <p><strong>Customer:</strong> ${order.customerEmail}</p>
    <p><strong>Currency:</strong> ${order.currency}</p>
    <p><strong>Total:</strong> ${order.totalAmount.toFixed(2)} ${order.currency}</p>
    <p><strong>${shippingLine}</strong></p>
    <p><strong>Items:</strong></p>
    <ul>${htmlItems || "<li>-</li>"}</ul>
    <p><strong>Invoice:</strong> ${order.btcpayInvoiceId || "N/A"}</p>
  `;

  const to = Array.from(new Set([order.customerEmail, ADMIN_ORDER_EMAIL]));

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Failed to send order confirmation email (${response.status}) ${errorBody}`);
  }
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

    if (result.orderUpdated) {
      const { resendApiKey, contactFromEmail } = c.var.contact;
      if (resendApiKey) {
        const order =
          (result.orderId ? await getOrderById(c.var.db, result.orderId) : null) ||
          (await getOrderByInvoiceId(c.var.db, invoiceId));
        if (order) {
          await sendOrderConfirmationEmails(resendApiKey, contactFromEmail, order);
        }
      }
    }

    return c.json(result);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 400);
  }
});
