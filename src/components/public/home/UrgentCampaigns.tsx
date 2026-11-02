
"use client";

import Link from "next/link";

import {
  HeartPulse,
  ArrowRight,
  HandHeart,
} from "lucide-react";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import CampaignCard from "./CampaignCard";
import CardRail from "./CardRail";

import type {
  HomeCampaign,
  PublicLanguage,
} from "@/lib/public/home-types";

// ==========================================================
// FONDATION SAUVONS DES VIES
// CAMPAGNES URGENTES — PAGE D'ACCUEIL
// ==========================================================

type UrgentCampaignsProps = {
  urgentOnly?: boolean;
  limit?: number;
  campaigns?: HomeCampaign[];
  className?: string;
};

const LABELS: Record<
  PublicLanguage,
  {
    title: string;
    viewAll: string;
    viewShort: string;
    empty: string;
    listLabel: string;
  }
> = {
  fr: {
    title: "Campagnes urgentes",
    viewAll: "Voir toutes les campagnes",
    viewShort: "Voir tout",
    empty: "Aucune campagne urgente publiée pour le moment.",
    listLabel: "Liste des campagnes urgentes",
  },
  en: {
    title: "Urgent campaigns",
    viewAll: "View all campaigns",
    viewShort: "View all",
    empty: "No urgent campaigns are currently published.",
    listLabel: "Urgent campaigns list",
  },
  es: {
    title: "Campañas urgentes",
    viewAll: "Ver todas las campañas",
    viewShort: "Ver todo",
    empty: "No hay campañas urgentes publicadas por el momento.",
    listLabel: "Lista de campañas urgentes",
  },
  de: {
    title: "Dringende Kampagnen",
    viewAll: "Alle Kampagnen ansehen",
    viewShort: "Alle ansehen",
    empty: "Derzeit sind keine dringenden Kampagnen veröffentlicht.",
    listLabel: "Liste dringender Kampagnen",
  },
};

export default function UrgentCampaigns({
  urgentOnly = true,
  limit = 3,
  campaigns = [],
  className = "",
}: UrgentCampaignsProps) {
  const { language } = useTranslation();
  const labels = LABELS[language];

  const visibleCampaigns = campaigns
    .filter(
      (campaign) =>
        (!urgentOnly || (campaign.status === "ACTIVE" && campaign.isUrgent))
    )
    .slice(0, limit);

  return (
    <section
      aria-labelledby={urgentOnly ? "home-urgent-campaigns-heading" : "home-campaigns-heading"}
      className={`min-w-0 ${className}`}
    >
      {/* EN-TÊTE */}

      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <HeartPulse
            size={22}
            strokeWidth={2.3}
            className="shrink-0 text-[#E71E3D]"
            aria-hidden="true"
          />

          <h2
            id={urgentOnly ? "home-urgent-campaigns-heading" : "home-campaigns-heading"}
            className="text-[17px] font-extrabold leading-tight text-[#092B50] sm:text-[19px]"
          >
            {urgentOnly ? labels.title : ({ fr: "Collectes à soutenir", en: "Support a campaign", es: "Apoya una campaña", de: "Kampagnen unterstützen" }[language])}
          </h2>
        </div>

        <Link
          href="/campagnes"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-[#007D9D] transition-colors hover:text-[#E71E3D] sm:text-sm"
        >
          <span className="hidden sm:inline">
            {labels.viewAll}
          </span>

          <span className="sm:hidden">
            {labels.viewShort}
          </span>

          <ArrowRight
            size={14}
            aria-hidden="true"
          />
        </Link>
      </div>

      {/* CAMPAGNES */}

      {visibleCampaigns.length > 0 ? (
        <CardRail count={visibleCampaigns.length} label={urgentOnly ? labels.title : "Collectes"}>
            {visibleCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
              />
            ))}
        </CardRail>
      ) : (
        <div className="flex min-h-[100px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#D3E4ED] bg-[#F8FBFD] px-5 py-7 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E5F8FB]">
            <HandHeart
              size={25}
              strokeWidth={1.8}
              className="text-[#079CB4]"
              aria-hidden="true"
            />
          </div>

          <p className="max-w-[300px] text-sm leading-relaxed text-[#627B91]">
            {urgentOnly ? labels.empty : ({ fr: "Aucune collecte publiée pour le moment.", en: "No published campaigns yet.", es: "Todavía no hay campañas publicadas.", de: "Noch keine veröffentlichten Kampagnen." }[language])}
          </p>
        </div>
      )}
    </section>
  );
}
