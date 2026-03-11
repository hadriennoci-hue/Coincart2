const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  CHF: "CHF",
  XMR: "XMR",
  BTC: "BTC",
};

export function fmtPrice(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${amount.toFixed(2)} ${symbol}`;
}
