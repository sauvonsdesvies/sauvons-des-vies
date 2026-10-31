
"use client";

import Image from "next/image";
import { useLocalizedPublicContent } from "@/hooks/useLocalizedPublicContent";
import Link from "next/link";

import {
  Heart,
  ArrowRight,
  HandHeart,
} from "lucide-react";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import type {
  HomeCause,
  PublicLanguage,
} from "@/lib/public/home-types";

// ==========================================================
// FONDATION SAUVONS DES VIES
// NOS CAUSES — PAGE D'ACCUEIL PC ET MOBILE
// ==========================================================

type HomeCausesProps = {
  limit?: number;
  causes?: HomeCause[];
  className?: string;
};

const TEXT: Record<
  PublicLanguage,
  {
    title: string;
    viewAll: string;
    viewShort: string;
    empty: string;
    causeLabel: string;
  }
> = {
  fr: {
    title: "Nos causes",
    viewAll: "Voir toutes nos causes",
    viewShort: "Voir tout",
    empty: "Les causes seront affichées prochainement.",
    causeLabel: "Découvrir la cause",
  },
  en: {
    title: "Our causes",
    viewAll: "View all our causes",
    viewShort: "View all",
    empty: "Our causes will be available soon.",
    causeLabel: "Explore cause",
  },
  es: {
    title: "Nuestras causas",
    viewAll: "Ver todas nuestras causas",
    viewShort: "Ver todo",
    empty: "Las causas estarán disponibles próximamente.",
    causeLabel: "Descubrir causa",
  },
  de: {
    title: "Unsere Anliegen",
    viewAll: "Alle Anliegen ansehen",
    viewShort: "Alle ansehen",
    empty: "Unsere Anliegen werden bald angezeigt.",
    causeLabel: "Anliegen entdecken",
  },
};

// ----------------------------------------------------------
// CARTE D'UNE CAUSE
// ----------------------------------------------------------

function CauseCard({
  cause,
  label,
}: {
  cause: HomeCause;
  label: string;
}) {
  return (
    <Link
      href={`/campagnes?categorie=${encodeURIComponent(cause.slug)}`}
      aria-label={`${label} : ${cause.name}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#E1EAF1] bg-white shadow-[0_3px_10px_rgba(9,43,80,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B5E5ED] hover:shadow-[0_8px_20px_rgba(9,43,80,0.10)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0BC2D4]"
    >
      <div className="relative aspect-[1.6/1] w-full overflow-hidden bg-[#E9F6FA]">
        {cause.imageUrl ? (
          <Image
            src={cause.imageUrl}
            unoptimized={cause.imageUrl.startsWith("https://")}
            alt={cause.name}
            fill
            sizes="(max-width: 640px) 145px, (max-width: 1024px) 190px, 220px"
            className="object-contain transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#DFF6FA] to-[#F0F9FD]">
            <HandHeart
              size={32}
              strokeWidth={1.7}
              className="text-[#079BB5]"
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      <div className="flex min-h-[50px] flex-1 items-center justify-center px-2 py-2.5">
        <h3 className="line-clamp-2 text-center text-[11px] font-extrabold leading-[1.35] text-[#092B50] transition-colors group-hover:text-[#008BA6] sm:text-[12px]">
          {cause.name}
        </h3>
      </div>
    </Link>
  );
}

// ----------------------------------------------------------
// SECTION PRINCIPALE
// ----------------------------------------------------------

export default function HomeCauses({
  limit = 5,
  causes: initialCauses = [],
  className = "",
}: HomeCausesProps) {
  const { language } = useTranslation();
  const labels = TEXT[language];
  const causes = useLocalizedPublicContent(initialCauses, "/api/public/home", "data.causes");

  return (
    <section
      aria-labelledby="home-causes-heading"
      className={`min-w-0 ${className}`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Heart
            size={21}
            fill="#E71E3D"
            color="#E71E3D"
            strokeWidth={2}
            aria-hidden="true"
            className="shrink-0"
          />

          <h2
            id="home-causes-heading"
            className="text-[17px] font-extrabold leading-tight text-[#092B50] sm:text-[19px]"
          >
            {labels.title}
          </h2>
        </div>

        <Link
          href="/causes"
          className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-[#007D9D] transition-colors hover:text-[#E71E3D] sm:text-xs"
        >
          <span className="hidden sm:inline">
            {labels.viewAll}
          </span>
          <span className="sm:hidden">
            {labels.viewShort}
          </span>
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>

      {causes.length > 0 ? (
        <div className="-mx-1 overflow-x-auto px-1 pb-3 [scrollbar-width:thin] [scrollbar-color:#B7DDE7_transparent]">
          <div className="grid min-w-max auto-cols-[145px] grid-flow-col gap-3 sm:auto-cols-[180px] lg:min-w-0 lg:grid-flow-row lg:grid-cols-5">
            {causes.slice(0, limit).map((cause) => (
              <CauseCard
                key={cause.id}
                cause={cause}
                label={labels.causeLabel}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex min-h-[125px] items-center gap-3 rounded-xl border border-dashed border-[#CFE1EC] bg-[#F8FBFD] px-5 py-5">
          <HandHeart
            size={27}
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
