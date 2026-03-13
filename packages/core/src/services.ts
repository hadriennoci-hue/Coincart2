import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import {
  orderEvents,
  orderItems,
  orders,
  payments,
  productCollections,
  productPrices,
  products,
  syncJobs,
  webhookEvents,
  type createDb,
} from "@coincart/db";
import type { BtcPayClient } from "@coincart/payments";
import type {
  CheckoutSessionCreate,
  Currency,
  SyncItemsRequest,
} from "@coincart/types";

type Db = ReturnType<typeof createDb>;

const toCollectionKey = (category?: string | null) =>
  (category ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const EU_COUNTRY_CODES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV",
  "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
]);

const EU_COUNTRY_NAME_TO_CODE: Record<string, string> = {
  austria: "AT",
  belgium: "BE",
  bulgaria: "BG",
  croatia: "HR",
  cyprus: "CY",
  czechia: "CZ",
  "czech republic": "CZ",
  denmark: "DK",
  estonia: "EE",
  finland: "FI",
  france: "FR",
  germany: "DE",
  greece: "GR",
  hungary: "HU",
  ireland: "IE",
  italy: "IT",
  latvia: "LV",
  lithuania: "LT",
  luxembourg: "LU",
  malta: "MT",
  netherlands: "NL",
  poland: "PL",
  portugal: "PT",
  romania: "RO",
  slovakia: "SK",
  slovenia: "SI",
  spain: "ES",
  sweden: "SE",
};

const normalizeCountryToCode = (input: string) => {
  const value = input.trim();
  if (!value) return "";
  const upper = value.toUpperCase();
  if (upper.length === 2) return upper;
  return EU_COUNTRY_NAME_TO_CODE[value.toLowerCase()] || "";
};

const SHIPPING_METHOD = "DHL Standard";
const ESTIMATED_DELIVERY_DAYS = 5;
const SHIPPING_FEE_EUR = 10;
const EUR_TO_USD = 1.1;
const SUPPORTED_COUPON = "COINCART10";
const COUPON_DISCOUNT_RATE = 0.1;

const shippingFeeForCurrency = (currency: Currency) =>
  currency === "EUR" ? SHIPPING_FEE_EUR : Number((SHIPPING_FEE_EUR * EUR_TO_USD).toFixed(2));

const generateOrderNumber = () => `CC-${Date.now().toString(36).toUpperCase()}`;

export const startSyncJob = async (db: Db, source: string) => {
  const [job] = await db.insert(syncJobs).values({ source, status: "running" }).returning();
  return job;
};

export const applySyncItems = async (db: Db, input: SyncItemsRequest) => {
  for (const item of input.items) {
    const [product] = await db
      .insert(products)
      .values({
        sku: item.sku,
        slug: item.slug,
        category: item.category,
        name: item.name,
        description: item.description,
        imageUrl: item.imageUrl,
        cpu: item.cpu,
        gpu: item.gpu,
        keyboardLayout: item.keyboardLayout,
        usage: item.usage,
        screenSize: item.screenSize,
        displayType: item.displayType,
        resolution: item.resolution,
        maxResolution: item.maxResolution,
        refreshRate: item.refreshRate,
        ramMemory: item.ramMemory,
        ssdSize: item.ssdSize,
        storage: item.storage,
        featured: item.featured,
        stockQty: item.stockQty,
        lastSeenSyncJobId: input.syncJobId,
        lastSeenInFeedAt: sql`now()`,
      })
      .onConflictDoUpdate({
        target: products.sku,
        set: {
          slug: item.slug,
          category: item.category,
          name: item.name,
          description: item.description,
          imageUrl: item.imageUrl,
          cpu: item.cpu,
          gpu: item.gpu,
          keyboardLayout: item.keyboardLayout,
          usage: item.usage,
          screenSize: item.screenSize,
          displayType: item.displayType,
          resolution: item.resolution,
          maxResolution: item.maxResolution,
          refreshRate: item.refreshRate,
          ramMemory: item.ramMemory,
          ssdSize: item.ssdSize,
          storage: item.storage,
          featured: item.featured,
          stockQty: item.stockQty,
          lastSeenSyncJobId: input.syncJobId,
          lastSeenInFeedAt: sql`now()`,
          updatedAt: sql`now()`,
        },
      })
      .returning();

    for (const currency of ["USD", "EUR"] as const) {
      await db
        .insert(productPrices)
        .values({
          productId: product.id,
          currency,
          amount: item.prices[currency].toFixed(2),
        })
        .onConflictDoUpdate({
          target: [productPrices.productId, productPrices.currency],
          set: { amount: item.prices[currency].toFixed(2), updatedAt: sql`now()` },
        });
    }
  }

  await db
    .update(syncJobs)
    .set({ itemsSeen: sql`${syncJobs.itemsSeen} + ${input.items.length}` })
    .where(eq(syncJobs.id, input.syncJobId));

  return { processed: input.items.length };
};

