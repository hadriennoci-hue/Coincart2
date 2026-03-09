import { relations, sql } from "drizzle-orm";
import {
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  sku: varchar("sku", { length: 120 }).notNull().unique(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  category: varchar("category", { length: 120 }),
  name: varchar("name", { length: 220 }).notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  cpu: varchar("cpu", { length: 120 }),
  gpu: varchar("gpu", { length: 120 }),
  keyboardLayout: varchar("keyboard_layout", { length: 30 }),
  usage: varchar("usage", { length: 60 }),
  screenSize: varchar("screen_size", { length: 30 }),
  displayType: varchar("display_type", { length: 60 }),
  resolution: varchar("resolution", { length: 30 }),
  maxResolution: varchar("max_resolution", { length: 30 }),
  refreshRate: integer("refresh_rate"),
  ramMemory: integer("ram_memory"),
  ssdSize: integer("ssd_size"),
  storage: varchar("storage", { length: 120 }),
  featured: boolean("featured").notNull().default(false),
  stockQty: integer("stock_qty").notNull().default(0),
  lastSeenSyncJobId: uuid("last_seen_sync_job_id"),
  lastSeenInFeedAt: timestamp("last_seen_in_feed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
});

export const productPrices = pgTable(
  "product_prices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    currency: varchar("currency", { length: 3 }).notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => sql`now()`),
  },
  (t) => ({
    uniqProductCurrency: unique().on(t.productId, t.currency),
  }),
);

export const syncJobs = pgTable("sync_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  source: varchar("source", { length: 100 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("running"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  itemsSeen: integer("items_seen").notNull().default(0),
  outOfStockApplied: integer("out_of_stock_applied").notNull().default(0),
});

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerEmail: varchar("customer_email", { length: 320 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 30 }),
  shippingCountry: varchar("shipping_country", { length: 2 }),
  shippingMethod: varchar("shipping_method", { length: 60 }),
  estimatedDeliveryDays: integer("estimated_delivery_days"),
  shippingCost: numeric("shipping_cost", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 3 }).notNull(),
  subtotalAmount: numeric("subtotal_amount", { precision: 12, scale: 2 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("pending_payment"),
  btcpayInvoiceId: varchar("btcpay_invoice_id", { length: 120 }),
  btcpayCheckoutUrl: text("btcpay_checkout_url"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  sku: varchar("sku", { length: 120 }).notNull(),
  productName: varchar("product_name", { length: 220 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
});

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  keyId: varchar("key_id", { length: 80 }).notNull().unique(),
  secret: varchar("secret", { length: 128 }).notNull(),
  label: varchar("label", { length: 120 }).notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
});

export const requestNonces = pgTable(
  "request_nonces",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    nonce: varchar("nonce", { length: 120 }).notNull(),
    keyId: varchar("key_id", { length: 80 }).notNull(),
    seenAt: timestamp("seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqNonceByKey: unique().on(t.keyId, t.nonce),
  }),
);

export const webhookEvents = pgTable("webhook_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  provider: varchar("provider", { length: 40 }).notNull(),
  deliveryId: varchar("delivery_id", { length: 120 }).notNull().unique(),
  eventType: varchar("event_type", { length: 120 }).notNull(),
  payload: text("payload").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const productsRelations = relations(products, ({ many }) => ({
  prices: many(productPrices),
}));

export const productPricesRelations = relations(productPrices, ({ one }) => ({
  product: one(products, {
    fields: [productPrices.productId],
    references: [products.id],
  }),
}));
