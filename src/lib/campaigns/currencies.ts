export const CAMPAIGN_CURRENCIES = [
  { code: "XOF", label: "Franc CFA — Afrique de l’Ouest (XOF)" },
  { code: "XAF", label: "Franc CFA — Cameroun / Afrique centrale (XAF)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "USD", label: "Dollar américain (USD)" },
  { code: "GNF", label: "Franc guinéen (GNF)" },
] as const;

export type CampaignCurrency =
  (typeof CAMPAIGN_CURRENCIES)[number]["code"];

export function isCampaignCurrency(
  value: unknown
): value is CampaignCurrency {
  return CAMPAIGN_CURRENCIES.some(
    (currency) => currency.code === value
  );
}
