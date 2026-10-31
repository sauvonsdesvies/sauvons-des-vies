
"use client";

import { UsersRound } from "lucide-react";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  calculateProgress,
  calculateRemainingAmount,
  formatMoney,
  formatNumber,
} from "@/lib/public/formatters";

import type { PublicLanguage } from "@/lib/public/home-types";

// ==========================================================
// FONDATION SAUVONS DES VIES
// PROGRESSION D'UNE CAMPAGNE — PC ET MOBILE
// ==========================================================

type CampaignProgressProps = {
  collectedAmount: number;
  targetAmount: number;
  donorCount?: number;
  currency?: string;
  className?: string;
  compact?: boolean;
};

const LABELS: Record<
  PublicLanguage,
  {
    collected: string;
    goal: string;
    remaining: string;
    donors: string;
    progress: string;
  }
> = {
  fr: {
    collected: "collectés",
    goal: "sur",
    remaining: "restants",
    donors: "donateurs",
    progress: "Progression de la collecte",
  },
  en: {
    collected: "raised",
    goal: "of",
    remaining: "remaining",
    donors: "donors",
    progress: "Fundraising progress",
  },
  es: {
    collected: "recaudados",
    goal: "de",
    remaining: "restantes",
    donors: "donantes",
    progress: "Progreso de la recaudación",
  },
  de: {
    collected: "gesammelt",
    goal: "von",
    remaining: "verbleibend",
    donors: "Spender",
    progress: "Spendenfortschritt",
  },
};

function safeAmount(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export default function CampaignProgress({
  collectedAmount,
  targetAmount,
  donorCount,
  currency = "XOF",
  className = "",
  compact = false,
}: CampaignProgressProps) {
  const { language } = useTranslation();
  const labels = LABELS[language];

  const collected = safeAmount(collectedAmount);
  const target = safeAmount(targetAmount);

  const percentage = calculateProgress(collected, target);
  const remaining = calculateRemainingAmount(target, collected);

  const hasDonorCount =
    typeof donorCount === "number" &&
    Number.isSafeInteger(donorCount) &&
    donorCount >= 0;

  return (
    <div className={`w-full min-w-0 ${className}`}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <p className="text-[12px] font-extrabold text-[#092B50] sm:text-[13px]">
          {formatMoney(collected, currency, language)}{" "}
          <span className="font-semibold text-[#4F6C85]">
            {labels.collected}
          </span>
        </p>

        {target > 0 && (
          <p className="text-[11px] font-medium text-[#61788E]">
            {labels.goal}{" "}
            {formatMoney(target, currency, language)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div
          role="progressbar"
          aria-label={labels.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage}
          className={[
            "relative min-w-0 flex-1 overflow-hidden rounded-full bg-[#DDE9EF]",
            compact ? "h-[7px]" : "h-[9px]",
          ].join(" ")}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#009DB8] to-[#19CBD9] transition-[width] duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <span className="w-[40px] shrink-0 text-right text-[11px] font-extrabold tabular-nums text-[#007E9C] sm:text-[12px]">
          {percentage}%
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[10px] text-[#5B748A] sm:text-[11px]">
        <span>
          <strong className="font-bold text-[#092B50]">
            {formatMoney(remaining, currency, language)}
          </strong>{" "}
          {labels.remaining}
        </span>

        {hasDonorCount && (
          <span className="inline-flex items-center gap-1">
            <UsersRound
              size={12}
              strokeWidth={1.8}
              aria-hidden="true"
            />
            {formatNumber(donorCount, language)}{" "}
            {labels.donors}
          </span>
        )}
      </div>
    </div>
  );
}
