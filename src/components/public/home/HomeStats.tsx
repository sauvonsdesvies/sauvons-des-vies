
"use client";

import {
  Megaphone,
  UsersRound,
  FileCheck2,
  type LucideIcon,
} from "lucide-react";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useHomeUpdates } from "@/hooks/useHomeUpdates";
import { formatNumber } from "@/lib/public/formatters";

import type {
  HomeStatistics,
  PublicLanguage,
} from "@/lib/public/home-types";

// ==========================================================
// FONDATION SAUVONS DES VIES
// STATISTIQUES OFFICIELLES — PAGE D'ACCUEIL
// ==========================================================
//
// Source : /admin/beneficiaires
// Service : getPublicStatistics()
//
// Actualisation automatique via /api/public/home
// Aucun montant global collecté
// Aucune donnée fictive
//
// ==========================================================

type HomeStatsProps = {
  controlledStatistics?: HomeStatistics;
  initialStatistics?: HomeStatistics | null;
  className?: string;
};

type StatKey =
  | "activeCampaigns"
  | "beneficiariesHelped"
  | "verifiedFiles";

const STAT_ITEMS: {
  key: StatKey;
  icon: LucideIcon;
}[] = [
  {
    key: "activeCampaigns",
    icon: Megaphone,
  },
  {
    key: "beneficiariesHelped",
    icon: UsersRound,
  },
  {
    key: "verifiedFiles",
    icon: FileCheck2,
  },
];

const LABELS: Record<
  PublicLanguage,
  {
    activeCampaigns: string;
    beneficiariesHelped: string;
    verifiedFiles: string;
    unavailable: string;
    loading: string;
    refresh: string;
  }
> = {
  fr: {
    activeCampaigns: "Campagnes actives",
    beneficiariesHelped: "Bénéficiaires aidés",
    verifiedFiles: "Dossiers vérifiés",
    unavailable: "Statistiques temporairement indisponibles.",
    loading: "Chargement des statistiques",
    refresh: "Actualisation des statistiques",
  },
  en: {
    activeCampaigns: "Active campaigns",
    beneficiariesHelped: "People helped",
    verifiedFiles: "Verified cases",
    unavailable: "Statistics are temporarily unavailable.",
    loading: "Loading statistics",
    refresh: "Updating statistics",
  },
  es: {
    activeCampaigns: "Campañas activas",
    beneficiariesHelped: "Personas ayudadas",
    verifiedFiles: "Casos verificados",
    unavailable: "Las estadísticas no están disponibles temporalmente.",
    loading: "Cargando estadísticas",
    refresh: "Actualizando estadísticas",
  },
  de: {
    activeCampaigns: "Aktive Kampagnen",
    beneficiariesHelped: "Unterstützte Personen",
    verifiedFiles: "Geprüfte Fälle",
    unavailable: "Statistiken sind vorübergehend nicht verfügbar.",
    loading: "Statistiken werden geladen",
    refresh: "Statistiken werden aktualisiert",
  },
};

// ----------------------------------------------------------
// CARTE STATISTIQUE
// ----------------------------------------------------------

function StatisticCard({
  icon: Icon,
  label,
  value,
  loading,
  language,
}: {
  icon: LucideIcon;
  label: string;
  value: number | null;
  loading: boolean;
  language: PublicLanguage;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg border border-[#E1EAF1] bg-white px-3 py-3 shadow-[0_3px_12px_rgba(9,43,80,0.05)] sm:gap-4 sm:px-5 sm:py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E5F8FB] text-[#009DB8] sm:h-12 sm:w-12">
        <Icon
          size={25}
          strokeWidth={2}
          aria-hidden="true"
          className="sm:h-7 sm:w-7"
        />
      </div>

      <div className="min-w-0 flex-1">
        {loading && value === null ? (
          <div
            aria-hidden="true"
            className="mb-2 h-7 w-16 animate-pulse rounded-md bg-[#DCEAF1]"
          />
        ) : (
          <p className="text-[24px] font-extrabold leading-none tabular-nums text-[#092B50] sm:text-[30px] lg:text-[28px]">
            {value === null
              ? "—"
              : formatNumber(value, language)}
          </p>
        )}

        <p className="mt-1.5 text-sm font-semibold leading-snug text-[#5A738A] sm:text-sm">
          {label}
        </p>
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// COMPOSANT PRINCIPAL
// ----------------------------------------------------------

export default function HomeStats({
  controlledStatistics,
  initialStatistics = null,
  className = "",
}: HomeStatsProps) {
  const { language } = useTranslation();
  const labels = LABELS[language];

  const {
    statistics: fetchedStatistics,
    isLoading,
    isRefreshing,
    isError,
  } = useHomeUpdates({
    initialStatistics,
    refreshInterval: 30_000,
    enabled: controlledStatistics === undefined,
  });
  const statistics = controlledStatistics ?? fetchedStatistics;

  return (
    <section
      aria-label={labels.loading}
      aria-busy={isLoading && statistics === null}
      className={`min-w-0 ${className}`}
    >
      <div className="grid grid-cols-2 gap-2 [&>*:last-child]:col-span-2 sm:grid-cols-3 sm:[&>*:last-child]:col-span-1 lg:gap-3">
        {STAT_ITEMS.map(({ key, icon }) => (
          <StatisticCard
            key={key}
            icon={icon}
            label={labels[key]}
            value={statistics?.[key] ?? null}
            loading={isLoading}
            language={language}
          />
        ))}
      </div>

      <span className="sr-only" aria-live="polite">
        {isRefreshing ? labels.refresh : ""}
      </span>

      {isError && statistics === null && (
        <p
          role="status"
          className="mt-3 text-center text-sm text-[#667E91]"
        >
          {labels.unavailable}
        </p>
      )}
    </section>
  );
}
