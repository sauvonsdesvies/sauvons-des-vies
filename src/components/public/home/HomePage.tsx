
"use client";

import { useHomeUpdates } from "@/hooks/useHomeUpdates";
import HomeHero from "./HomeHero";
import HomeStats from "./HomeStats";
import UrgentCampaigns from "./UrgentCampaigns";
import HowItWorks from "./HowItWorks";
import HomeNews from "./HomeNews";
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
      <div className="relative mx-auto w-full max-w-none space-y-7 px-4 pb-7 sm:px-6 lg:px-8">
        <div className="relative z-10 -mt-4"><HomeStats controlledStatistics={updates.statistics ?? data.statistics} /></div>
        <div className="grid min-w-0 items-start gap-4 ">
          <div className="min-w-0 space-y-4">
            {data.urgentCampaigns.length > 0 && <UrgentCampaigns campaigns={data.urgentCampaigns} limit={3} />}
          </div>

        </div>
        <div className="min-w-0 space-y-4">
          <UrgentCampaigns campaigns={data.campaigns.filter(campaign => !data.urgentCampaigns.some(urgent => urgent.id === campaign.id))} urgentOnly={false} limit={6} />
          <HomeNews news={data.news} localized carousel limit={6} />
        </div>
        <HowItWorks />
        <HomeDonationBanner />
      </div>
    </div>
  );
}
