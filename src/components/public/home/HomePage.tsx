
"use client";

import { useHomeUpdates } from "@/hooks/useHomeUpdates";
import HomeHero from "./HomeHero";
import HomeStats from "./HomeStats";
import UrgentCampaigns from "./UrgentCampaigns";
import HowItWorks from "./HowItWorks";
import HomeNews from "./HomeNews";
import HomeDonationBanner from "./HomeDonationBanner";
import HomeCauses from "./HomeCauses";
import styles from "./HomePage.module.css";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

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
  const { language } = useTranslation();
  const updates = useHomeUpdates({ initialData, initialStatistics: initialData.statistics });
  const data = updates.homeData ?? initialData;
  return (
    <div className={`${styles.page} w-full min-w-0 overflow-x-clip bg-[#F5F9FD]`}>
      <HomeHero />
      <div className="home-reference relative mx-auto w-full max-w-none space-y-5 px-3 pb-5 sm:px-6 lg:px-8">
        <div className="relative z-10 -mt-5"><HomeStats controlledStatistics={updates.statistics ?? data.statistics} /></div>
        <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0">
            {data.urgentCampaigns.length > 0 && <UrgentCampaigns campaigns={data.urgentCampaigns} limit={3} />}
          </div>
          <div className="hidden xl:block"><HowItWorks /></div>
        </div>
        <div className="grid min-w-0 items-start gap-5 xl:grid-cols-2">
          <HomeCauses causes={data.causes} limit={5} />
          <HomeNews news={data.news} localized carousel limit={3} />
        </div>
        <div className="xl:hidden"><HowItWorks /></div>
        <HomeDonationBanner />
      </div>
      <div className={styles.mobileDonate}><Link href="/campagnes"><Heart size={21} fill="currentColor" aria-hidden="true" />{{ fr: "Faire un don", en: "Donate", de: "Spenden", es: "Donar" }[language]}</Link></div>
    </div>
  );
}
