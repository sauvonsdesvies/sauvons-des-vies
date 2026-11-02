export const CAMPAIGN_CURRENCIES = [
  { code: "XOF", label: "F CFA — Afrique de l’Ouest" },
  { code: "XAF", label: "F CFA — Cameroun / Afrique centrale" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "USD", label: "Dollar américain (USD)" },
  { code: "GNF", label: "Franc guinéen (GNF)" },
] as const;

/** Display labels only: ISO codes remain unchanged in storage and payments. */
export function currencyUnit(currency: string): string {
  return currency === "XOF" || currency === "XAF" ? "F CFA" : currency;
}

export function formatCfaAmount(amount: number, currency: string, locale: string): string | null {
  return currency === "XOF" || currency === "XAF"
    ? `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount)} F CFA`
    : null;
}

export type CampaignCurrency =
  (typeof CAMPAIGN_CURRENCIES)[number]["code"];

export function isCampaignCurrency(
  value: unknown
): value is CampaignCurrency {
  return CAMPAIGN_CURRENCIES.some(
    (currency) => currency.code === value
  );
}
