"use client";

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { DEFAULT_LANGUAGE, LANGUAGE_COOKIE_MAX_AGE, LANGUAGE_COOKIE_NAME, LANGUAGE_STORAGE_KEY, getLanguageConfig, isSupportedLanguage, normalizeLanguage, type Language, type LanguageConfig } from "./config";
import { getTranslations, translate, translateWithValues } from "./translations";

export type TranslationValues = Record<string, string | number>;
export interface LanguageContextValue {
  language: Language;
  locale: Language;
  setLanguage: (language: Language) => void;
  changeLanguage: (language: Language) => void;
  languageConfig: LanguageConfig;
  translations: ReturnType<typeof getTranslations>;
  t: (key: string, values?: TranslationValues) => string;
  isDefaultLanguage: boolean;
  isReady: boolean;
}
export interface LanguageProviderProps { children: ReactNode; initialLanguage?: Language }
const LANGUAGE_CHANGE_EVENT = "sdv:public-language-change";

function readPreference(fallback: Language): Language {
  try {
    const entry = document.cookie.split(";").map(value => value.trim()).find(value => value.startsWith(`${LANGUAGE_COOKIE_NAME}=`));
    const cookie = entry ? decodeURIComponent(entry.slice(LANGUAGE_COOKIE_NAME.length + 1)) : null;
    if (isSupportedLanguage(cookie)) return cookie;
  } catch { /* Cookie access may be blocked. */ }
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isSupportedLanguage(stored)) return stored;
  } catch { /* Storage access may be blocked. */ }
  return fallback;
}

function persistLanguage(language: Language) {
  try { window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language); } catch { /* Optional storage. */ }
  try {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${LANGUAGE_COOKIE_NAME}=${encodeURIComponent(language)}; Path=/; Max-Age=${LANGUAGE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
  } catch { /* Manual language switching still works without cookies. */ }
}

function createLanguageStore(initialLanguage: Language) {
  // Each provider owns its store: no preference can leak across server requests.
  const initialSnapshot = { language: initialLanguage, isReady: false };
  let snapshot = initialSnapshot;
  const listeners = new Set<() => void>();
  const update = (language: Language) => {
    if (snapshot.language === language && snapshot.isReady) return;
    snapshot = { language, isReady: true };
    listeners.forEach(listener => listener());
  };
  return {
    initialLanguage,
    getSnapshot: () => snapshot,
    // This remains immutable even when a parent mounted before a streamed child.
    getServerSnapshot: () => initialSnapshot,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    restore: update,
    setLanguage: (language: Language) => {
      if (!isSupportedLanguage(language)) return;
      persistLanguage(language);
      update(language);
      window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: language }));
    },
  };
}

const LanguageContext = createContext<ReturnType<typeof createLanguageStore> | null>(null);

export default function LanguageProvider({ children, initialLanguage = DEFAULT_LANGUAGE }: LanguageProviderProps) {
  const [store] = useState(() => createLanguageStore(normalizeLanguage(initialLanguage)));
  useEffect(() => {
    function restore(event?: Event) {
      let next = readPreference(store.initialLanguage);
      if (event?.type === LANGUAGE_CHANGE_EVENT) {
        const detail: unknown = (event as CustomEvent<unknown>).detail;
        if (!isSupportedLanguage(detail)) return;
        next = detail;
      } else if (event?.type === "storage") {
        const change = event as StorageEvent;
        if (change.key !== LANGUAGE_STORAGE_KEY && change.key !== null) return;
        next = isSupportedLanguage(change.newValue) ? change.newValue : store.initialLanguage;
      }
      store.restore(next);
    }
    const unsubscribe = store.subscribe(() => { document.documentElement.lang = store.getSnapshot().language; });
    const timer = window.setTimeout(restore, 0);
    window.addEventListener(LANGUAGE_CHANGE_EVENT, restore);
    window.addEventListener("storage", restore);
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
      window.removeEventListener(LANGUAGE_CHANGE_EVENT, restore);
      window.removeEventListener("storage", restore);
    };
  }, [store]);
  return <LanguageContext.Provider value={store}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const store = useContext(LanguageContext);
  if (!store) throw new Error("useLanguage doit être utilisé à l’intérieur de LanguageProvider.");
  // Subscribe in each consumer, not in the provider above Suspense: a delayed
  // header must hydrate with its own server snapshot before reading preferences.
  const { language, isReady } = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return useMemo(() => ({
    language, locale: language, isReady,
    setLanguage: store.setLanguage, changeLanguage: store.setLanguage,
    languageConfig: getLanguageConfig(language), translations: getTranslations(language),
    isDefaultLanguage: language === DEFAULT_LANGUAGE,
    t: (key: string, values?: TranslationValues) => values ? translateWithValues(language, key, values) : translate(language, key),
  }), [store, language, isReady]);
}
export function useTranslation() {
  const { language, locale, t, translations, isReady } = useLanguage();
  return { language, locale, t, translations, isReady };
}
export function useChangeLanguage() {
  const { language, setLanguage, changeLanguage } = useLanguage();
  return { language, setLanguage, changeLanguage };
}
export { LanguageContext };
export type { Language };
