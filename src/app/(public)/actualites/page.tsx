
import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";

import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Heart,
  Newspaper,
  Search,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

// ============================================================
// FONDATION SAUVONS DES VIES
// PAGE PUBLIQUE : JOURNAUX / ACTUALITÉS
// ============================================================
//
// Next.js 16 — App Router — Prisma — Supabase
//
// Affichage :
// PC       : 3 cartes par ligne
// Tablette : 2 cartes par ligne
// Mobile   : 1 carte par ligne
//
// Fonctionnalités :
// - Publications réelles
// - Recherche
// - Catégories
// - Pagination
// - Images
// - Dates
// - Résumés
// - Temps de lecture
// - Liens vers les articles
//
// Aucun fichier supplémentaire.
// Header et Footer gérés par le layout public.
//
// ============================================================

// ------------------------------------------------------------
// SEO
// ------------------------------------------------------------

export const metadata: Metadata = {
  title: "Journaux et Actualités | Fondation Sauvons des Vies",

  description:
    "Découvrez les actualités, les actions réalisées, les témoignages et les publications de la Fondation Sauvons des Vies.",

  openGraph: {
    title: "Journaux et Actualités",
    description:
      "Suivez les actions et les actualités de la Fondation Sauvons des Vies.",
    type: "website",
    siteName: "Fondation Sauvons des Vies",
  },

  robots: {
    index: true,
    follow: true,
  },
};

// ------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------

const PAGE_SIZE = 12;

type PageProps = {
  searchParams: Promise<{
    page?: string | string[];
    q?: string | string[];
    categorie?: string | string[];
  }>;
};

type QueryState = {
  page: number;
  search: string;
  category: string;
};

type PublicationItem = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  category: string;
  authorName: string;
  imageUrl: string | null;
  publicationDate: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  photos: {
    imageUrl: string;
  }[];
};

// ------------------------------------------------------------
// OUTILS
// ------------------------------------------------------------

function firstValue(
  value: string | string[] | undefined
): string {
  return Array.isArray(value)
    ? value[0] ?? ""
    : value ?? "";
}

function parseQuery(
  params: Awaited<PageProps["searchParams"]>
): QueryState {
  const requestedPage = Number(
    firstValue(params.page)
  );

  return {
    page:
      Number.isSafeInteger(requestedPage) &&
      requestedPage > 0
        ? Math.min(requestedPage, 100000)
        : 1,

    search: firstValue(params.q)
      .trim()
      .slice(0, 100),

    category: firstValue(params.categorie)
      .trim()
      .slice(0, 100),
  };
}

