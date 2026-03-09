import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import {
  orderItems,
  orders,
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
) => {
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

  const [order] = await db
    .insert(orders)
    .values({
      customerEmail: input.email,
      customerPhone: input.phone,
      currency: input.currency,
      subtotalAmount: subtotal.toFixed(2),
      totalAmount: subtotal.toFixed(2),
      status: "pending_payment",
    })
    .returning();

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
    amount: subtotal,
    currency: input.currency,
    orderId: order.id,
    buyerEmail: input.email,
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

  return {
    orderId: updated.id,
    status: updated.status,
    invoiceId: invoice.invoiceId,
    checkoutUrl: invoice.checkoutUrl,
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
      .set({ status: "paid", paidAt: sql`now()`, updatedAt: sql`now()` })
      .where(eq(orders.btcpayInvoiceId, input.invoiceId))
      .returning({ id: orders.id });

    return { duplicate: false, orderUpdated: Boolean(updated) };
  }

  return { duplicate: false, orderUpdated: false };
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
    sql`${products.stockQty} > 0`,
    filters.featuredOnly ? eq(products.featured, true) : sql`true`,
    filters.search
      ? sql`(${products.name} ILIKE ${`%${filters.search}%`} OR ${products.sku} ILIKE ${`%${filters.search}%`})`
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

  return rows.map((row) => ({ ...row, price: Number(row.price) }));
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
    .where(and(eq(products.slug, slug), eq(productPrices.currency, currency)));

  if (!rows[0]) return null;
  return { ...rows[0], price: Number(rows[0].price) };
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
    .where(and(inArray(products.sku, skus), eq(productPrices.currency, currency)));

  return rows.map((row) => ({ ...row, price: Number(row.price) }));
};

export const getOrderById = async (db: Db, orderId: string) => {
  const orderRows = await db
    .select({
      id: orders.id,
      customerEmail: orders.customerEmail,
      customerPhone: orders.customerPhone,
      currency: orders.currency,
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
    totalAmount: Number(orderRows[0].totalAmount),
    items: itemRows.map((x) => ({
      ...x,
      unitPrice: Number(x.unitPrice),
      lineTotal: Number(x.lineTotal),
    })),
  };
};
