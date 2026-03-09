export type BtcPayInvoiceRequest = {
  amount: number;
  currency: "USD" | "EUR";
  orderId: string;
  buyerEmail: string;
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