export const finalizeSyncJob = async (db: Db, syncJobId: string) => {
  const affected = await db
    .update(products)
    .set({ stockQty: 0, updatedAt: sql`now()` })
    .where(and(ne(products.lastSeenSyncJobId, syncJobId), ne(products.stockQty, 0)))
    .returning({ id: products.id });

  await db
    .update(syncJobs)
    .set({
      status: "finished",
      finishedAt: sql`now()`,
      outOfStockApplied: affected.length,
    })
    .where(eq(syncJobs.id, syncJobId));

  return { outOfStockApplied: affected.length };
};

const fetchSkuForCheckout = async (db: Db, sku: string, currency: Currency) => {
  const rows = await db
    .select({
      productId: products.id,
      sku: products.sku,
      name: products.name,
      stockQty: products.stockQty,
      unitPrice: productPrices.amount,
    })
    .from(products)
    .innerJoin(productPrices, eq(productPrices.productId, products.id))
    .where(and(eq(products.sku, sku), eq(productPrices.currency, currency)));

  return rows[0] ?? null;
};

export const createCheckoutSession = async (
  db: Db,
  btcpay: BtcPayClient,
  input: CheckoutSessionCreate,
  options?: {
    orderRedirectBaseUrl?: string;
  },
) => {
  const shippingCountryCode = normalizeCountryToCode(input.shippingCountry);
  if (!EU_COUNTRY_CODES.has(shippingCountryCode)) {
    throw new Error("Shipping is currently available only in EU countries.");
  }

  let subtotal = 0;
  const pricedLines: Array<{
    productId: string;
    sku: string;
    name: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }> = [];

  for (const line of input.lines) {
    const skuData = await fetchSkuForCheckout(db, line.sku, input.currency);
    if (!skuData || skuData.stockQty <= 0) {
      throw new Error(`SKU not available: ${line.sku}`);
    }

    const unitPrice = Number(skuData.unitPrice);
    const lineTotal = unitPrice * line.quantity;
    subtotal += lineTotal;

    pricedLines.push({
      productId: skuData.productId,
      sku: skuData.sku,
      name: skuData.name,
      unitPrice,
      quantity: line.quantity,
      lineTotal,
    });
  }

  const shippingCost = shippingFeeForCurrency(input.currency);
  const normalizedCoupon = String(input.couponCode || "").trim().toUpperCase();
  if (normalizedCoupon && normalizedCoupon !== SUPPORTED_COUPON) {
    throw new Error("Invalid coupon code");
  }
  const couponDiscount =
    normalizedCoupon === SUPPORTED_COUPON ? Number((subtotal * COUPON_DISCOUNT_RATE).toFixed(2)) : 0;
  const discountedSubtotal = Math.max(0, Number((subtotal - couponDiscount).toFixed(2)));
  const totalAmount = Number((discountedSubtotal + shippingCost).toFixed(2));

  const [order] = await db
    .insert(orders)
    .values({
      orderNumber: generateOrderNumber(),
      orderStatus: "pending_payment",
      paymentStatus: "pending",
      fulfillmentStatus: "unfulfilled",
      customerEmail: input.email,
      customerPhone: input.phone,
      shippingName: input.shippingName,
      shippingAddress1: input.streetAddress,
      shippingAddress2: input.secondaryAddress,
      shippingCity: input.city,
      shippingZip: input.postcode,
      shippingCountry: shippingCountryCode,
      shippingMethod: SHIPPING_METHOD,
      shippingNotes: input.shippingNotes,
      estimatedDeliveryDays: ESTIMATED_DELIVERY_DAYS,
      shippingCost: shippingCost.toFixed(2),
      shippingAmount: shippingCost.toFixed(2),
      currency: input.currency,
      subtotalAmount: discountedSubtotal.toFixed(2),
      discountAmount: couponDiscount.toFixed(2),
      taxAmount: "0.00",
      couponCode: normalizedCoupon || null,
      totalAmount: totalAmount.toFixed(2),
      paymentMethod: "btcpay",
      status: "pending_payment",
    })
    .returning();

  await db.insert(orderEvents).values({
    orderId: order.id,
    type: "order.created",
    message: "Order created and awaiting payment",
    payload: { currency: input.currency, subtotal, couponCode: normalizedCoupon || null },
  });

  for (const line of pricedLines) {
    await db.insert(orderItems).values({
      orderId: order.id,
      productId: line.productId,
      sku: line.sku,
      productName: line.name,
      unitPrice: line.unitPrice.toFixed(2),
      quantity: line.quantity,
      lineTotal: line.lineTotal.toFixed(2),
    });
  }

  const invoice = await btcpay.createInvoice({
    amount: totalAmount,
    currency: input.currency,
    orderId: order.id,
    metadata: normalizedCoupon ? { couponCode: normalizedCoupon, couponDiscount } : undefined,
    redirectUrl: options?.orderRedirectBaseUrl
      ? `${options.orderRedirectBaseUrl.replace(/\/+$/, "")}/${order.id}`
      : undefined,
  });

  const [updated] = await db
    .update(orders)
    .set({
      btcpayInvoiceId: invoice.invoiceId,
      btcpayCheckoutUrl: invoice.checkoutUrl,
      updatedAt: sql`now()`,
    })
    .where(eq(orders.id, order.id))
    .returning();

  await db.insert(payments).values({
    orderId: order.id,
    provider: "btcpay",
    invoiceId: invoice.invoiceId,
    amount: totalAmount.toFixed(2),
    currency: input.currency,
    status: "pending",
    rawJson: { invoiceId: invoice.invoiceId, checkoutUrl: invoice.checkoutUrl },
  });

  await db.insert(orderEvents).values({
    orderId: order.id,
    type: "payment.invoice_created",
    message: "BTCPay invoice created",
    payload: { invoiceId: invoice.invoiceId, checkoutUrl: invoice.checkoutUrl },
  });

  return {
    orderId: updated.id,
    status: updated.status,
    invoiceId: invoice.invoiceId,
    checkoutUrl: invoice.checkoutUrl,
    shippingMethod: updated.shippingMethod || SHIPPING_METHOD,
    estimatedDeliveryDays: updated.estimatedDeliveryDays || ESTIMATED_DELIVERY_DAYS,
    shippingCost: Number(updated.shippingCost ?? shippingCost),
    amount: Number(updated.totalAmount),
    currency: updated.currency as Currency,
  };
};

