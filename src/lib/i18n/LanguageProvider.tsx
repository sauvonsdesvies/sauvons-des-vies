
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_MAX_AGE,
  LANGUAGE_COOKIE_NAME,
  LANGUAGE_STORAGE_KEY,
  getLanguageConfig,
  isSupportedLanguage,
  normalizeLanguage,
  type Language,
  type LanguageConfig,
} from "./config";

import {
  getTranslations,
  translate,
  translateWithValues,
} from "./translations";

// ==========================================================
// FONDATION SAUVONS DES VIES
// GESTIONNAIRE MULTILINGUE — ESPACE PUBLIC
// ==========================================================
//
// Langues : Français, Anglais, Espagnol, Allemand
//
// Fonctionnalités conservées :
// - Gestion centralisée de la langue
// - Conservation du choix du visiteur
// - Synchronisation des sélecteurs
// - Synchronisation entre plusieurs onglets
// - Traductions accessibles aux composants
// - Compatibilité Next.js / TypeScript
// - Aucun impact sur Prisma ou l'administration
//
// ==========================================================

// ----------------------------------------------------------
// 1. TYPES
// ----------------------------------------------------------

export type TranslationValues = Record<
  string,
  string | number
>;

export interface LanguageContextValue {
  language: Language;

  locale: Language;

  setLanguage: (language: Language) => void;

  changeLanguage: (language: Language) => void;

  languageConfig: LanguageConfig;

  translations: ReturnType<typeof getTranslations>;

  t: (
    key: string,
    values?: TranslationValues
  ) => string;

  isDefaultLanguage: boolean;

  isReady: boolean;
}

export interface LanguageProviderProps {
  children: ReactNode;

  initialLanguage?: Language;
}

// ----------------------------------------------------------
// 2. CONTEXTE
// ----------------------------------------------------------

const LanguageContext =
  createContext<LanguageContextValue | null>(null);

// ----------------------------------------------------------
// 3. LECTURE SÉCURISÉE DU STOCKAGE LOCAL
// ----------------------------------------------------------

function readStoredLanguage(): Language | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(
      LANGUAGE_STORAGE_KEY
    );

    if (stored && isSupportedLanguage(stored)) {
      return stored;
    }
  } catch {
    // Le navigateur peut bloquer localStorage.
  }

  return null;
}

// ----------------------------------------------------------
// 4. LECTURE SÉCURISÉE DU COOKIE
// ----------------------------------------------------------

function readCookieLanguage(): Language | null {
  if (typeof document === "undefined") {
    return null;
  }

  try {
    const cookiePrefix =
      `${LANGUAGE_COOKIE_NAME}=`;

    const cookie = document.cookie
      .split(";")
      .map((item) => item.trim())
      .find((item) =>
        item.startsWith(cookiePrefix)
      );

    if (!cookie) {
      return null;
    }

    const rawValue = cookie.slice(
      cookiePrefix.length
    );

    const decoded = decodeURIComponent(rawValue);

    if (isSupportedLanguage(decoded)) {
      return decoded;
    }
  } catch {
    // Cookie inaccessible ou mal formé.
  }

  return null;
}

// ----------------------------------------------------------
// 5. ENREGISTREMENT DU CHOIX DE LANGUE
// ----------------------------------------------------------

function persistLanguage(language: Language): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      LANGUAGE_STORAGE_KEY,
      language
    );
  } catch {
    // Le site reste utilisable sans localStorage.
  }

  try {
    const secure =
      window.location.protocol === "https:"
        ? "; Secure"
        : "";

    document.cookie = [
      `${LANGUAGE_COOKIE_NAME}=${encodeURIComponent(language)}`,
      "Path=/",
      `Max-Age=${LANGUAGE_COOKIE_MAX_AGE}`,
      "SameSite=Lax",
    ].join("; ") + secure;
  } catch {
    // Le site reste utilisable sans cookies.
  }
}

// ----------------------------------------------------------
// 6. RÉSOLUTION DE LA LANGUE INITIALE
// ----------------------------------------------------------

function resolveInitialLanguage(
  fallback: Language
): Language {
  const cookieLanguage = readCookieLanguage();

  if (cookieLanguage) {
    return cookieLanguage;
  }

  const storedLanguage = readStoredLanguage();

  if (storedLanguage) {
    return storedLanguage;
  }

  return fallback;
}

// ----------------------------------------------------------
// 7. ÉVÉNEMENTS DE SYNCHRONISATION
// ----------------------------------------------------------

const LANGUAGE_CHANGE_EVENT =
  "sdv:public-language-change";

function notifyLanguageChange(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event(LANGUAGE_CHANGE_EVENT)
  );
}

function subscribeToLanguage(
  callback: () => void
): () => void {
  window.addEventListener(
    LANGUAGE_CHANGE_EVENT,
    callback
  );

  window.addEventListener(
    "storage",
    callback
  );

  return () => {
    window.removeEventListener(
      LANGUAGE_CHANGE_EVENT,
      callback
    );

    window.removeEventListener(
      "storage",
      callback
    );
  };
}

