import type { NextRequest } from "next/server";

/** Validate the browser origin before using it for payment return URLs. */
export function getPaymentRequestOrigin(request: NextRequest): string | null {
  const raw = request.headers.get("origin");
  if (!raw || request.headers.get("sec-fetch-site") === "cross-site") return null;
  try {
    const origin = new URL(raw);
    if (origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) return null;
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname);
    if (origin.protocol !== "https:" && !(origin.protocol === "http:" && local && process.env.NODE_ENV !== "production")) return null;
    if (origin.origin === request.nextUrl.origin) return origin.origin;
    // Reverse proxies can expose an internal HTTP URL to Next.js while keeping
    // the public host in Host. Always use the validated HTTPS browser origin.
    if (request.headers.get("host") === origin.host) return origin.origin;
    const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (configured && new URL(configured).origin === origin.origin) return origin.origin;
    // A browser cannot forge Sec-Fetch-Site. Do not trust forwarded hosts from
    // cross-site requests or use them alone as a general origin allowlist.
    if (request.headers.get("sec-fetch-site") === "same-origin" &&
        request.headers.get("x-forwarded-host") === origin.host &&
        request.headers.get("x-forwarded-proto") === origin.protocol.slice(0, -1)) return origin.origin;
  } catch { /* Invalid origins fail closed. */ }
  return null;
}
