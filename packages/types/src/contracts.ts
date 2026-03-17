import { z } from "zod";

export const currencySchema = z.enum(["USD", "EUR"]);

export const syncStartRequestSchema = z.object({
  source: z.string().min(1).max(100).default("wizhard.store"),
});

export const syncStartResponseSchema = z.object({
  syncJobId: z.string().uuid(),
  startedAt: z.string(),
});

export const syncedProductSchema = z.object({
  sku: z.string().min(1).max(120),
  slug: z.string().min(1).max(160),
  collection: z.string().max(120).optional(),
  category: z.string().max(120).optional(),
  name: z.string().min(1).max(220),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional(),
  imageUrls: z.array(z.string().url()).max(50).optional(),
  cpu: z.string().max(120).optional(),
  gpu: z.string().max(120).optional(),
  keyboardLayout: z.string().max(30).optional(),
  usage: z.string().max(60).optional(),
  screenSize: z.string().max(30).optional(),
  displayType: z.string().max(60).optional(),
  resolution: z.string().max(30).optional(),
  maxResolution: z.string().max(30).optional(),
  refreshRate: z.number().int().positive().optional(),
  ramMemory: z.number().int().positive().optional(),
  ssdSize: z.number().int().positive().optional(),
  storage: z.string().max(120).optional(),
  featured: z.boolean().default(false),
  stockQty: z.number().int().nonnegative(),
  prices: z.object({
    USD: z.number().nonnegative(),
    EUR: z.number().nonnegative(),
  }),
});

export const syncItemsRequestSchema = z.object({
  syncJobId: z.string().uuid(),
  items: z.array(syncedProductSchema).min(1).max(5000),
});

export const syncItemsResponseSchema = z.object({
  syncJobId: z.string().uuid(),
  processed: z.number().int().nonnegative(),
});

export const syncFinalizeRequestSchema = z.object({
  syncJobId: z.string().uuid(),
});

export const syncFinalizeResponseSchema = z.object({
  syncJobId: z.string().uuid(),
  outOfStockApplied: z.number().int().nonnegative(),
});

export const checkoutLineSchema = z.object({
  sku: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const checkoutSessionCreateSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(1).max(30),
  shippingName: z.string().min(1).max(120),
  companyName: z.string().max(160).optional(),
  streetAddress: z.string().min(1).max(200),
  secondaryAddress: z.string().max(200).optional(),
  city: z.string().min(1).max(120),
  postcode: z.string().min(1).max(30),
  shippingCountry: z.string().min(2).max(100),
  shippingNotes: z.string().max(2000).optional(),
  agreeTermsAccepted: z.boolean().optional(),
  currency: currencySchema,
  couponCode: z.string().trim().min(1).max(40).optional(),
  lines: z.array(checkoutLineSchema).min(1).max(100),
});

export const checkoutSessionResponseSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(["pending_payment", "paid", "confirmed", "fulfilled", "cancelled"]),
  invoiceId: z.string(),
  checkoutUrl: z.string().url(),
  shippingMethod: z.string(),
  estimatedDeliveryDays: z.number().int().positive(),
  shippingCost: z.number().nonnegative(),
  amount: z.number().nonnegative(),
  currency: currencySchema,
});

export const btcpayWebhookSchema = z.object({
  deliveryId: z.string().min(1),
  event: z.string().min(1),
  invoiceId: z.string().min(1),
  orderId: z.string().uuid().optional(),
  paid: z.boolean().optional(),
  raw: z.unknown(),
});

export type Currency = z.infer<typeof currencySchema>;
export type SyncItemsRequest = z.infer<typeof syncItemsRequestSchema>;
export type CheckoutSessionCreate = z.infer<typeof checkoutSessionCreateSchema>;
