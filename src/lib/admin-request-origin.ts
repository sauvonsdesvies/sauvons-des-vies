import type { NextRequest } from "next/server";

/** Bind browser requests to the public HTTPS host, including reverse proxies. */
export function isAdminRequestOriginAllowed(request: NextRequest): boolean {
  const raw = request.headers.get("origin");
  if (!raw || request.headers.get("sec-fetch-site") === "cross-site") return false;
  try {
    const origin = new URL(raw);
    if (origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) return false;
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname);
    if (origin.protocol !== "https:" && !(origin.protocol === "http:" && local && process.env.NODE_ENV !== "production")) return false;
    if (origin.origin === request.nextUrl.origin || request.headers.get("host") === origin.host) return true;
    for (const value of [process.env.ADMIN_ALLOWED_ORIGIN, process.env.NEXT_PUBLIC_SITE_URL]) {
      if (!value?.trim()) continue;
      try { if (new URL(value.trim()).origin === origin.origin) return true; } catch { /* Ignore an invalid optional origin. */ }
    }
    return request.headers.get("sec-fetch-site") === "same-origin" &&
      request.headers.get("x-forwarded-host") === origin.host &&
      request.headers.get("x-forwarded-proto") === origin.protocol.slice(0, -1);
  } catch { return false; }
}