export const applyBtcPayWebhook = async (db: Db, input: { deliveryId: string; event: string; invoiceId: string; raw: unknown }) => {
  const existing = await db
    .select({ id: webhookEvents.id })
    .from(webhookEvents)
    .where(eq(webhookEvents.deliveryId, input.deliveryId));

  if (existing.length > 0) {
    return { duplicate: true };
  }

  await db.insert(webhookEvents).values({
    provider: "btcpay",
    deliveryId: input.deliveryId,
    eventType: input.event,
    payload: JSON.stringify(input.raw),
  });

  if (input.event.toLowerCase().includes("confirmed") || input.event.toLowerCase().includes("paid")) {
    const [updated] = await db
      .update(orders)
      .set({
        status: "paid",
        orderStatus: "paid",
        paymentStatus: "paid",
        paidAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(orders.btcpayInvoiceId, input.invoiceId),
          ne(orders.status, "paid"),
          ne(orders.status, "confirmed"),
          ne(orders.status, "fulfilled"),
        ),
      )
      .returning({ id: orders.id });

    if (updated?.id) {
      await db
        .update(payments)
        .set({
          status: "paid",
          paidAt: sql`now()`,
          rawJson: input.raw as object,
        })
        .where(and(eq(payments.orderId, updated.id), eq(payments.invoiceId, input.invoiceId)));

      await db.insert(orderEvents).values({
        orderId: updated.id,
        type: "payment.paid",
        message: "BTCPay payment confirmed",
        payload: input.raw as object,
      });
    }

    return { duplicate: false, orderUpdated: Boolean(updated), orderId: updated?.id ?? null };
  }

  return { duplicate: false, orderUpdated: false, orderId: null };
};