function formatDate(
  date: Date | null
): string {
  if (!date) return "";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function readingTime(
  content: string
): number {
  const words = content
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(
    1,
    Math.ceil(words / 200)
  );
}

function safeImageUrl(
  value: string | null | undefined
): string | null {
  if (!value) return null;

  const url = value.trim();

  if (
    url.startsWith("/") &&
    !url.startsWith("//")
  ) {
    return url;
  }

  if (/^https:\/\//i.test(url)) {
    return url;
  }

  return null;
}

function getImage(
  publication: PublicationItem
): string | null {
  return (
    safeImageUrl(publication.imageUrl) ??
    safeImageUrl(
      publication.photos[0]?.imageUrl
    )
  );
}

function articleUrl(
  slug: string
): string {
  return `/actualites/${encodeURIComponent(slug)}`;
}

function buildUrl(
  state: QueryState,
  changes: Partial<QueryState> = {}
): string {
  const next = {
    ...state,
    ...changes,
  };

  const params = new URLSearchParams();

  if (next.search) {
    params.set("q", next.search);
  }

  if (next.category) {
    params.set(
      "categorie",
      next.category
    );
  }

  if (next.page > 1) {
    params.set(
      "page",
      String(next.page)
    );
  }

  const query = params.toString();

  return query
    ? `/actualites?${query}`
    : "/actualites";
}

// ------------------------------------------------------------
// STYLE DES CATÉGORIES
// ------------------------------------------------------------

function categoryStyle(
  category: string
): string {
  const value = category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (value.includes("action")) {
    return "bg-[#E6F8EF] text-[#078653]";
  }

  if (value.includes("campagne")) {
    return "bg-[#E9F2FF] text-[#0871D5]";
  }

  if (value.includes("temoignage")) {
    return "bg-[#FFF1E7] text-[#B76520]";
  }

  if (value.includes("rapport")) {
    return "bg-[#F0ECFF] text-[#7150B5]";
  }

  return "bg-[#E8F7FB] text-[#087A96]";
}

// ------------------------------------------------------------
// IMAGE
// ------------------------------------------------------------

function PublicationImage({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#E7F5FA] to-[#DDECF7]">
        <Heart
          size={46}
          strokeWidth={1.4}
          className="text-[#91B9D0]"
        />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
    />
  );
}

// ------------------------------------------------------------
// CARTE D'ACTUALITÉ
// ------------------------------------------------------------

function PublicationCard({
  publication,
}: {
  publication: PublicationItem;
}) {
  const image = getImage(publication);

  const date =
    publication.publicationDate ??
    publication.publishedAt ??
    publication.createdAt;

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#E1EAF3] bg-white shadow-[0_4px_18px_rgba(9,43,80,0.045)] transition-all duration-300 hover:-translate-y-1 hover:border-[#B6DDEB] hover:shadow-[0_14px_30px_rgba(9,43,80,0.10)]">
      {/* IMAGE */}

      <Link
        href={articleUrl(
          publication.slug
        )}
        aria-label={`Lire ${publication.title}`}
        className="relative block aspect-[16/10] w-full overflow-hidden bg-[#EAF5FA]"
      >
        <PublicationImage
          src={image}
          alt={publication.title}
        />
      </Link>

      {/* INFORMATIONS */}

      <div className="flex flex-1 flex-col p-4">
        {/* CATÉGORIE ET DATE */}

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span
            className={`inline-flex max-w-full items-center rounded-full px-3 py-1 text-xs font-extrabold ${categoryStyle(
              publication.category
            )}`}
          >
            <span className="truncate">
              {publication.category}
            </span>
          </span>

          <span className="inline-flex items-center gap-1.5 text-xs text-[#8293A8]">
            <CalendarDays size={13} />
            {formatDate(date)}
          </span>
        </div>

        {/* TITRE */}

        <Link
          href={articleUrl(
            publication.slug
          )}
        >
          <h2 className="line-clamp-2  text-[18px] font-black leading-[1.4] tracking-[-0.02em] text-[#092B50] transition-colors group-hover:text-[#087CF3]">
            {publication.title}
          </h2>
        </Link>

        {/* DESCRIPTION */}

        <p className="mt-3 line-clamp-3  text-sm leading-[1.8] text-[#667E99]">
          {publication.shortDescription}
        </p>

        {/* BAS DE CARTE */}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#EAF0F6] pt-4">
          <span className="inline-flex items-center gap-1.5 text-xs text-[#8295AA]">
            <Clock3 size={14} />

            {readingTime(
              publication.content
            )}{" "}
            min de lecture
          </span>

          <Link
            href={articleUrl(
              publication.slug
            )}
            className="inline-flex items-center gap-1 text-sm font-extrabold text-[#087CF3] transition hover:gap-2"
          >
            Lire la suite
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}

// ------------------------------------------------------------
// RECHERCHE ET CATÉGORIES
// ------------------------------------------------------------

function PublicationFilters({
  categories,
  state,
}: {
  categories: {
    name: string;
    count: number;
  }[];
  state: QueryState;
}) {
  return (
    <div className="mb-4 space-y-4">
      {/* RECHERCHE */}

      <form
        action="/actualites"
        method="get"
        className="flex flex-col gap-3 rounded-xl border border-[#E2EBF4] bg-white p-3 sm:flex-row"
      >
        <div className="flex min-h-[45px] flex-1 items-center gap-3 rounded-lg bg-[#F4F8FC] px-4">
          <Search
            size={19}
            className="shrink-0 text-[#8094AA]"
          />

          <input
            type="search"
            name="q"
            defaultValue={state.search}
            placeholder="Rechercher une actualité..."
            aria-label="Rechercher une actualité"
            maxLength={100}
            className="w-full min-w-0 bg-transparent text-sm text-[#092B50] outline-none placeholder:text-[#93A3B5]"
          />
        </div>

        {state.category && (
          <input
            type="hidden"
            name="categorie"
            value={state.category}
          />
        )}

        <button
          type="submit"
          className="inline-flex min-h-[45px] items-center justify-center gap-2 rounded-lg bg-[#087CF3] px-6 text-sm font-bold text-white transition hover:bg-[#0766C9]"
        >
          <Search size={17} />
          Rechercher
        </button>
      </form>

      {/* CATÉGORIES */}

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={buildUrl(state, {
            category: "",
            page: 1,
          })}
          className={`inline-flex min-h-[36px] items-center rounded-full border px-4 text-xs font-bold transition ${
            !state.category
              ? "border-[#092B50] bg-[#092B50] text-white"
              : "border-[#DFE8F1] bg-white text-[#526D8B] hover:border-[#0BC2D4]"
          }`}
        >
          Toutes les actualités
        </Link>

        {categories.map(
          (category) => {
            const active =
              state.category ===
              category.name;

            return (
              <Link
                key={category.name}
                href={buildUrl(state, {
                  category:
                    category.name,
                  page: 1,
                })}
                className={`inline-flex min-h-[36px] items-center gap-2 rounded-full border px-4 text-xs font-bold transition ${
                  active
                    ? "border-[#092B50] bg-[#092B50] text-white"
                    : "border-[#DFE8F1] bg-white text-[#526D8B] hover:border-[#0BC2D4]"
                }`}
              >
                {category.name}

                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-[#EDF4FA] text-[#68829C]"
                  }`}
                >
                  {category.count}
                </span>
              </Link>
            );
          }
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// PAGINATION
// ------------------------------------------------------------

function Pagination({
  state,
  totalPages,
}: {
  state: QueryState;
  totalPages: number;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const currentPage = Math.min(
    state.page,
    totalPages
  );

  const start = Math.max(
    1,
    Math.min(
      currentPage - 2,
      Math.max(1, totalPages - 4)
    )
  );

  const end = Math.min(
    totalPages,
    start + 4
  );

  const pages = Array.from(
    {
      length: end - start + 1,
    },
    (_, index) => start + index
  );

  return (
    <nav
      aria-label="Pagination des actualités"
      className="mt-6 flex flex-wrap items-center justify-center gap-2"
    >
      {currentPage > 1 && (
        <Link
          href={buildUrl(state, {
            page: currentPage - 1,
          })}
          aria-label="Page précédente"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#DDE8F2] bg-white text-[#092B50] hover:border-[#087CF3]"
        >
          <ChevronLeft size={19} />
        </Link>
      )}

      {pages.map((page) => (
        <Link
          key={page}
          href={buildUrl(state, {
            page,
          })}
          aria-current={
            page === currentPage
              ? "page"
              : undefined
          }
          className={`flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-extrabold ${
            page === currentPage
              ? "border-[#087CF3] bg-[#087CF3] text-white"
              : "border-[#DDE8F2] bg-white text-[#526D8B] hover:border-[#087CF3]"
          }`}
        >
          {page}
        </Link>
      ))}

      {currentPage < totalPages && (
        <Link
          href={buildUrl(state, {
            page: currentPage + 1,
          })}
          aria-label="Page suivante"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#DDE8F2] bg-white text-[#092B50] hover:border-[#087CF3]"
        >
          <ChevronRight size={19} />
        </Link>
      )}
    </nav>
  );
}

// ------------------------------------------------------------
// ÉTAT VIDE
// ------------------------------------------------------------

function EmptyState({
  filtered,
}: {
  filtered: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#E2EBF4] bg-white px-5 py-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF7FC]">
        <Newspaper
          size={32}
          className="text-[#087FA8]"
        />
      </div>

      <h2 className="mt-3 text-[21px] font-black text-[#092B50]">
        {filtered
          ? "Aucune actualité trouvée"
          : "Aucune publication pour le moment"}
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#70859C]">
        {filtered
          ? "Aucune publication ne correspond à votre recherche."
          : "Les actualités de la fondation apparaîtront ici après leur publication."}
      </p>

      {filtered && (
        <Link
          href="/actualites"
          className="mt-4 inline-flex min-h-[43px] items-center justify-center rounded-lg bg-[#092B50] px-5 text-sm font-bold text-white"
        >
          Voir toutes les actualités
        </Link>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// BANDEAU DON
// ------------------------------------------------------------

function DonationBanner() {
  return (
    <section className="mt-6 rounded-2xl bg-[#092B50] px-6 py-6 text-white sm:px-6 sm:py-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="max-w-2xl">
          <p className="mb-2 text-sm font-extrabold uppercase tracking-[0.15em] text-[#63D8E7]">
            Ensemble, sauvons des vies
          </p>

          <h2 className="text-[24px] font-black leading-tight sm:text-[30px]">
            Chaque geste de solidarité compte.
          </h2>

          <p className="mt-3 text-sm leading-6 text-[#C3D5E8]">
            Soutenez les actions de la Fondation Sauvons
            des Vies et contribuez à aider les personnes
            qui en ont besoin.
          </p>
        </div>

        <Link
          href="/faire-un-don"
          className="inline-flex min-h-[49px] items-center justify-center gap-2 rounded-lg bg-[#E71E3D] px-6 text-sm font-black text-white transition hover:bg-[#CB1734]"
        >
          <Heart
            size={19}
            fill="currentColor"
          />

          Faire un don

          <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  );
}

// ============================================================
// DONNÉES PRISMA
// ============================================================

async function NewsContent({
  searchParams,
}: {
  searchParams: PageProps["searchParams"];
}) {
  // Lecture dynamique dans un composant
  // protégé par Suspense.

  await connection();

  const state = parseQuery(
    await searchParams
  );

  // Seulement les publications publiques.

  const publicWhere = {
    status: "PUBLISHED",
    archivedAt: null,
    publishedAt: {
      not: null,
    },
  } as const;

  // Catégories réelles.

  const categoryRows =
    await prisma.publication.groupBy({
      by: ["category"],

      where: publicWhere,

      _count: {
        _all: true,
      },
    });

  const categories = categoryRows
    .map((row) => ({
      name: row.category,
      count: row._count._all,
    }))
    .filter(
      (item) =>
        item.name.trim().length > 0
    )
    .sort(
      (a, b) =>
        b.count - a.count ||
        a.name.localeCompare(
          b.name,
          "fr"
        )
    );

  // Conditions de recherche.

  const where = {
    ...publicWhere,

    ...(state.category
      ? {
          category: state.category,
        }
      : {}),

    ...(state.search
      ? {
          OR: [
            {
              title: {
                contains: state.search,
                mode: "insensitive" as const,
              },
            },
            {
              shortDescription: {
                contains: state.search,
                mode: "insensitive" as const,
              },
            },
            {
              content: {
                contains: state.search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  // Nombre de résultats.

  const total =
    await prisma.publication.count({
      where,
    });

  const totalPages = Math.max(
    1,
    Math.ceil(total / PAGE_SIZE)
  );

  const currentPage = Math.min(
    state.page,
    totalPages
  );

  const effectiveState: QueryState = {
    ...state,
    page: currentPage,
  };

  // Publications de la page.

  const publications =
    await prisma.publication.findMany({
      where,

      orderBy: [
        {
          publicationDate: "desc",
        },
        {
          publishedAt: "desc",
        },
        {
          createdAt: "desc",
        },
      ],

      skip:
        (currentPage - 1) *
        PAGE_SIZE,

      take: PAGE_SIZE,

      select: {
        id: true,
        title: true,
        slug: true,
        shortDescription: true,
        content: true,
        category: true,
        authorName: true,
        imageUrl: true,
        publicationDate: true,
        publishedAt: true,
        createdAt: true,

        photos: {
          orderBy: {
            position: "asc",
          },

          take: 1,

          select: {
            imageUrl: true,
          },
        },
      },
    });

  return (
    <>
      {/* EN-TÊTE */}

      <div className="mb-4">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D6ECF5] bg-[#EAF8FC] px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-[#087A96]">
          <Newspaper size={15} />
          Nos publications
        </div>

        <h1 className="text-[28px] font-black leading-[1.12] tracking-[-0.045em] text-[#092B50] sm:text-[34px] lg:text-[36px]">
          Journaux{" "}
          <span className="text-[#087CF3]">
            &
          </span>{" "}
          Actualités
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-6 text-[#607C98] sm:text-base">
          Découvrez les actions réalisées, les nouvelles
          de nos campagnes et les initiatives solidaires
          de la Fondation Sauvons des Vies.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-[#53708F] shadow-sm">
            <FileText
              size={16}
              className="text-[#087CF3]"
            />

            {total} publication
            {total > 1 ? "s" : ""}
          </span>

          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-[#53708F] shadow-sm">
            <Heart
              size={16}
              className="text-[#E71E3D]"
            />

            Solidarité et transparence
          </span>
        </div>
      </div>

      {/* BARRE DE RECHERCHE */}

      <PublicationFilters
        categories={categories}
        state={effectiveState}
      />

      {/* TITRE DE LISTE */}

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-sm font-extrabold uppercase tracking-[0.15em] text-[#087A96]">
            Restez informés
          </p>

          <h2 className="text-[23px] font-black tracking-tight text-[#092B50] sm:text-[28px]">
            {state.search ||
            state.category
              ? "Résultats de recherche"
              : "Toutes nos actualités"}
          </h2>
        </div>

        <p className="text-sm font-semibold text-[#7890A9]">
          {total} résultat
          {total > 1 ? "s" : ""}
        </p>
      </div>

      {/* GRILLE DES PUBLICATIONS */}

      {publications.length > 0 ? (
        <>
          <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:gap-4">
            {publications.map(
              (publication) => (
                <PublicationCard
                  key={publication.id}
                  publication={publication}
                />
              )
            )}
          </div>

          <Pagination
            state={effectiveState}
            totalPages={totalPages}
          />
        </>
      ) : (
        <EmptyState
          filtered={Boolean(
            state.search ||
            state.category
          )}
        />
      )}

      <DonationBanner />
    </>
  );
}

// ============================================================
// CHARGEMENT
// ============================================================

function NewsLoading() {
  return (
    <div
      role="status"
      aria-label="Chargement des actualités"
      className="animate-pulse"
    >
      <div className="mb-4 h-5 w-36 rounded-full bg-[#E0EDF5]" />

      <div className="mb-4 h-12 max-w-lg rounded-xl bg-[#DFEAF3]" />

      <div className="mb-6 h-5 max-w-xl rounded bg-[#E4EEF5]" />

      <div className="mb-4 h-16 rounded-xl bg-[#E3EDF5]" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map(
          (item) => (
            <div
              key={item}
              className="h-[340px] rounded-2xl bg-[#E3EDF5]"
            />
          )
        )}
      </div>
    </div>
  );
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================

export default function ActualitesPage({
  searchParams,
}: PageProps) {
  return (
    <main className="w-full min-w-0 bg-[#F4F9FD]">
      <div className="h-[4px] w-full bg-gradient-to-r from-[#092B50] via-[#0BC2D4] to-[#087CF3]" />

      <div className="w-full min-w-0 max-w-none px-4 py-4 sm:px-6 lg:px-8">
        <Suspense fallback={<NewsLoading />}>
          <NewsContent
            searchParams={searchParams}
          />
        </Suspense>
      </div>
    </main>
  );
}
