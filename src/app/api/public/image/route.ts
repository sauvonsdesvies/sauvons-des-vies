import { NextRequest } from "next/server";

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
    const upstream = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(20000) });
    if (!upstream.ok) return new Response(null, { status: upstream.status === 404 ? 404 : 502 });
    const type = upstream.headers.get("content-type")?.split(";")[0].trim();
    if (!type || !["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"].includes(type)) {
      return new Response(null, { status: 415 });
    }
    return new Response(upstream.body, { headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch {
    return new Response(null, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