// ----------------------------------------------------------
// 8. PROVIDER PRINCIPAL
// ----------------------------------------------------------

export default function LanguageProvider({
  children,
  initialLanguage = DEFAULT_LANGUAGE,
}: LanguageProviderProps) {
  const fallbackLanguage =
    normalizeLanguage(initialLanguage);

  // useSyncExternalStore permet de lire la préférence
  // enregistrée sans appeler setState dans un useEffect.
  //
  // Pendant le rendu serveur et l'hydratation initiale,
  // le snapshot reste stable pour éviter les erreurs
  // d'hydratation de Next.js.

  const getSnapshot = useCallback(
    () => resolveInitialLanguage(fallbackLanguage),
    [fallbackLanguage]
  );

  const getServerSnapshot = useCallback(
    () => fallbackLanguage,
    [fallbackLanguage]
  );

  const storedLanguage = useSyncExternalStore(
    subscribeToLanguage,
    getSnapshot,
    getServerSnapshot
  );

  // Un choix effectué via le sélecteur est conservé
  // dans le stockage, puis diffusé aux composants.

  const [selectedLanguage, setSelectedLanguage] =
    useState<Language | null>(null);

  const language =
    selectedLanguage ?? storedLanguage;

  // Indique que le stockage côté navigateur
  // est disponible et que la langue peut être
  // considérée comme restaurée.

  const isReady = true;

  useEffect(() => { document.documentElement.lang = language; }, [language]);

  // --------------------------------------------------------
  // 9. MODIFICATION DE LA LANGUE
  // --------------------------------------------------------

  const setLanguage = useCallback(
    (nextLanguage: Language) => {
      if (!isSupportedLanguage(nextLanguage)) {
        return;
      }

      persistLanguage(nextLanguage);

      setSelectedLanguage(nextLanguage);

      notifyLanguageChange();
    },
    []
  );

  const changeLanguage = setLanguage;

  // --------------------------------------------------------
  // 10. SYNCHRONISATION ENTRE PLUSIEURS ONGLETS
  // --------------------------------------------------------

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (
        event.key !== LANGUAGE_STORAGE_KEY
      ) {
        return;
      }

      if (
        event.newValue &&
        isSupportedLanguage(event.newValue)
      ) {
        setSelectedLanguage(event.newValue);
      } else {
        setSelectedLanguage(null);
      }
    }

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  // --------------------------------------------------------
  // 11. TRADUCTIONS DE LA LANGUE ACTIVE
  // --------------------------------------------------------

  const dictionary = useMemo(
    () => getTranslations(language),
    [language]
  );

  // --------------------------------------------------------
  // 12. FONCTION DE TRADUCTION
  // --------------------------------------------------------

  const t = useCallback(
    (
      key: string,
      values?: TranslationValues
    ): string => {
      if (values) {
        return translateWithValues(
          language,
          key,
          values
        );
      }

      return translate(language, key);
    },
    [language]
  );

  // --------------------------------------------------------
  // 13. CONFIGURATION DE LA LANGUE ACTIVE
  // --------------------------------------------------------

  const languageConfig = useMemo(
    () => getLanguageConfig(language),
    [language]
  );

  // --------------------------------------------------------
  // 14. VALEUR DU CONTEXTE
  // --------------------------------------------------------

  const contextValue = useMemo<
    LanguageContextValue
  >(
    () => ({
      language,

      locale: language,

      setLanguage,

      changeLanguage,

      languageConfig,

      translations: dictionary,

      t,

      isDefaultLanguage:
        language === DEFAULT_LANGUAGE,

      isReady,
    }),
    [
      language,
      setLanguage,
      changeLanguage,
      languageConfig,
      dictionary,
      t,
      isReady,
    ]
  );

  // --------------------------------------------------------
  // 15. FOURNITURE DU CONTEXTE
  // --------------------------------------------------------

  return (
    <LanguageContext.Provider
      value={contextValue}
    >
      {children}
    </LanguageContext.Provider>
  );
}

// ----------------------------------------------------------
// 16. HOOK PRINCIPAL
// ----------------------------------------------------------

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage doit être utilisé à l'intérieur de LanguageProvider."
    );
  }

  return context;
}

// ----------------------------------------------------------
// 17. HOOK DE TRADUCTION
// ----------------------------------------------------------

export function useTranslation() {
  const {
    language,
    locale,
    t,
    translations,
    isReady,
  } = useLanguage();

  return {
    language,
    locale,
    t,
    translations,
    isReady,
  };
}

// ----------------------------------------------------------
// 18. HOOK POUR CHANGER LA LANGUE
// ----------------------------------------------------------

export function useChangeLanguage() {
  const {
    language,
    setLanguage,
    changeLanguage,
  } = useLanguage();

  return {
    language,
    setLanguage,
    changeLanguage,
  };
}

// ----------------------------------------------------------
// 19. EXPORTS
// ----------------------------------------------------------

export {
  LanguageContext,
};

export type {
  Language,
};
