export type BtcPayInvoiceRequest = {
  amount: number;
  currency: "USD" | "EUR";
  orderId: string;
  buyerEmail: string;
  metadata?: Record<string, unknown>;
};

export type BtcPayInvoiceResponse = {
  invoiceId: string;
  checkoutUrl: string;
};

export interface BtcPayClient {
  createInvoice(input: BtcPayInvoiceRequest): Promise<BtcPayInvoiceResponse>;
}

export class FakeBtcPayClient implements BtcPayClient {
  async createInvoice(input: BtcPayInvoiceRequest): Promise<BtcPayInvoiceResponse> {
    return {
      invoiceId: `inv_${input.orderId}`,
      checkoutUrl: `https://btcpay.local/checkout/${input.orderId}`,
    };
  }
}

type GreenfieldBtcPayClientOptions = {
  host: string;
  storeId: string;
  apiKey: string;
  timeoutMs?: number;
};

type GreenfieldInvoiceResponse = {
  id?: string;
  checkoutLink?: string;
  message?: string;
};

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export class GreenfieldBtcPayClient implements BtcPayClient {
  private readonly baseUrl: string;
  private readonly storeId: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(options: GreenfieldBtcPayClientOptions) {
    this.baseUrl = trimTrailingSlash(options.host);
    this.storeId = options.storeId;
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs ?? 10_000;
  }

  async createInvoice(input: BtcPayInvoiceRequest): Promise<BtcPayInvoiceResponse> {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), this.timeoutMs);
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/stores/${encodeURIComponent(this.storeId)}/invoices`,
        {
          method: "POST",
          headers: {
            Authorization: `token ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: Number(input.amount.toFixed(2)),
            currency: input.currency,
            metadata: {
              orderId: input.orderId,
              buyerEmail: input.buyerEmail,
              ...(input.metadata ?? {}),
            },
          }),
          signal: abort.signal,
        },
      );

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`BTCPay invoice creation failed (${response.status}) ${body}`);
      }

      const data = (await response.json()) as GreenfieldInvoiceResponse;
      if (!data.id || !data.checkoutLink) {
        throw new Error("BTCPay response missing invoice id or checkout link");
      }

      return {
        invoiceId: data.id,
        checkoutUrl: data.checkoutLink,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