export const listProducts = async (db: Db, currency: Currency, featuredOnly = false) => {
  const rows = await db
    .select({
      id: products.id,
      sku: products.sku,
      slug: products.slug,
      category: products.category,
      name: products.name,
      description: products.description,
      imageUrl: products.imageUrl,
      extraAttributes: products.extraAttributes,
      cpu: products.cpu,
      gpu: products.gpu,
      keyboardLayout: products.keyboardLayout,
      usage: products.usage,
      screenSize: products.screenSize,
      displayType: products.displayType,
      resolution: products.resolution,
      maxResolution: products.maxResolution,
      refreshRate: products.refreshRate,
      ramMemory: products.ramMemory,
      ssdSize: products.ssdSize,
      storage: products.storage,
      featured: products.featured,
      stockQty: products.stockQty,
      price: productPrices.amount,
      currency: productPrices.currency,
    })
    .from(products)
    .innerJoin(productPrices, eq(productPrices.productId, products.id))
    .where(
      and(
        eq(productPrices.currency, currency),
        eq(products.isVariant, false),
        eq(products.visibilityStatus, "publish"),
        featuredOnly ? eq(products.featured, true) : sql`true`,
        sql`${products.stockQty} > 0`,
      ),
    );

  return rows.map((row) => ({
    ...row,
    price: Number(row.price),
  }));
};

type ListProductFilters = {
  featuredOnly?: boolean;
  search?: string;
  category?: string;
  collection?: string;
  keyboardLayout?: string;
  usage?: string;
  screenSize?: string;
  ramMemory?: number;
  ssdSize?: number;
  maxResolution?: string;
  sort?: "default" | "price_asc" | "price_desc" | "popularity" | "newest";
};

export const listProductsWithFilters = async (
  db: Db,
  currency: Currency,
  filters: ListProductFilters,
) => {
  const where = and(
    eq(productPrices.currency, currency),
    eq(products.isVariant, false),
    eq(products.visibilityStatus, "publish"),
    sql`${products.stockQty} > 0`,
    filters.featuredOnly ? eq(products.featured, true) : sql`true`,
    filters.search
      ? sql`(${products.name} ILIKE ${`%${filters.search}%`} OR ${products.sku} ILIKE ${`%${filters.search}%`} OR ${products.category} ILIKE ${`%${filters.search}%`})`
      : sql`true`,
    filters.category ? eq(products.category, filters.category) : sql`true`,
    filters.keyboardLayout ? eq(products.keyboardLayout, filters.keyboardLayout) : sql`true`,
    filters.usage ? eq(products.usage, filters.usage) : sql`true`,
    filters.screenSize ? eq(products.screenSize, filters.screenSize) : sql`true`,
    typeof filters.ramMemory === "number" ? eq(products.ramMemory, filters.ramMemory) : sql`true`,
    typeof filters.ssdSize === "number" ? eq(products.ssdSize, filters.ssdSize) : sql`true`,
    filters.maxResolution ? eq(products.maxResolution, filters.maxResolution) : sql`true`,
  );

  const orderBy =
    filters.sort === "price_asc"
      ? asc(productPrices.amount)
      : filters.sort === "price_desc"
        ? desc(productPrices.amount)
        : filters.sort === "popularity"
          ? desc(products.stockQty)
          : filters.sort === "newest"
            ? desc(products.createdAt)
            : asc(products.name);

  const rows = await db
    .select({
      id: products.id,
      sku: products.sku,
      slug: products.slug,
      category: products.category,
      name: products.name,
      description: products.description,
      imageUrl: products.imageUrl,
      cpu: products.cpu,
      gpu: products.gpu,
      keyboardLayout: products.keyboardLayout,
      usage: products.usage,
      screenSize: products.screenSize,
      displayType: products.displayType,
      resolution: products.resolution,
      maxResolution: products.maxResolution,
      refreshRate: products.refreshRate,
      ramMemory: products.ramMemory,
      ssdSize: products.ssdSize,
      storage: products.storage,
      featured: products.featured,
      stockQty: products.stockQty,
      price: productPrices.amount,
      currency: productPrices.currency,
    })
    .from(products)
    .innerJoin(productPrices, eq(productPrices.productId, products.id))
    .where(where)
    .orderBy(orderBy);

  let items = rows.map((row) => ({
    ...row,
    collection: toCollectionKey(row.category),
    price: Number(row.price),
  }));
  if (filters.collection) {
    const expectedCollection = filters.collection.toLowerCase().trim();
    items = items.filter((item) => item.collection === expectedCollection);
  }
  return items;
};

