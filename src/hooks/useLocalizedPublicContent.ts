"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function useLocalizedPublicContent<T>(initial: T, url: string, field: string, enabled = true): T {
  const { language } = useTranslation();
  const [result, setResult] = useState<{ language: string; value: T } | null>(null);
  useEffect(() => {
    if (!enabled || language === "fr") return;
    const controller = new AbortController();
    const separator = url.includes("?") ? "&" : "?";
    void fetch(`${url}${separator}lang=${language}`, { signal: controller.signal, cache: "no-store" })
      .then(response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(payload => {
        let value: unknown = payload;
        for (const part of field.split(".")) value = (value as Record<string, unknown> | null)?.[part];
        if (payload.success && value != null && !controller.signal.aborted) setResult({ language, value: value as T });
      }).catch(() => { /* Keep the last original public content on network failure. */ });
    return () => controller.abort();
  }, [language, url, field, enabled]);
  return enabled && language !== "fr" && result?.language === language ? result.value : initial;
}
