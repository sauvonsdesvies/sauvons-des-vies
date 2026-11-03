/** Public Supabase files use our domain so browsers need not reach Supabase. */
export function publicImageSource(src: string): string {
  try {
    const url = new URL(src);
    if (url.protocol === "https:" && url.hostname.endsWith(".supabase.co") && url.pathname.startsWith("/storage/v1/object/public/")) {
      return `/api/public/image?url=${encodeURIComponent(src)}`;
    }
  } catch { /* Local assets stay unchanged. */ }
  return src;
}
