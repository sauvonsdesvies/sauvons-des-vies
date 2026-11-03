
"use client";

import Image from "@/components/public/PublicImage";
import CardRail from "./CardRail";
import { useLocalizedPublicContent } from "@/hooks/useLocalizedPublicContent";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Newspaper, CalendarDays } from "lucide-react";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { formatPublicDate } from "@/lib/public/formatters";

import type {
  HomeNewsItem,
  PublicLanguage,
} from "@/lib/public/home-types";

// ==========================================================
// FONDATION SAUVONS DES VIES
// ACTUALITÉS — PAGE D'ACCUEIL
// ==========================================================

type HomeNewsProps = {
  localized?: boolean;
  carousel?: boolean;
  limit?: number;
  news?: HomeNewsItem[];
  className?: string;
};

function NewsLayout({ children, carousel, count, label }: { children: ReactNode; carousel: boolean; count: number; label: string }) {
  return carousel ? <CardRail count={count} label={label} compact>{children}</CardRail> : <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

const TEXT = {
  fr: {
    title: "Journaux / Actualités",
    viewAll: "Voir tous les articles",
    read: "Lire l'article",
    empty: "Aucune actualité publiée pour le moment.",
    image: "Illustration de l'actualité",
  },
  en: {
    title: "News / Updates",
    viewAll: "View all articles",
    read: "Read article",
    empty: "No news has been published yet.",
    image: "News illustration",
  },
  es: {
    title: "Noticias / Actualidad",
    viewAll: "Ver todos los artículos",
    read: "Leer artículo",
    empty: "Todavía no hay noticias publicadas.",
    image: "Imagen de la noticia",
  },
  de: {
    title: "Nachrichten / Aktuelles",
    viewAll: "Alle Artikel ansehen",
    read: "Artikel lesen",
    empty: "Derzeit sind keine Nachrichten veröffentlicht.",
    image: "Nachrichtenbild",
  },
} as const;

function NewsCard({
  item,
  language,
  readLabel,
  imageLabel,
}: {
  item: HomeNewsItem;
  language: PublicLanguage;
  readLabel: string;
  imageLabel: string;
}) {
  return (
    <Link
      href={`/actualites/${encodeURIComponent(item.slug)}`}
      aria-label={`${readLabel} : ${item.title}`}
      className="group flex min-w-0 overflow-hidden rounded-xl border border-[#E3EDF5] bg-white shadow-[0_3px_12px_rgba(9,43,80,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B7E7EE] hover:shadow-[0_8px_22px_rgba(9,43,80,0.10)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0BC2D4]"
    >
      <div className="relative min-h-[140px] w-[100px] shrink-0 overflow-hidden bg-[#EAF6FA] sm:w-[130px]">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            unoptimized={item.imageUrl.startsWith("https://")}
            alt={item.title || imageLabel}
            fill
            sizes="(max-width: 640px) 100px, 130px"
            className="object-contain transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full min-h-[112px] items-center justify-center">
            <Newspaper
              size={30}
              strokeWidth={1.5}
              className="text-[#08AFC3]"
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-3">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#73879B]">
          <CalendarDays
            size={12}
            aria-hidden="true"
            className="shrink-0"
          />
          <time dateTime={item.publishedAt}>
            {formatPublicDate(item.publishedAt, language)}
          </time>
        </div>

        <h3 className="line-clamp-2 text-sm font-extrabold leading-[1.4] text-[#092B50] transition-colors group-hover:text-[#008BA6] sm:text-base">
          {item.title}
        </h3>

        {item.excerpt && (
          <p className="mt-1 line-clamp-2 text-sm leading-[1.6] text-[#61768B]">
            {item.excerpt}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function HomeNews({
  localized = false,
  carousel = false,
  limit = 3,
  news: initialNews = [],
  className = "",
}: HomeNewsProps) {
  const { language } = useTranslation();
  const labels = TEXT[language];
  const news = useLocalizedPublicContent(initialNews, "/api/public/news", "news", !localized);

  return (
    <section
      aria-labelledby="home-news-heading"
      className={`min-w-0 ${className}`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Newspaper
            size={20}
            fill="#E71E3D"
            color="#E71E3D"
            strokeWidth={2}
            aria-hidden="true"
            className="shrink-0"
          />
          <h2
            id="home-news-heading"
            className="text-[17px] font-extrabold leading-tight text-[#092B50] sm:text-[19px]"
          >
            {labels.title}
          </h2>
        </div>

        <Link
          href="/actualites"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-[#007D9D] transition-colors hover:text-[#E71E3D] sm:text-sm"
        >
          <span className="hidden min-[390px]:inline">
            {labels.viewAll}
          </span>
          <span className="min-[390px]:hidden">
            {language === "fr" ? "Voir tout" : "View all"}
          </span>
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>

      {news.length > 0 ? (
        <NewsLayout carousel={carousel} count={Math.min(news.length, limit)} label={labels.title}>
          {news.slice(0, limit).map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              language={language}
              readLabel={labels.read}
              imageLabel={labels.image}
            />
          ))}
        </NewsLayout>
      ) : (
        <div className="flex min-h-[120px] items-center gap-3 rounded-xl border border-dashed border-[#CFE1EC] bg-[#F8FBFD] px-5 py-5">
          <Newspaper
            size={26}
            className="shrink-0 text-[#8BB4C2]"
            aria-hidden="true"
          />
          <p className="text-sm text-[#627B91]">
            {labels.empty}
          </p>
        </div>
      )}
    </section>
  );
}
