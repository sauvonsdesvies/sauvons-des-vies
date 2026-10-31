
"use client";

import { useHomeUpdates } from "@/hooks/useHomeUpdates";
import HomeHero from "./HomeHero";
import HomeStats from "./HomeStats";
import UrgentCampaigns from "./UrgentCampaigns";
import HowItWorks from "./HowItWorks";
import HomeNews from "./HomeNews";
import HomeTrust from "./HomeTrust";
import HomeDonationBanner from "./HomeDonationBanner";

import type { HomeData } from "@/lib/public/home-types";

// ==========================================================
// FONDATION SAUVONS DES VIES
// ASSEMBLAGE COMPLET — PAGE D'ACCUEIL PUBLIQUE
// ==========================================================
//
// Header et Footer : gérés par (public)/layout.tsx
// Données : getPublicHomeData()
// Statistiques : actualisées par HomeStats
// Responsive : mobile / tablette / ordinateur
//
// ==========================================================

type HomePageProps = {
  initialData: HomeData;
};

export default function HomePage({
  initialData,
}: HomePageProps) {
  const updates = useHomeUpdates({ initialData, initialStatistics: initialData.statistics });
  const data = updates.homeData ?? initialData;
  return (
    <div className="w-full min-w-0 overflow-x-clip bg-[#F5F9FD]">
      <HomeHero />
      <div className="relative mx-auto w-full max-w-none space-y-4 px-4 pb-5 sm:px-6 lg:px-8">
        <div className="relative z-10 -mt-4"><HomeStats controlledStatistics={updates.statistics ?? data.statistics} /></div>
        <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-4">
            <UrgentCampaigns campaigns={data.urgentCampaigns} limit={6} />
          </div>
          <HowItWorks />
        </div>
        <div className="min-w-0 space-y-4">
          <UrgentCampaigns campaigns={data.campaigns} urgentOnly={false} limit={6} />
          <HomeNews news={data.news} localized carousel limit={6} />
        </div>
        <div className="grid min-w-0 items-stretch gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <HomeTrust />
          <HomeDonationBanner />
        </div>
      </div>
    </div>
  );
}
