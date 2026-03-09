import type { createDb } from "@coincart/db";
import type { BtcPayClient } from "@coincart/payments";

export type AppContext = {
  Variables: {
    db: ReturnType<typeof createDb>;
    btcpay: BtcPayClient;
    rawBody?: string;
  };
};