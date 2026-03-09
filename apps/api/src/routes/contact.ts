import { Hono } from "hono";
import { z } from "zod";
import type { AppContext } from "../types";

const subjectOptions = [
  "The product / brand I want is not listed (provide link)",
  "Order support (payment, delivery, product)",
  "Suggestion for Coincart",
  "Business proposal for Coincart",
  "Other",
] as const;

const contactSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(320),
  subject: z.enum(subjectOptions),
  message: z.string().trim().min(10).max(4000),
  company: z.string().optional(),
});

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, "");

export const contactRoutes = new Hono<AppContext>();

contactRoutes.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid contact form payload", issues: parsed.error.issues }, 400);
  }

  const { firstName, lastName, email, subject, message, company } = parsed.data;

  // Honeypot field: silently succeed to avoid giving spammers feedback.
  if (company && company.trim().length > 0) {
    return c.json({ ok: true });
  }

  const { resendApiKey, contactFromEmail, contactToEmail } = c.var.contact;
  if (!resendApiKey) {
    return c.json({ error: "Contact email service is not configured" }, 503);
  }

  const textBody = [
    `New contact form submission`,
    ``,
    `Name: ${firstName} ${lastName}`,
    `Email: ${email}`,
    `Subject: ${subject}`,
    ``,
    `Message:`,
    stripHtml(message),
  ].join("\n");

  const htmlBody = `
    <h2>New contact form submission</h2>
    <p><strong>Name:</strong> ${firstName} ${lastName}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Subject:</strong> ${subject}</p>
    <p><strong>Message:</strong></p>
    <p>${message.replace(/\n/g, "<br />")}</p>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: contactFromEmail,
      to: [contactToEmail],
      reply_to: email,
      subject: `[Coincart Contact] ${subject}`,
      html: htmlBody,
      text: textBody,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "unknown error");
    return c.json({ error: "Failed to send email", providerError: errorBody }, 502);
  }

  return c.json({ ok: true });
});

