
import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";

import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  HandHeart,
  Heart,
  Hospital,
  Newspaper,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getHomeCauses } from "@/lib/public/home-data";
import HomeCauses from "@/components/public/home/HomeCauses";

// ============================================================
// FONDATION SAUVONS DES VIES
// PAGE PUBLIQUE — TRANSPARENCE
// ============================================================
//
// Route : /transparence
//
// Compatible avec :
// - Next.js 16 / App Router
// - React Server Components
// - TypeScript
// - Prisma / Supabase PostgreSQL
//
// Sources :
// - Causes : getHomeCauses()
// - Actualités : Publication (Prisma)
//
// Aucun nouveau fichier nécessaire.
// Aucun chiffre financier fictif.
// Aucun Header ou Footer dupliqué.
//
// ============================================================

export const metadata: Metadata = {
  title: "Transparence | Fondation Sauvons des Vies",
  description:
    "Découvrez les engagements, les causes soutenues, les actualités et les actions documentées de la Fondation Sauvons des Vies.",
  openGraph: {
    title: "Transparence | Fondation Sauvons des Vies",
    description:
      "Découvrez nos engagements, nos causes et les publications de la Fondation Sauvons des Vies.",
    type: "website",
    siteName: "Fondation Sauvons des Vies",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const PUBLICATION_LIMIT = 6;

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

function formatDate(date: Date | null): string {
  if (!date) return "";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function safeImageUrl(
  value: string | null | undefined
): string | null {
  if (!value) return null;

  const url = value.trim();

  if (url.startsWith("/") && !url.startsWith("//")) {
    return url;
  }

  if (/^https:\/\//i.test(url)) {
    return url;
  }

  return null;
}

function publicationUrl(slug: string): string {
  return `/actualites/${encodeURIComponent(slug)}`;
}

// ============================================================
// TITRE DE SECTION
// ============================================================

function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkText,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="max-w-3xl">
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#008FA7]">
          {eyebrow}
        </p>

        <h2 className="text-[25px] font-black leading-tight tracking-[-0.035em] text-[#092B50] sm:text-[31px]">
          {title}
        </h2>

        {description && (
          <p className="mt-3 text-[13px] leading-6 text-[#637D98] sm:text-[14px]">
            {description}
          </p>
        )}
      </div>

      {href && linkText && (
        <Link
          href={href}
          className="inline-flex w-fit shrink-0 items-center gap-2 text-[12px] font-extrabold text-[#087CF3] transition hover:gap-3"
        >
          {linkText}
          <ArrowRight size={17} />
        </Link>
      )}
    </div>
  );
}

// ============================================================
// HERO — TRANSPARENCE
// ============================================================

function TransparencyHero() {
  return (
    <section className="relative overflow-hidden rounded-[22px] bg-[#092B50] px-5 py-6 text-white sm:px-6 sm:py-6 lg:px-6 lg:py-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full border-[48px] border-[#0BC2D4]/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-48 w-64 rounded-full bg-[#0BC2D4]/10 blur-3xl"
      />

      <div className="relative z-10 grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#7CE3E9]">
            <ShieldCheck size={17} />
            Notre engagement de transparence
          </div>

          <h1 className="text-[28px] font-black leading-[1.12] tracking-[-0.04em] sm:text-[34px] lg:text-[36px]">
            La confiance se construit{" "}
            <span className="text-[#67E0E8]">
              par des actions visibles.
            </span>
          </h1>

          <p className="mt-3 max-w-2xl text-[14px] leading-[1.7] text-[#D3E2F0] sm:text-[16px]">
            Découvrez les causes que nous soutenons,
            les actualités publiées et notre méthode
            d&apos;accompagnement des personnes en
            difficulté. Nous souhaitons rendre notre
            engagement humanitaire clair et accessible.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="#publications"
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg bg-[#E71E3D] px-5 text-[13px] font-extrabold text-white transition hover:bg-[#CC1935]"
            >
              <Newspaper size={18} />
              Voir nos publications
              <ArrowRight size={17} />
            </Link>

            <Link
              href="#causes"
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 px-5 text-[13px] font-extrabold text-white transition hover:bg-white/20"
            >
              Découvrir nos causes
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="rounded-[20px] border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0BC2D4]/20">
              <ShieldCheck
                size={32}
                className="text-[#6CE2EA]"
              />
            </div>

            <h2 className="text-[20px] font-black">
              Notre engagement
            </h2>

            <p className="mt-3 text-[13px] leading-6 text-[#D3E2F0]">
              Vérifier les demandes, accompagner les
              bénéficiaires et documenter les actions
              réalisées, tout en respectant la
              confidentialité des personnes aidées.
            </p>

            <div className="mt-3 border-t border-white/15 pt-4 text-[12px] font-bold text-[#7CE3E9]">
              Solidarité • Responsabilité • Transparence
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// NOS ENGAGEMENTS
// ============================================================

function TransparencyCommitments() {
  const commitments = [
    {
      title: "Vérification",
      description:
        "Examiner les demandes d'aide et les justificatifs avant toute prise en charge.",
      Icon: ClipboardCheck,
    },
    {
      title: "Responsabilité",
      description:
        "Organiser les actions humanitaires autour de besoins identifiés.",
      Icon: ShieldCheck,
    },
    {
      title: "Accompagnement",
      description:
        "Soutenir les personnes confrontées à des situations difficiles.",
      Icon: HandHeart,
    },
    {
      title: "Information",
      description:
        "Partager les actualités et les actions pouvant être rendues publiques.",
      Icon: FileCheck2,
    },
  ];

  return (
    <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {commitments.map(
        ({ title, description, Icon }) => (
          <div
            key={title}
            className="flex gap-3 rounded-2xl border border-[#E1EAF3] bg-white p-4 shadow-[0_4px_18px_rgba(9,43,80,0.035)]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E9F7FC] text-[#087FA8]">
              <Icon size={22} strokeWidth={2} />
            </div>

            <div className="min-w-0">
              <h3 className="text-[14px] font-black text-[#092B50]">
                {title}
              </h3>

              <p className="mt-2 text-[12px] leading-6 text-[#687F99]">
                {description}
              </p>
            </div>
          </div>
        )
      )}
    </section>
  );
}

// ============================================================
// NOS CAUSES — DONNÉES EXISTANTES
// ============================================================

async function TransparencyCauses() {
  const causes = await getHomeCauses();

  return (
    <section
      id="causes"
      className="mt-6 scroll-mt-24"
    >
      <SectionHeading
        eyebrow="Nos domaines d'intervention"
        title="Les causes que nous soutenons"
        description="Découvrez les domaines d'action présentés par la Fondation Sauvons des Vies."
        href="/causes"
        linkText="Toutes nos causes"
      />

      <div className="min-w-0 [&_img]:object-cover">
        <HomeCauses
          causes={causes}
          limit={6}
        />
      </div>
    </section>
  );
}

// ============================================================
// ACTUALITÉS — PUBLICATIONS RÉELLES
// ============================================================

async function TransparencyPublications() {
  await connection();

  const publications =
    await prisma.publication.findMany({
      where: {
        status: "PUBLISHED",
        archivedAt: null,
        publishedAt: {
          not: null,
        },
      },

      orderBy: [
        { publicationDate: "desc" },
        { publishedAt: "desc" },
        { createdAt: "desc" },
      ],

      take: PUBLICATION_LIMIT,

      select: {
        id: true,
        slug: true,
        title: true,
        shortDescription: true,
        category: true,
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
    <section
      id="publications"
      className="mt-6 scroll-mt-24"
    >
      <SectionHeading
        eyebrow="Nos activités"
        title="Journaux, actualités et actions publiées"
        description="Retrouvez les informations, les témoignages et les comptes rendus rendus publics par la fondation."
        href="/actualites"
        linkText="Toutes les actualités"
      />

      {publications.length === 0 ? (
        <div className="rounded-2xl border border-[#E1EAF3] bg-white px-6 py-6 text-center">
          <Newspaper
            size={34}
            className="mx-auto text-[#8AB6D1]"
          />

          <h3 className="mt-4 text-[18px] font-black text-[#092B50]">
            Aucune publication disponible
          </h3>

          <p className="mt-2 text-[13px] leading-6 text-[#6C839B]">
            Les actualités apparaîtront ici après
            leur publication.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {publications.map((item) => {
            const image =
              safeImageUrl(item.imageUrl) ??
              safeImageUrl(
                item.photos[0]?.imageUrl
              );

            const date =
              item.publicationDate ??
              item.publishedAt ??
              item.createdAt;

            return (
              <article
                key={item.id}
                className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#E1EAF3] bg-white shadow-[0_4px_18px_rgba(9,43,80,0.045)] transition hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(9,43,80,0.10)]"
              >
                <Link
                  href={publicationUrl(
                    item.slug
                  )}
                  aria-label={`Lire ${item.title}`}
                  className="relative block aspect-[16/10] overflow-hidden bg-[#E7F3F9]"
                >
                  {image ? (
                    <Image
                      src={image}
                      alt={item.title}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Newspaper
                        size={46}
                        className="text-[#9ABCD0]"
                      />
                    </div>
                  )}
                </Link>

                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-[#E8F7FB] px-3 py-1 text-[10px] font-extrabold text-[#087A96]">
                      {item.category}
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-[11px] text-[#8094A9]">
                      <CalendarDays size={13} />
                      {formatDate(date)}
                    </span>
                  </div>

                  <Link
                    href={publicationUrl(
                      item.slug
                    )}
                  >
                    <h3 className="line-clamp-2 text-[18px] font-black leading-[1.4] text-[#092B50] transition group-hover:text-[#087CF3]">
                      {item.title}
                    </h3>
                  </Link>

                  <p className="mt-3 line-clamp-3 text-[13px] leading-6 text-[#687F99]">
                    {item.shortDescription}
                  </p>

                  <Link
                    href={publicationUrl(
                      item.slug
                    )}
                    className="mt-auto inline-flex items-center gap-2 border-t border-[#EAF0F6] pt-4 text-[12px] font-extrabold text-[#087CF3]"
                  >
                    Lire la publication
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ============================================================
// NOTRE MÉTHODE
// ============================================================

function TransparencyProcess() {
  const steps = [
    {
      number: "01",
      title: "Réception de la demande",
      description:
        "La fondation reçoit les informations relatives à une demande d'aide.",
      Icon: UsersRound,
    },
    {
      number: "02",
      title: "Vérification du dossier",
      description:
        "Les informations et justificatifs sont examinés avant toute décision.",
      Icon: ClipboardCheck,
    },
    {
      number: "03",
      title: "Mobilisation solidaire",
      description:
        "Une campagne peut être mise en ligne pour mobiliser les donateurs.",
      Icon: HandHeart,
    },
    {
      number: "04",
      title: "Prise en charge",
      description:
        "Selon le dossier, le règlement est organisé directement avec l'établissement concerné.",
      Icon: Hospital,
    },
    {
      number: "05",
      title: "Publication du suivi",
      description:
        "Les informations publiables sur les actions sont partagées avec le public.",
      Icon: BookOpen,
    },
  ];

  return (
    <section className="mt-6">
      <SectionHeading
        eyebrow="Notre fonctionnement"
        title="Comment nous organisons les actions"
        description="Une démarche structurée pour examiner les besoins, mobiliser les soutiens et documenter les actions."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map(
          ({
            number,
            title,
            description,
            Icon,
          }) => (
            <div
              key={number}
              className="relative rounded-2xl border border-[#E0EAF3] bg-white p-4 shadow-sm"
            >
              <span className="absolute right-4 top-4 text-[25px] font-black text-[#E4EFF8]">
                {number}
              </span>

              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#E7F7FB] text-[#087FA8]">
                <Icon size={22} />
              </div>

              <h3 className="text-[14px] font-black leading-6 text-[#092B50]">
                {title}
              </h3>

              <p className="mt-2 text-[12px] leading-6 text-[#6D829A]">
                {description}
              </p>
            </div>
          )
        )}
      </div>
    </section>
  );
}

// ============================================================
// CONFIDENTIALITÉ
// ============================================================

function PrivacyCommitment() {
  return (
    <section className="mt-6 rounded-2xl border border-[#D9EAF4] bg-[#EAF6FC] px-5 py-4 sm:px-6 sm:py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#087FA8]">
          <ShieldCheck size={26} />
        </div>

        <div>
          <h2 className="text-[19px] font-black text-[#092B50]">
            Transparence et respect de la vie privée
          </h2>

          <p className="mt-2 max-w-4xl text-[13px] leading-6 text-[#587792]">
            Notre démarche de transparence doit également
            protéger la dignité des bénéficiaires. Les
            informations médicales personnelles et les
            documents sensibles ne doivent pas être rendus
            publics sans base légale appropriée.
          </p>

          <div className="mt-4 flex flex-wrap gap-4 text-[12px] font-bold text-[#087A96]">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 size={16} />
              Respect des bénéficiaires
            </span>

            <span className="inline-flex items-center gap-2">
              <CheckCircle2 size={16} />
              Informations vérifiées
            </span>

            <span className="inline-flex items-center gap-2">
              <CheckCircle2 size={16} />
              Communication responsable
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// BANDEAU FINAL
// ============================================================

function TransparencyDonationBanner() {
  return (
    <section className="mt-6 overflow-hidden rounded-[22px] bg-[#092B50] px-6 py-6 text-white sm:px-6 sm:py-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="max-w-2xl">
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#67DCE7]">
            Ensemble, sauvons des vies
          </p>

          <h2 className="text-[24px] font-black leading-tight sm:text-[29px]">
            La solidarité prend tout son sens lorsqu&apos;elle
            devient une action.
          </h2>

          <p className="mt-3 text-[13px] leading-6 text-[#C5D6E7]">
            Découvrez les campagnes en cours et les
            personnes qui ont besoin de soutien.
          </p>
        </div>

        <Link
          href="/campagnes"
          className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-lg bg-[#E71E3D] px-6 text-[13px] font-black text-white transition hover:bg-[#CB1935]"
        >
          <Heart
            size={18}
            fill="currentColor"
          />
          Voir les campagnes
          <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  );
}

// ============================================================
// CHARGEMENT
// ============================================================

function SectionLoading({
  label,
}: {
  label: string;
}) {
  return (
    <div
      role="status"
      aria-label={label}
      className="mt-6 animate-pulse"
    >
      <div className="mb-3 h-4 w-40 rounded bg-[#DDEAF3]" />
      <div className="mb-4 h-9 max-w-md rounded-lg bg-[#DDEAF3]" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-[260px] rounded-2xl bg-[#E2EDF5]"
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================

export default function TransparencyPage() {
  return (
    <main className="w-full min-w-0 bg-[#F4F9FD]">
      <div className="h-1 w-full bg-gradient-to-r from-[#092B50] via-[#0BC2D4] to-[#087CF3]" />

      <div className="w-full min-w-0 max-w-none px-4 py-4 sm:px-6 lg:px-8">
        <TransparencyHero />

        <TransparencyCommitments />

        <Suspense
          fallback={
            <SectionLoading label="Chargement des causes" />
          }
        >
          <TransparencyCauses />
        </Suspense>

        <Suspense
          fallback={
            <SectionLoading label="Chargement des actualités" />
          }
        >
          <TransparencyPublications />
        </Suspense>

        <TransparencyProcess />

        <PrivacyCommitment />

        <TransparencyDonationBanner />
      </div>
    </main>
  );
}