export const listTopSellingProducts = async (db: Db, currency: Currency, limit = 4) => {
  const cappedLimit = Math.max(1, Math.min(24, limit));
  const soldQtyExpr = sql<number>`COALESCE(SUM(CASE WHEN ${orders.id} IS NOT NULL THEN ${orderItems.quantity} ELSE 0 END), 0)`;

  const rows = await db
    .select({
      id: products.id,
      sku: products.sku,
      slug: products.slug,
      category: products.category,
      name: products.name,
      description: products.description,
      imageUrl: products.imageUrl,
      cpu: products.cpu,
      gpu: products.gpu,
      keyboardLayout: products.keyboardLayout,
      usage: products.usage,
      screenSize: products.screenSize,
      displayType: products.displayType,
      resolution: products.resolution,
      maxResolution: products.maxResolution,
      refreshRate: products.refreshRate,
      ramMemory: products.ramMemory,
      ssdSize: products.ssdSize,
      storage: products.storage,
      featured: products.featured,
      stockQty: products.stockQty,
      price: productPrices.amount,
      currency: productPrices.currency,
      soldQty: soldQtyExpr,
    })
    .from(products)
    .innerJoin(productPrices, eq(productPrices.productId, products.id))
    .leftJoin(orderItems, eq(orderItems.sku, products.sku))
    .leftJoin(orders, and(eq(orders.id, orderItems.orderId), eq(orders.status, "paid")))
    .where(
      and(
        eq(productPrices.currency, currency),
        eq(products.isVariant, false),
        eq(products.visibilityStatus, "publish"),
        sql`${products.stockQty} > 0`,
      ),
    )
    .groupBy(
      products.id,
      products.sku,
      products.slug,
      products.category,
      products.name,
      products.description,
      products.imageUrl,
      products.cpu,
      products.gpu,
      products.keyboardLayout,
      products.usage,
      products.screenSize,
      products.displayType,
      products.resolution,
      products.maxResolution,
      products.refreshRate,
      products.ramMemory,
      products.ssdSize,
      products.storage,
      products.featured,
      products.stockQty,
      productPrices.amount,
      productPrices.currency,
    )
    .orderBy(desc(soldQtyExpr), desc(products.stockQty), asc(products.name))
    .limit(cappedLimit);

  return rows.map((row) => ({
    ...row,
    collection: toCollectionKey(row.category),
    price: Number(row.price),
    soldQty: Number(row.soldQty ?? 0),
  }));
};

