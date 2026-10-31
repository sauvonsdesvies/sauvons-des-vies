
import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";

import {
  ArrowRight,
  Heart,
  HandHeart,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { getHomeCauses } from "@/lib/public/home-data";
import HomeCauses from "@/components/public/home/HomeCauses";

// ==========================================================
// FONDATION SAUVONS DES VIES
// PAGE PUBLIQUE — NOS CAUSES
// ==========================================================
//
// Route : /causes
//
// Next.js 16 / App Router / TypeScript
//
// - Responsive PC / tablette / mobile
// - Causes réelles provenant de getHomeCauses()
// - Composant HomeCauses existant conservé
// - Header et Footer du layout public
// - Aucune donnée fictive
// - Aucun changement dans l'administration
//
// ==========================================================

export const metadata: Metadata = {
  title: "Nos causes | Fondation Sauvons des Vies",

  description:
    "Découvrez les causes soutenues par la Fondation Sauvons des Vies et notre engagement en faveur des personnes en difficulté.",

  openGraph: {
    title: "Nos causes | Fondation Sauvons des Vies",
    description:
      "Découvrez les domaines d'action et les engagements solidaires de la Fondation Sauvons des Vies.",
    type: "website",
    siteName: "Fondation Sauvons des Vies",
  },

  robots: {
    index: true,
    follow: true,
  },
};

// ==========================================================
// EN-TÊTE DE PAGE
// ==========================================================

function CausesHeader() {
  return (
    <section className="relative overflow-hidden rounded-[22px] bg-[#092B50] px-5 py-6 text-white sm:px-6 sm:py-6 lg:px-6 lg:py-6">
      {/* Décoration discrète */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border-[45px] border-[#0BC2D4]/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 right-28 h-64 w-64 rounded-full bg-[#0BC2D4]/5 blur-2xl"
      />

      <div className="relative z-10 max-w-3xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#81E4EA]">
          <HandHeart size={17} />
          Notre engagement humanitaire
        </div>

        <h1 className="text-[28px] font-black leading-[1.12] tracking-[-0.04em] sm:text-[34px] lg:text-[40px]">
          Nos causes,{" "}
          <span className="text-[#6EE3E8]">
            notre engagement.
          </span>
        </h1>

        <p className="mt-3 max-w-2xl text-[14px] leading-[1.7] text-[#D3E2F0] sm:text-[16px]">
          Chaque cause représente une occasion d&apos;agir,
          d&apos;apporter du soutien et de redonner de
          l&apos;espoir aux personnes qui en ont le plus
          besoin. Découvrez les domaines dans lesquels
          notre fondation souhaite faire la différence.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/campagnes"
            className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg bg-[#E71E3D] px-5 text-[13px] font-extrabold text-white transition hover:bg-[#CC1935]"
          >
            <Heart size={18} fill="currentColor" />
            Découvrir les campagnes
            <ArrowRight size={17} />
          </Link>

          <Link
            href="/actualites"
            className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 px-5 text-[13px] font-extrabold text-white transition hover:bg-white/20"
          >
            Voir nos actualités
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ==========================================================
// PRINCIPES DE LA FONDATION
// ==========================================================

function CausesValues() {
  const values = [
    {
      title: "Solidarité",
      description:
        "Accompagner les personnes qui traversent des situations difficiles.",
      Icon: HandHeart,
    },
    {
      title: "Engagement",
      description:
        "Mobiliser les efforts autour de besoins humains concrets.",
      Icon: UsersRound,
    },
    {
      title: "Transparence",
      description:
        "Promouvoir une gestion responsable et un suivi des actions.",
      Icon: ShieldCheck,
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {values.map(({ title, description, Icon }) => (
        <div
          key={title}
          className="flex items-start gap-3 rounded-xl border border-[#E2EBF3] bg-white p-4 shadow-[0_3px_15px_rgba(9,43,80,0.035)] sm:p-4"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8F7FC] text-[#087FA8]">
            <Icon size={23} strokeWidth={2} />
          </div>

          <div className="min-w-0">
            <h3 className="text-[14px] font-black text-[#092B50]">
              {title}
            </h3>

            <p className="mt-1 text-[12px] leading-6 text-[#6D839B]">
              {description}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}

// ==========================================================
// LISTE DES CAUSES
// ==========================================================

async function CausesContent() {
  const causes = await getHomeCauses();

  return (
    <section
      id="liste-des-causes"
      aria-labelledby="causes-list-title"
      className="mt-6"
    >
      <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#008BA3]">
            Domaines d&apos;intervention
          </p>

          <h2
            id="causes-list-title"
            className="text-[25px] font-black tracking-[-0.035em] text-[#092B50] sm:text-[31px]"
          >
            Découvrez nos causes
          </h2>

          <p className="mt-2 text-[13px] leading-6 text-[#667E98] sm:text-[14px]">
            Retrouvez les différents domaines dans
            lesquels la Fondation Sauvons des Vies
            concentre son engagement.
          </p>
        </div>

        <Link
          href="/campagnes"
          className="inline-flex w-fit items-center gap-2 text-[12px] font-extrabold text-[#087CF3] hover:underline"
        >
          Voir les campagnes
          <ArrowRight size={17} />
        </Link>
      </div>

      {/* Le composant existant continue de gérer
          les images, titres et liens des causes. */}

      <div className="min-w-0 [&_img]:object-cover">
        <HomeCauses
          causes={causes}
          limit={100}
        />
      </div>
    </section>
  );
}

// ==========================================================
// CHARGEMENT
// ==========================================================

function CausesLoading() {
  return (
    <div
      role="status"
      aria-label="Chargement des causes"
      className="mt-6 animate-pulse"
    >
      <div className="mb-3 h-4 w-44 rounded bg-[#DDEAF3]" />
      <div className="mb-4 h-9 w-72 rounded-lg bg-[#DDEAF3]" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="overflow-hidden rounded-2xl bg-white"
          >
            <div className="aspect-[16/10] bg-[#DFEAF3]" />
            <div className="m-3 h-5 rounded bg-[#DFEAF3]" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================================
// BANDEAU FINAL
// ==========================================================

function CausesDonationBanner() {
  return (
    <section className="mt-6 flex flex-col justify-between gap-4 rounded-[20px] border border-[#D9EAF4] bg-[#E9F6FC] px-5 py-5 sm:px-6 md:flex-row md:items-center">
      <div className="max-w-2xl">
        <h2 className="text-[21px] font-black text-[#092B50] sm:text-[25px]">
          Ensemble, nous pouvons agir.
        </h2>

        <p className="mt-2 text-[13px] leading-6 text-[#587895]">
          Votre solidarité peut contribuer à soutenir
          des personnes confrontées à des situations
          difficiles.
        </p>
      </div>

      <Link
        href="/faire-un-don"
        className="inline-flex min-h-[46px] shrink-0 items-center justify-center gap-2 rounded-lg bg-[#E71E3D] px-6 text-[13px] font-black text-white transition hover:bg-[#CC1935]"
      >
        <Heart size={18} fill="currentColor" />
        Faire un don
        <ArrowRight size={17} />
      </Link>
    </section>
  );
}

// ==========================================================
// PAGE PRINCIPALE
// ==========================================================

export default function Page() {
  return (
    <main className="w-full min-w-0 bg-[#F4F9FD]">
      <div className="h-[4px] w-full bg-gradient-to-r from-[#092B50] via-[#0BC2D4] to-[#087CF3]" />

      <div className="w-full min-w-0 max-w-none px-4 py-4 sm:px-6 lg:px-8">
        <CausesHeader />

        <div className="mt-4">
          <CausesValues />
        </div>

        <Suspense fallback={<CausesLoading />}>
          <CausesContent />
        </Suspense>

        <CausesDonationBanner />
      </div>
    </main>
  );
}
