import type { createDb } from "@coincart/db";
import type { BtcPayClient } from "@coincart/payments";

export type AppContext = {
  Variables: {
    db: ReturnType<typeof createDb>;
    btcpay: BtcPayClient;
    contact: {
      resendApiKey?: string;
      contactToEmail: string;
      contactFromEmail: string;
    };
    connectorAuth: {
      consumerKey?: string;
      consumerSecret?: string;
    };
    orderRedirectBaseUrl?: string;
    btcpayWebhookSecret?: string;
    rawBody?: string;
  };
};