export const getProductBySlug = async (db: Db, slug: string, currency: Currency) => {
  const rows = await db
    .select({
      id: products.id,
      sku: products.sku,
      slug: products.slug,
      category: products.category,
      name: products.name,
      description: products.description,
      imageUrl: products.imageUrl,
      cpu: products.cpu,
      gpu: products.gpu,
      keyboardLayout: products.keyboardLayout,
      usage: products.usage,
      screenSize: products.screenSize,
      displayType: products.displayType,
      resolution: products.resolution,
      maxResolution: products.maxResolution,
      refreshRate: products.refreshRate,
      ramMemory: products.ramMemory,
      ssdSize: products.ssdSize,
      storage: products.storage,
      featured: products.featured,
      stockQty: products.stockQty,
      price: productPrices.amount,
      currency: productPrices.currency,
    })
    .from(products)
    .innerJoin(productPrices, eq(productPrices.productId, products.id))
    .where(
      and(
        eq(products.slug, slug),
        eq(productPrices.currency, currency),
        eq(products.isVariant, false),
        eq(products.visibilityStatus, "publish"),
      ),
    );

  if (!rows[0]) return null;
  return {
    ...rows[0],
    collection: toCollectionKey(rows[0].category),
    price: Number(rows[0].price),
  };
};

export const getProductsBySkus = async (db: Db, skus: string[], currency: Currency) => {
  if (skus.length === 0) return [];
  const rows = await db
    .select({
      id: products.id,
      sku: products.sku,
      slug: products.slug,
      category: products.category,
      name: products.name,
      imageUrl: products.imageUrl,
      keyboardLayout: products.keyboardLayout,
      usage: products.usage,
      screenSize: products.screenSize,
      ramMemory: products.ramMemory,
      ssdSize: products.ssdSize,
      maxResolution: products.maxResolution,
      stockQty: products.stockQty,
      price: productPrices.amount,
      currency: productPrices.currency,
    })
    .from(products)
    .innerJoin(productPrices, eq(productPrices.productId, products.id))
    .where(
      and(
        inArray(products.sku, skus),
        eq(productPrices.currency, currency),
        eq(products.visibilityStatus, "publish"),
      ),
    );

  return rows.map((row) => ({
    ...row,
    collection: toCollectionKey(row.category),
    price: Number(row.price),
  }));
};

export const listCollectionsWithCounts = async (db: Db) => {
  const [collections, countRows] = await Promise.all([
    db
      .select({
        id: productCollections.id,
        key: productCollections.key,
        label: productCollections.label,
      })
      .from(productCollections)
      .orderBy(asc(productCollections.label)),
    db
      .select({
        category: products.category,
      })
      .from(products)
      .where(
        and(
          eq(products.isVariant, false),
          eq(products.visibilityStatus, "publish"),
          sql`${products.stockQty} > 0`,
          sql`${products.category} IS NOT NULL`,
        ),
      ),
  ]);

  const counts = new Map<string, number>();
  for (const row of countRows) {
    const key = toCollectionKey(row.category);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return collections.map((collection) => ({
    id: collection.id,
    key: collection.key,
    label: collection.label,
    productCount: counts.get(collection.key) ?? 0,
  }));
};

export const getOrderById = async (db: Db, orderId: string) => {
  const orderRows = await db
    .select({
      id: orders.id,
      customerEmail: orders.customerEmail,
      customerPhone: orders.customerPhone,
      currency: orders.currency,
      shippingMethod: orders.shippingMethod,
      estimatedDeliveryDays: orders.estimatedDeliveryDays,
      shippingCost: orders.shippingCost,
      totalAmount: orders.totalAmount,
      status: orders.status,
      btcpayInvoiceId: orders.btcpayInvoiceId,
      btcpayCheckoutUrl: orders.btcpayCheckoutUrl,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.id, orderId));

  if (!orderRows[0]) return null;

  const itemRows = await db
    .select({
      sku: orderItems.sku,
      productName: orderItems.productName,
      unitPrice: orderItems.unitPrice,
      quantity: orderItems.quantity,
      lineTotal: orderItems.lineTotal,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  return {
    ...orderRows[0],
    shippingCost: Number(orderRows[0].shippingCost ?? 0),
    totalAmount: Number(orderRows[0].totalAmount),
    items: itemRows.map((x) => ({
      ...x,
      unitPrice: Number(x.unitPrice),
      lineTotal: Number(x.lineTotal),
    })),
  };
};

export const getOrderByInvoiceId = async (db: Db, invoiceId: string) => {
  const rows = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.btcpayInvoiceId, invoiceId))
    .limit(1);
  if (!rows[0]) return null;
  return getOrderById(db, rows[0].id);
};
