import { relations, sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
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
  wooId: integer("woo_id").unique(),
  parentProductId: uuid("parent_product_id"),
  isVariant: boolean("is_variant").notNull().default(false),
  optionName: varchar("option_name", { length: 120 }),
  optionValue: varchar("option_value", { length: 160 }),
  sku: varchar("sku", { length: 120 }).notNull().unique(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  category: varchar("category", { length: 120 }),
  visibilityStatus: varchar("visibility_status", { length: 20 }).notNull().default("publish"),
  brand: varchar("brand", { length: 120 }),
  ean: varchar("ean", { length: 64 }),
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
  salePriceEur: numeric("sale_price_eur", { precision: 12, scale: 2 }),
  salePriceUsd: numeric("sale_price_usd", { precision: 12, scale: 2 }),
  extraAttributes: jsonb("extra_attributes").$type<Array<{ name: string; options: string[] }>>(),
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
  orderNumber: varchar("order_number", { length: 40 }).unique(),
  orderStatus: varchar("order_status", { length: 30 }).notNull().default("pending_payment"),
  paymentStatus: varchar("payment_status", { length: 30 }).notNull().default("pending"),
  fulfillmentStatus: varchar("fulfillment_status", { length: 30 }).notNull().default("unfulfilled"),
  customerEmail: varchar("customer_email", { length: 320 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 30 }),
  shippingName: varchar("shipping_name", { length: 120 }),
  shippingAddress1: varchar("shipping_address1", { length: 200 }),
  shippingAddress2: varchar("shipping_address2", { length: 200 }),
  shippingCity: varchar("shipping_city", { length: 120 }),
  shippingZip: varchar("shipping_zip", { length: 30 }),
  shippingCountry: varchar("shipping_country", { length: 2 }),
  billingName: varchar("billing_name", { length: 120 }),
  billingAddress1: varchar("billing_address1", { length: 200 }),
  billingAddress2: varchar("billing_address2", { length: 200 }),
  billingCity: varchar("billing_city", { length: 120 }),
  billingZip: varchar("billing_zip", { length: 30 }),
  billingCountry: varchar("billing_country", { length: 2 }),
  shippingMethod: varchar("shipping_method", { length: 60 }),
  shippingNotes: text("shipping_notes"),
  estimatedDeliveryDays: integer("estimated_delivery_days"),
  shippingCost: numeric("shipping_cost", { precision: 12, scale: 2 }),
  shippingAmount: numeric("shipping_amount", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 3 }).notNull(),
  subtotalAmount: numeric("subtotal_amount", { precision: 12, scale: 2 }).notNull(),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }),
  taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }),
  couponCode: varchar("coupon_code", { length: 40 }),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 40 }),
  status: varchar("status", { length: 30 }).notNull().default("pending_payment"),
  btcpayInvoiceId: varchar("btcpay_invoice_id", { length: 120 }),
  btcpayCheckoutUrl: text("btcpay_checkout_url"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  expiredAt: timestamp("expired_at", { withTimezone: true }),
  canceledAt: timestamp("canceled_at", { withTimezone: true }),
  shippedAt: timestamp("shipped_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  returnedAt: timestamp("returned_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
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
  variant: varchar("variant", { length: 160 }),
  optionsJson: jsonb("options_json"),
});

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 40 }).notNull().default("btcpay"),
  invoiceId: varchar("invoice_id", { length: 120 }),
  txId: varchar("tx_id", { length: 160 }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  rawJson: jsonb("raw_json"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  expiredAt: timestamp("expired_at", { withTimezone: true }),
  refundedAt: timestamp("refunded_at", { withTimezone: true }),
});

export const orderEvents = pgTable("order_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 80 }).notNull(),
  message: text("message"),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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

export const productCollections = pgTable("product_collections", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key", { length: 80 }).notNull().unique(),
  label: varchar("label", { length: 120 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
});

export const productCollectionAttributes = pgTable(
  "product_collection_attributes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => productCollections.id, { onDelete: "cascade" }),
    attributeKey: varchar("attribute_key", { length: 80 }).notNull(),
    label: varchar("label", { length: 120 }).notNull(),
    dataType: varchar("data_type", { length: 30 }).notNull().default("text"),
    unit: varchar("unit", { length: 30 }),
    multiValue: boolean("multi_value").notNull().default(false),
    required: boolean("required").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => sql`now()`),
  },
  (t) => ({
    uniqCollectionAttributeKey: unique().on(t.collectionId, t.attributeKey),
  }),
);

export const productCollectionAttributeValues = pgTable(
  "product_collection_attribute_values",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collectionAttributeId: uuid("collection_attribute_id")
      .notNull()
      .references(() => productCollectionAttributes.id, { onDelete: "cascade" }),
    value: varchar("value", { length: 160 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqCollectionAttributeValue: unique().on(t.collectionAttributeId, t.value),
  }),
);

export const productsRelations = relations(products, ({ many }) => ({
  prices: many(productPrices),
}));

export const productPricesRelations = relations(productPrices, ({ one }) => ({
  product: one(products, {
    fields: [productPrices.productId],
    references: [products.id],
  }),
}));

export const productCollectionAttributesRelations = relations(
  productCollectionAttributes,
  ({ one, many }) => ({
    collection: one(productCollections, {
      fields: [productCollectionAttributes.collectionId],
      references: [productCollections.id],
    }),
    values: many(productCollectionAttributeValues),
  }),
);

export const productCollectionsRelations = relations(productCollections, ({ many }) => ({
  attributes: many(productCollectionAttributes),
}));

export const productCollectionAttributeValuesRelations = relations(
  productCollectionAttributeValues,
  ({ one }) => ({
    attribute: one(productCollectionAttributes, {
      fields: [productCollectionAttributeValues.collectionAttributeId],
      references: [productCollectionAttributes.id],
    }),
  }),
);
