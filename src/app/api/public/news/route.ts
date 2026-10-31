import { NextResponse, connection } from "next/server";
import { getHomeNews, getPublicNewsBySlug } from "@/lib/public/home-data";
import { localizePublicContent } from "@/lib/i18n/public-content";

export async function GET(request: Request) {
  await connection();
  const params = new URL(request.url).searchParams;
  const slug = params.get("slug");
  if (slug && !/^[a-zA-Z0-9_-]{1,220}$/.test(slug)) return NextResponse.json({ success: false }, { status: 400 });
  const data = slug ? await getPublicNewsBySlug(slug) : await getHomeNews();
  if (!data) return NextResponse.json({ success: false }, { status: 404 });
  const localized = await localizePublicContent(data, params.get("lang"));
  return NextResponse.json({ success: true, ...(slug ? { article: localized } : { news: localized }) }, { headers: { "Cache-Control": "private, no-store" } });
}
