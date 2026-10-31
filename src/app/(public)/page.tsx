
import type { Metadata } from "next";
import { Suspense } from "react";

import HomePage from "@/components/public/home/HomePage";
import { getPublicHomeData } from "@/lib/public/home-data";

// ==========================================================
// FONDATION SAUVONS DES VIES
// PAGE D'ACCUEIL PUBLIQUE
// ==========================================================
//
// - Compatible Next.js 16.4.3
// - Compatible Cache Components
// - Chargement dynamique avec Suspense
// - Statistiques officielles
// - Aucune donnée fictive
// - Aucun changement du layout public
//
// ==========================================================

export const metadata: Metadata = {
  title: "Accueil | Fondation Sauvons des Vies",
  description:
    "Ensemble, sauvons des vies. Soutenez des campagnes solidaires, accompagnez des personnes en difficulté et découvrez les actions de la Fondation Sauvons des Vies.",
  robots: {
    index: true,
    follow: true,
  },
};

// ----------------------------------------------------------
// CHARGEMENT DYNAMIQUE DES DONNÉES
// ----------------------------------------------------------

async function HomeContent() {
  const homeData = await getPublicHomeData();

  return <HomePage initialData={homeData} />;
}

// ----------------------------------------------------------
// AFFICHAGE PENDANT LE CHARGEMENT
// ----------------------------------------------------------

function HomeLoading() {
  return (
    <main
      className="min-h-screen bg-white"
      aria-busy="true"
      aria-label="Chargement de la page d'accueil"
    >
      <div className="mx-auto max-w-none px-4 py-10 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-10">
          <div className="h-64 rounded-2xl bg-slate-100 sm:h-80" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="h-28 rounded-xl bg-slate-100"
              />
            ))}
          </div>

          <div className="space-y-4">
            <div className="h-8 w-64 rounded bg-slate-100" />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div
                  key={index}
                  className="h-72 rounded-xl bg-slate-100"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ----------------------------------------------------------
// PAGE PRINCIPALE
// ----------------------------------------------------------

export default function Page() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContent />
    </Suspense>
  );
}
