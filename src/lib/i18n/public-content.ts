import "server-only";
import { createHash } from "node:crypto";
import { normalizeLanguage } from "./config";

// Call only with already-filtered public DTOs, never with Prisma rows or admin data.
const fields = new Set(["title", "shortDescription", "description", "excerpt", "content"]);
const cache = new Map<string, { text: string; expires: number }>();
let queue: Promise<unknown> = Promise.resolve();
let retryAfter = 0;
const keyFor = (text: string, language: string) => createHash("sha256").update(language + "\0" + text).digest("hex");

export async function localizePublicContent<T>(data: T, requestedLanguage: string | null): Promise<T> {
  const language = normalizeLanguage(requestedLanguage);
  const apiKey = process.env.DEEPL_API_KEY;
  if (language === "fr" || !apiKey) return data;
  const strings = new Set<string>();
  function visit(value: unknown, transform: (text: string) => string): unknown {
    if (Array.isArray(value)) return value.map(item => visit(item, transform));
    if (!value || typeof value !== "object" || value instanceof Date) return value;
    const record = value as Record<string, unknown>;
    return Object.fromEntries(Object.entries(record).map(([field, child]) => {
      const publicCategoryName = field === "name" && typeof record.slug === "string";
      if (typeof child === "string" && child.trim() && (fields.has(field) || publicCategoryName)) return [field, transform(child)];
      return [field, visit(child, transform)];
    }));
  }
  visit(data, text => { strings.add(text); return text; });

  async function translateMissing() {
    if (Date.now() < retryAfter) return;
    const missing = [...strings].filter(text => (cache.get(keyFor(text, language))?.expires ?? 0) <= Date.now());
    try {
      while (missing.length) {
        const batch: string[] = [];
        let bytes = 0;
        while (missing.length && batch.length < 50) {
          const size = Buffer.byteLength(JSON.stringify(missing[0]), "utf8");
          if (size > 100_000) { missing.shift(); continue; }
          if (batch.length && bytes + size > 100_000) break;
          bytes += size;
          batch.push(missing.shift()!);
        }
        if (!batch.length) continue;
        const endpoint = apiKey!.endsWith(":fx") ? "https://api-free.deepl.com/v2/translate" : "https://api.deepl.com/v2/translate";
        const response = await fetch(endpoint, {
          method: "POST", cache: "no-store", signal: AbortSignal.timeout(8000),
          headers: { Authorization: `DeepL-Auth-Key ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ text: batch, target_lang: language === "en" ? "EN-GB" : language.toUpperCase(), preserve_formatting: true }),
        });
        if (!response.ok) throw new Error("TRANSLATION_UNAVAILABLE");
        const result: unknown = await response.json();
        const translations = (result as { translations?: { text?: unknown }[] })?.translations;
        if (!Array.isArray(translations) || translations.length !== batch.length || translations.some(item => typeof item.text !== "string")) throw new Error("TRANSLATION_INVALID");
        translations.forEach((item, index) => {
          if (cache.size >= 3000) cache.delete(cache.keys().next().value!);
          cache.set(keyFor(batch[index], language), { text: item.text as string, expires: Date.now() + 86_400_000 });
        });
      }
    } catch {
      retryAfter = Date.now() + 60_000;
      console.warn("[PUBLIC_TRANSLATION] Traduction indisponible ; conservation du contenu original.");
    }
  }
  // Concurrent page/API requests reuse translations instead of multiplying paid calls.
  queue = queue.then(translateMissing, translateMissing);
  await queue;
  return visit(data, text => cache.get(keyFor(text, language))?.text ?? text) as T;
}
