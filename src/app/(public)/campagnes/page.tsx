
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import CampaignsPage from "@/components/public/campaigns/CampaignsPage";
import { getPublicCampaigns } from "@/lib/public/campaigns-data";

// ==========================================================
// FONDATION SAUVONS DES VIES
// PAGE PUBLIQUE — CAMPAGNES DE DONS
// ==========================================================
//
// Route : /campagnes
//
// Stack :
// - Next.js 16 — App Router
// - React / TypeScript
// - Prisma / PostgreSQL
// - Tailwind CSS
//
// Responsabilités :
// - Métadonnées SEO
// - Chargement dynamique des campagnes publiées
// - Affichage des données réelles
// - Suspense et interface de chargement
// - Intégration du composant CampaignsPage
//
// Le header et le footer sont gérés par le layout public.
// Aucun contenu fictif n'est créé ici.
//
// ==========================================================

// ----------------------------------------------------------
// MÉTADONNÉES SEO
// ----------------------------------------------------------

export const metadata: Metadata = {
  title: "Campagnes de dons | Fondation Sauvons des Vies",

  description:
    "Découvrez les campagnes de dons de la Fondation Sauvons des Vies. Soutenez les personnes ayant besoin de soins médicaux et participez à des actions solidaires.",

  keywords: [
    "Fondation Sauvons des Vies",
    "campagnes de dons",
    "solidarité",
    "aide médicale",
    "collecte de dons",
    "Bénin",
    "santé",
    "humanitaire",
  ],

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Fondation Sauvons des Vies",

    title:
      "Campagnes de dons | Fondation Sauvons des Vies",

    description:
      "Découvrez les collectes solidaires et soutenez les personnes qui ont besoin de soins médicaux.",

    images: [
      {
        url: "/images/home/hero.webp",
        alt: "Fondation Sauvons des Vies — Campagnes de dons",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title:
      "Campagnes de dons | Fondation Sauvons des Vies",

    description:
      "Ensemble, soutenons les personnes ayant besoin de soins médicaux.",

    images: ["/images/home/hero.webp"],
  },
};

// ----------------------------------------------------------
// CHARGEMENT DYNAMIQUE DES CAMPAGNES
// ----------------------------------------------------------

async function CampaignsContent() {
  // IMPORTANT — NEXT.JS 16
  //
  // La page utilise des données dynamiques :
  // - Campagnes publiées
  // - Dons confirmés
  // - Dates de début et de fin
  // - Statuts des collectes
  //
  // Le service campaigns-data.ts utilise notamment
  // la date actuelle pour calculer les statuts.
  //
  // connection() empêche l'exécution de cette lecture
  // pendant le prérendu statique.
  //
  // La lecture est effectuée à chaque requête.

  await connection();

  // --------------------------------------------------------
  // LECTURE DES DONNÉES RÉELLES
  // --------------------------------------------------------

  const data = await getPublicCampaigns({
    page: 1,
    pageSize: 12,
    sort: "newest",
  });

  // --------------------------------------------------------
  // INTERFACE PUBLIQUE
  // --------------------------------------------------------

  return (
    <CampaignsPage
      initialCampaigns={data.campaigns}
      initialPagination={data.pagination}
      initialCategories={data.categories}
    />
  );
}

// ----------------------------------------------------------
// INTERFACE DE CHARGEMENT
// ----------------------------------------------------------

function CampaignsLoading() {
  return (
    <main
      className="min-h-screen bg-[#F6F9FC]"
      aria-busy="true"
      aria-label="Chargement des campagnes de dons"
    >
      {/* ==================================================
          BANNIÈRE DE CHARGEMENT
      ================================================== */}

      <section className="relative flex min-h-[330px] items-center overflow-hidden bg-[#092B50] sm:min-h-[380px] lg:min-h-[420px]">
        <div className="mx-auto w-full max-w-none px-4 py-6 sm:px-6 lg:px-8">
          <div className="max-w-[640px] space-y-5">
            <div className="h-4 w-48 animate-pulse rounded bg-white/20" />

            <div className="h-12 w-full max-w-[520px] animate-pulse rounded-lg bg-white/20" />

            <div className="h-5 w-full max-w-[470px] animate-pulse rounded bg-white/15" />

            <div className="h-5 w-3/4 animate-pulse rounded bg-white/15" />

            <div className="h-12 w-48 animate-pulse rounded-xl bg-[#E71E3D]/60" />
          </div>
        </div>
      </section>

      {/* ==================================================
          CONTENU PRINCIPAL
      ================================================== */}

      <section className="mx-auto max-w-none px-4 py-6 sm:px-6 lg:px-8">
        {/* TITRE ET DESCRIPTION */}

        <div className="mb-8 space-y-4">
          <div className="h-4 w-44 animate-pulse rounded bg-slate-200" />

          <div className="h-9 w-72 max-w-full animate-pulse rounded bg-slate-200" />

          <div className="h-4 w-full max-w-[620px] animate-pulse rounded bg-slate-200" />
        </div>

        {/* ==================================================
            FILTRES DE RECHERCHE
        ================================================== */}

        <div className="mb-8 grid grid-cols-1 gap-3 rounded-[20px] border border-slate-200 bg-white p-5 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="h-12 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>

        {/* ==================================================
            GRILLE ET COLONNE LATÉRALE
        ================================================== */}

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
          {/* CAMPAGNES */}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-[22px] border border-slate-200 bg-white"
              >
                {/* IMAGE */}

                <div className="h-[220px] animate-pulse bg-slate-200" />

                {/* INFORMATIONS */}

                <div className="space-y-4 p-5">
                  <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />

                  <div className="h-6 w-full animate-pulse rounded bg-slate-200" />

                  <div className="h-4 w-full animate-pulse rounded bg-slate-100" />

                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />

                  {/* PROGRESSION */}

                  <div className="h-3 w-full animate-pulse rounded bg-slate-100" />

                  {/* BOUTONS */}

                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <div className="h-11 animate-pulse rounded-xl bg-slate-100" />

                    <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* COLONNE LATÉRALE */}

          <aside className="hidden space-y-6 xl:block">
            {/* CATÉGORIES */}

            <div className="h-72 animate-pulse rounded-[20px] bg-white" />

            {/* ENGAGEMENT */}

            <div className="h-64 animate-pulse rounded-[20px] bg-[#092B50]/20" />

            {/* ACTUALITÉS */}

            <div className="h-48 animate-pulse rounded-[20px] bg-white" />
          </aside>
        </div>
      </section>
    </main>
  );
}

// ----------------------------------------------------------
// PAGE PUBLIQUE NEXT.JS
// ----------------------------------------------------------

export default function Page() {
  return (
    <Suspense fallback={<CampaignsLoading />}>
      <CampaignsContent />
    </Suspense>
  );
}
