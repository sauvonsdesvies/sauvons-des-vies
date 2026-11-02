
import type { PublicLanguage } from "./home-types";
import { COUNTRIES } from "@/lib/countries";

export function formatPublicCountry(value: string, language: PublicLanguage): string {
  const code = /^[A-Za-z]{2}$/.test(value) ? value.toUpperCase() : COUNTRIES.find(country => country.name === value)?.code;
  return code ? new Intl.DisplayNames([language], { type: "region" }).of(code) ?? value : value;
}

// ==========================================================
// FONDATION SAUVONS DES VIES
// FORMATAGE — PAGE D'ACCUEIL PUBLIQUE
// ==========================================================

// ----------------------------------------------------------
// LOCALES
// ----------------------------------------------------------

const LOCALES: Record<PublicLanguage, string> = {
  fr: "fr-FR",
  en: "en-US",
  es: "es-ES",
  de: "de-DE",
};

export function getPublicLocale(
  language: PublicLanguage = "fr"
): string {
  return LOCALES[language] ?? LOCALES.fr;
}

// ----------------------------------------------------------
// NOMBRES
// ----------------------------------------------------------

export function formatNumber(
  value: number,
  language: PublicLanguage = "fr"
): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return new Intl.NumberFormat(
    getPublicLocale(language),
    {
      maximumFractionDigits: 0,
    }
  ).format(value);
}

// ----------------------------------------------------------
// MONTANTS
// ----------------------------------------------------------

export function formatMoney(
  amount: number,
  currency = "XOF",
  language: PublicLanguage = "fr"
): string {
  if (!Number.isFinite(amount)) {
    return "—";
  }

  try {
    return new Intl.NumberFormat(
      getPublicLocale(language),
      {
        style: "currency", currencyDisplay: "code", currency,
        maximumFractionDigits: 0,
      }
    ).format(amount);
  } catch {
    return `${formatNumber(amount, language)} ${currency}`;
  }
}

// ----------------------------------------------------------
// POURCENTAGES
// ----------------------------------------------------------

export function calculateProgress(
  collectedAmount: number,
  targetAmount: number
): number {
  if (
    !Number.isFinite(collectedAmount) ||
    !Number.isFinite(targetAmount) ||
    targetAmount <= 0
  ) {
    return 0;
  }

  const percentage =
    (Math.max(0, collectedAmount) / targetAmount) *
    100;

  return Math.min(
    100,
    Math.max(0, Math.round(percentage))
  );
}

export function formatPercentage(
  percentage: number,
  language: PublicLanguage = "fr"
): string {
  const normalized = Number.isFinite(percentage)
    ? Math.min(100, Math.max(0, percentage))
    : 0;

  return new Intl.NumberFormat(
    getPublicLocale(language),
    {
      maximumFractionDigits: 0,
      style: "percent",
    }
  ).format(normalized / 100);
}

// ----------------------------------------------------------
// RESTE À FINANCER
// ----------------------------------------------------------

export function calculateRemainingAmount(
  targetAmount: number,
  collectedAmount: number
): number {
  if (
    !Number.isFinite(targetAmount) ||
    !Number.isFinite(collectedAmount)
  ) {
    return 0;
  }

  return Math.max(
    0,
    targetAmount - collectedAmount
  );
}

// ----------------------------------------------------------
// DATES
// ----------------------------------------------------------

export function formatPublicDate(
  value: string | Date | null | undefined,
  language: PublicLanguage = "fr"
): string {
  if (!value) {
    return "—";
  }

  const date =
    value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    getPublicLocale(language),
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }
  ).format(date);
}

// ----------------------------------------------------------
// CONVERSION DATE ISO
// ----------------------------------------------------------

export function toISOStringOrNull(
  value: Date | string | null | undefined
): string | null {
  if (!value) {
    return null;
  }

  const date =
    value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

// ----------------------------------------------------------
// LIMITES NUMÉRIQUES
// ----------------------------------------------------------

export function normalizeNonNegativeNumber(
  value: number
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, value);
}

// ----------------------------------------------------------
// IDENTIFIANTS URL
// ----------------------------------------------------------

export function makePublicSlug(
  value: string
): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
