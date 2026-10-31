
/**
 * ==========================================================
 * FONDATION SAUVONS DES VIES
 * CONFIGURATION INTERNATIONALE — ESPACE PUBLIC
 * ==========================================================
 *
 * Langues prises en charge :
 * - Français
 * - Anglais
 * - Espagnol
 * - Allemand
 *
 * Ce module :
 * - Ne dépend pas de React
 * - Ne dépend pas de Prisma
 * - Ne modifie pas l'administration
 * - Fonctionne côté serveur et côté client
 * - Ne lit pas directement localStorage ou les cookies
 *
 * La persistance de la langue est gérée séparément
 * par LanguageProvider.
 */

// ----------------------------------------------------------
// 1. CODES DES LANGUES
// ----------------------------------------------------------

export const SUPPORTED_LANGUAGES = [
  "fr",
  "en",
  "es",
  "de",
] as const;

export type Language =
  (typeof SUPPORTED_LANGUAGES)[number];

export type LanguageCode = Language;

export type Locale = Language;

// ----------------------------------------------------------
// 2. LANGUE PAR DÉFAUT
// ----------------------------------------------------------

export const DEFAULT_LANGUAGE: Language = "fr";

export const DEFAULT_LOCALE = DEFAULT_LANGUAGE;

// ----------------------------------------------------------
// 3. CONFIGURATION DES LANGUES
// ----------------------------------------------------------

export type LanguageDirection = "ltr" | "rtl";

export interface LanguageConfig {
  code: Language;
  name: string;
  nativeName: string;
  shortName: string;
  flag: string;
  htmlLang: string;
  direction: LanguageDirection;
}

export const LANGUAGE_CONFIG: Record<
  Language,
  LanguageConfig
> = {
  fr: {
    code: "fr",
    name: "Français",
    nativeName: "Français",
    shortName: "FR",
    flag: "🇫🇷",
    htmlLang: "fr",
    direction: "ltr",
  },

  en: {
    code: "en",
    name: "Anglais",
    nativeName: "English",
    shortName: "EN",
    flag: "🇬🇧",
    htmlLang: "en",
    direction: "ltr",
  },

  es: {
    code: "es",
    name: "Espagnol",
    nativeName: "Español",
    shortName: "ES",
    flag: "🇪🇸",
    htmlLang: "es",
    direction: "ltr",
  },

  de: {
    code: "de",
    name: "Allemand",
    nativeName: "Deutsch",
    shortName: "DE",
    flag: "🇩🇪",
    htmlLang: "de",
    direction: "ltr",
  },
};

// ----------------------------------------------------------
// 4. LISTE DES LANGUES POUR LES INTERFACES
// ----------------------------------------------------------

export const LANGUAGE_OPTIONS: readonly LanguageConfig[] =
  SUPPORTED_LANGUAGES.map(
    (language) => LANGUAGE_CONFIG[language]
  );

// ----------------------------------------------------------
// 5. CLÉ DE STOCKAGE DES PRÉFÉRENCES
// ----------------------------------------------------------

export const LANGUAGE_STORAGE_KEY =
  "sdv_public_language";

export const LANGUAGE_COOKIE_NAME =
  "sdv_public_language";

// Durée de conservation de la préférence : 1 an.
export const LANGUAGE_COOKIE_MAX_AGE =
  60 * 60 * 24 * 365;

// ----------------------------------------------------------
// 6. VÉRIFICATION D'UNE LANGUE
// ----------------------------------------------------------

export function isSupportedLanguage(
  value: unknown
): value is Language {
  return (
    typeof value === "string" &&
    SUPPORTED_LANGUAGES.some(
      (language) => language === value
    )
  );
}

// ----------------------------------------------------------
// 7. NORMALISATION D'UNE LANGUE
// ----------------------------------------------------------

export function normalizeLanguage(
  value: unknown
): Language {
  if (typeof value !== "string") {
    return DEFAULT_LANGUAGE;
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");

  if (!normalized) {
    return DEFAULT_LANGUAGE;
  }

  // Exemples :
  // fr-FR -> fr
  // en-US -> en
  // es-ES -> es
  // de-DE -> de

  const baseLanguage = normalized.split("-")[0];

  if (isSupportedLanguage(baseLanguage)) {
    return baseLanguage;
  }

  return DEFAULT_LANGUAGE;
}

// ----------------------------------------------------------
// 8. OBTENIR LES INFORMATIONS D'UNE LANGUE
// ----------------------------------------------------------

export function getLanguageConfig(
  language: unknown
): LanguageConfig {
  const normalized = normalizeLanguage(language);

  return LANGUAGE_CONFIG[normalized];
}

// ----------------------------------------------------------
// 9. OBTENIR LE NOM D'UNE LANGUE
// ----------------------------------------------------------

export function getLanguageName(
  language: unknown
): string {
  return getLanguageConfig(language).nativeName;
}

// ----------------------------------------------------------
// 10. OBTENIR LA DIRECTION DU TEXTE
// ----------------------------------------------------------

export function getLanguageDirection(
  language: unknown
): LanguageDirection {
  return getLanguageConfig(language).direction;
}

// ----------------------------------------------------------
// 11. OBTENIR LE CODE HTML
// ----------------------------------------------------------

export function getHtmlLanguage(
  language: unknown
): string {
  return getLanguageConfig(language).htmlLang;
}

// ----------------------------------------------------------
// 12. DÉTECTER UNE LANGUE À PARTIR DU NAVIGATEUR
// ----------------------------------------------------------

export function detectPreferredLanguage(
  browserLanguages: readonly string[] | null | undefined
): Language {
  if (!browserLanguages?.length) {
    return DEFAULT_LANGUAGE;
  }

  for (const browserLanguage of browserLanguages) {
    const baseLanguage = browserLanguage
      .trim()
      .toLowerCase()
      .replace(/_/g, "-")
      .split("-")[0];

    if (isSupportedLanguage(baseLanguage)) {
      return baseLanguage;
    }
  }

  return DEFAULT_LANGUAGE;
}

// ----------------------------------------------------------
// 13. VÉRIFIER SI UNE LANGUE EST LA LANGUE PAR DÉFAUT
// ----------------------------------------------------------

export function isDefaultLanguage(
  language: unknown
): boolean {
  return (
    normalizeLanguage(language) === DEFAULT_LANGUAGE
  );
}

// ----------------------------------------------------------
// 14. EXPORT CENTRALISÉ DE LA CONFIGURATION
// ----------------------------------------------------------

export const I18N_CONFIG = {
  defaultLanguage: DEFAULT_LANGUAGE,
  supportedLanguages: SUPPORTED_LANGUAGES,
  languages: LANGUAGE_CONFIG,
  languageOptions: LANGUAGE_OPTIONS,
  storageKey: LANGUAGE_STORAGE_KEY,
  cookieName: LANGUAGE_COOKIE_NAME,
  cookieMaxAge: LANGUAGE_COOKIE_MAX_AGE,
} as const;
