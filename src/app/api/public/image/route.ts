import { NextRequest } from "next/server";
import sharp from "sharp";

type CachedImage = { bytes: Uint8Array; type: string; expires: number };
const images = new Map<string, CachedImage>();
const pending = new Map<string, Promise<CachedImage>>();
const MAX_CACHE_BYTES = 10 * 1024 * 1024;
let cacheBytes = 0;

class ImageResponseError extends Error {
  constructor(readonly status: number) { super("Image unavailable"); }
}

async function loadImage(url: URL): Promise<CachedImage> {
  const key = url.href;
  const cached = images.get(key);
  if (cached && cached.expires > Date.now()) return cached;
  const ongoing = pending.get(key);
  if (ongoing) return ongoing;
  // Bound simultaneous downloads and native image processing on small hosts.
  if (pending.size >= 2) {
    await Promise.race(pending.values()).catch(() => undefined);
    return loadImage(url);
  }
  const task = (async () => {
    const upstream = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(60000) });
    if (!upstream.ok) throw new ImageResponseError(upstream.status === 404 ? 404 : 502);
    const type = upstream.headers.get("content-type")?.split(";")[0].trim();
    if (!type || !["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"].includes(type)) throw new ImageResponseError(415);
    if (Number(upstream.headers.get("content-length")) > 15 * 1024 * 1024) throw new ImageResponseError(413);
    const original = Buffer.from(await upstream.arrayBuffer());
    if (original.byteLength > 15 * 1024 * 1024) throw new ImageResponseError(413);
    // Retain animated GIFs. Other originals stay intact in Supabase.
    const bytes = type === "image/gif" ? original : await sharp(original, { limitInputPixels: 24_000_000 })
      .rotate().resize({ width: 1280, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    const result: CachedImage = { bytes: new Uint8Array(bytes), type: type === "image/gif" ? type : "image/webp", expires: Date.now() + 3600000 };
    const previous = images.get(key);
    if (previous) { cacheBytes -= previous.bytes.byteLength; images.delete(key); }
    while (images.size && (images.size >= 64 || cacheBytes + bytes.byteLength > MAX_CACHE_BYTES)) {
      const oldest = images.keys().next().value!;
      cacheBytes -= images.get(oldest)!.bytes.byteLength;
      images.delete(oldest);
    }
    if (bytes.byteLength <= MAX_CACHE_BYTES) { images.set(key, result); cacheBytes += bytes.byteLength; }
    return result;
  })();
  pending.set(key, task);
  try { return await task; }
  catch (error) {
    // Upload URLs are versioned: keep the last valid picture during an outage.
    if (cached) return cached;
    throw error;
  } finally { pending.delete(key); }
}

export async function GET(request: NextRequest) {
  const value = request.nextUrl.searchParams.get("url");
  try {
    const configured = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!configured || !value) return new Response(null, { status: 400 });
    const url = new URL(value);
    const base = new URL(configured);
    if (url.protocol !== "https:" || url.origin !== base.origin || url.username || url.password ||
        !url.pathname.startsWith("/storage/v1/object/public/") || url.hash) {
      return new Response(null, { status: 400 });
    }
    // No credentials, private storage paths or redirects are forwarded.
    const image = await loadImage(url);
    return new Response(image.bytes as Uint8Array<ArrayBuffer>, { headers: {
      "Content-Type": image.type,
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    return new Response(null, { status: error instanceof ImageResponseError ? error.status : 502, headers: { "Cache-Control": "no-store" } });
  }
}
