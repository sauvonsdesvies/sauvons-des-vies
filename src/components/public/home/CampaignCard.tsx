
"use client";

import Image from "@/components/public/PublicImage";
import Link from "next/link";
import { formatPublicCountry } from "@/lib/public/formatters";

import {
  Heart,
  ArrowRight,
  MapPin,
  HeartPulse,
  ImageIcon,
} from "lucide-react";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import CampaignProgress from "./CampaignProgress";

import type {
  HomeCampaign,
  PublicLanguage,
} from "@/lib/public/home-types";

// ==========================================================
// FONDATION SAUVONS DES VIES
// CARTE DE CAMPAGNE — PAGE D'ACCUEIL
// ==========================================================

type CampaignCardProps = {
  campaign: HomeCampaign;
  className?: string;
};

const LABELS: Record<
  PublicLanguage,
  {
    urgent: string;
    donate: string;
    details: string;
    image: string;
    completed: string;
    closed: string;
  }
> = {
  fr: {
    urgent: "Urgent",
    donate: "Faire un don",
    details: "Voir la campagne",
    image: "Photo de la campagne",
    completed: "Objectif atteint",
    closed: "Campagne clôturée",
  },
  en: {
    urgent: "Urgent",
    donate: "Donate",
    details: "View campaign",
    image: "Campaign photo",
    completed: "Goal reached",
    closed: "Campaign closed",
  },
  es: {
    urgent: "Urgente",
    donate: "Donar",
    details: "Ver campaña",
    image: "Foto de la campaña",
    completed: "Objetivo alcanzado",
    closed: "Campaña cerrada",
  },
  de: {
    urgent: "Dringend",
    donate: "Spenden",
    details: "Kampagne ansehen",
    image: "Kampagnenfoto",
    completed: "Ziel erreicht",
    closed: "Kampagne geschlossen",
  },
};

export default function CampaignCard({
  campaign,
  className = "",
}: CampaignCardProps) {
  const { language } = useTranslation();
  const labels = LABELS[language];

  const detailHref = `/campagnes/${encodeURIComponent(
    campaign.slug
  )}`;

  // Les dons sont dirigés vers le parcours existant.
  // La campagne est transmise dans l'URL pour
  // permettre au formulaire de l'identifier.
  const donationHref = `${detailHref}#campaign-donation-panel`;

  const canDonate =
    campaign.status === "ACTIVE" &&
    campaign.remainingAmount > 0;

  return (
    <article
      className={`group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-[#E0EAF2] bg-white shadow-[0_4px_14px_rgba(9,43,80,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B9E7EE] hover:shadow-[0_10px_25px_rgba(9,43,80,0.12)] ${className}`}
    >
      <div className="block">

      <Link
        href={detailHref}
        aria-label={`${labels.details} : ${campaign.title}`}
        className="relative block w-full self-start overflow-hidden bg-[#E6F4F8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0BC2D4]"
      >
        {campaign.imageUrl ? (
          <Image
            src={campaign.imageUrl}
            unoptimized={campaign.imageUrl.startsWith("https://")}
            alt={campaign.title || labels.image}
            width={768}
            height={512}
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="block h-auto w-full"
          />
        ) : (
          <div className="flex aspect-[3/2] items-center justify-center bg-gradient-to-br from-[#DDF3F8] to-[#EFF9FC]">
            <ImageIcon
              size={38}
              strokeWidth={1.5}
              className="text-[#7EADBD]"
              aria-hidden="true"
            />
          </div>
        )}

        {campaign.isUrgent &&
          campaign.status === "ACTIVE" && (
            <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-md bg-[#E71E3D] px-1.5 py-1 text-xs font-extrabold uppercase tracking-wide text-white shadow-sm sm:left-3 sm:top-3 sm:px-2.5 sm:text-xs">
              <HeartPulse
                size={13}
                strokeWidth={2.3}
                aria-hidden="true"
              />
              {labels.urgent}
            </span>
          )}

        {campaign.status !== "ACTIVE" && (
          <span className="absolute right-3 top-3 rounded-md bg-[#092B50]/90 px-2.5 py-1.5 text-xs font-bold text-white">
            {campaign.status === "COMPLETED"
              ? labels.completed
              : labels.closed}
          </span>
        )}
      </Link>

      {/* CONTENU */}

      <div className="min-w-0 px-3 py-3 sm:px-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {campaign.category && (
            <span className="rounded-md bg-[#E6F8FB] px-2 py-1 text-xs font-bold text-[#007D9B]">
              {campaign.category.name}
            </span>
          )}

          {campaign.country && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#6A8094]">
              <MapPin
                size={12}
                aria-hidden="true"
              />
              {formatPublicCountry(campaign.country, language)}
            </span>
          )}
        </div>

        <h3 className="line-clamp-2 min-h-[38px] text-sm font-extrabold leading-[1.4] text-[#092B50] sm:text-base">
          <Link
            href={detailHref}
            className="transition-colors hover:text-[#008DA8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0BC2D4]"
          >
            {campaign.title}
          </Link>
        </h3>

        <p className="mt-1.5 line-clamp-2 min-h-[35px] text-sm leading-[1.6] text-[#647B90] sm:text-sm">
          {campaign.shortDescription}
        </p>

      </div>
      </div>

      <div className="mt-auto flex flex-col px-3 pb-3 sm:px-4 sm:pb-4">
        <div className="pt-2">
          <CampaignProgress
            collectedAmount={campaign.collectedAmount}
            targetAmount={campaign.targetAmount}
            donorCount={campaign.donorCount}
            currency={campaign.currency}
            compact
          />
        </div>

        {/* ACTIONS */}

        <div className="mt-3 flex items-center gap-2">
          {canDonate ? (
            <Link
              href={donationHref}
              className="inline-flex min-h-[41px] flex-1 items-center justify-center gap-2 rounded-lg bg-[#E71E3D] px-3 py-2 text-sm font-extrabold text-white transition-colors hover:bg-[#C91835] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E71E3D]"
            >
              <Heart
                size={15}
                fill="currentColor"
                aria-hidden="true"
              />
              {labels.donate}
            </Link>
          ) : (
            <span className="inline-flex min-h-[41px] flex-1 items-center justify-center rounded-lg bg-[#E8EEF3] px-3 py-2 text-center text-xs font-bold text-[#647B90]">
              {campaign.status === "COMPLETED"
                ? labels.completed
                : labels.closed}
            </span>
          )}

          <Link
            href={detailHref}
            aria-label={`${labels.details} : ${campaign.title}`}
            className="inline-flex h-[41px] w-[41px] shrink-0 items-center justify-center rounded-lg border border-[#D5E5EE] bg-[#F5FAFD] text-[#007F9E] transition-colors hover:bg-[#E5F7FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0BC2D4]"
          >
            <ArrowRight
              size={18}
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}
