"use client";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useLocalizedPublicContent } from "@/hooks/useLocalizedPublicContent";

type Article = { title: string; shortDescription: string; content: string; imageUrl: string | null };
export default function PublicArticle({ slug, initial }: { slug: string; initial: Article }) {
  const { t } = useTranslation();
  const item = useLocalizedPublicContent(initial, `/api/public/news?slug=${encodeURIComponent(slug)}`, "article");
  return <article className="mx-auto w-full max-w-none px-4 py-5 sm:px-6">
    <Link href="/actualites" className="text-sm text-blue-700">{t("common.back")}</Link>
    <h1 className="my-4 text-2xl font-bold sm:text-3xl">{item.title}</h1>
    {item.imageUrl && (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={item.imageUrl} alt="" className="mb-4 max-h-96 w-full rounded-xl object-contain" />
    )}
    <p className="mb-4 font-semibold text-slate-700">{item.shortDescription}</p>
    <div className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{item.content}</div>
  </article>;
}
