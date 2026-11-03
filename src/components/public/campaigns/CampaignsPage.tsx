"use client";

import { formatCfaAmount } from "@/lib/campaigns/currencies";

import Image from "@/components/public/PublicImage";
import Link from "next/link";
import { formatPublicCountry } from "@/lib/public/formatters";
import {
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Grid2X2,
  HandHeart,
  Heart,
  HeartHandshake,
  List,
  MapPin,
  RotateCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UsersRound,
  X,
} from "lucide-react";

import {
  usePublicCampaigns,
  type CampaignSort,
  type PublicCampaign,
  type CampaignPagination,
  type PublicCampaignCategory,
} from "@/hooks/usePublicCampaigns";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

// ==========================================================
// FONDATION SAUVONS DES VIES
// PAGE PUBLIQUE — CAMPAGNES DE DONS
// ==========================================================
//
// URL : /campagnes
//
// Interface :
// - Bannière hero
// - Recherche et filtres
// - Campagnes publiées
// - Affichage grille / liste
// - Progression des collectes
// - Catégories
// - Engagement de la fondation
// - Pagination
// - Responsive PC / mobile
//
// Les actualités sont prévues dans la colonne latérale,
// mais ne sont pas simulées en l'absence d'une source réelle.
//
// ==========================================================

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

type Language = "fr" | "en" | "de" | "es";
type ViewMode = "grid" | "list";

type CampaignsPageProps = {
  initialCampaigns?: PublicCampaign[];
  initialPagination?: CampaignPagination;
  initialCategories?: PublicCampaignCategory[];
};

// ----------------------------------------------------------
// TRADUCTIONS
// ----------------------------------------------------------

const translations = {
  fr: {
    eyebrow: "FONDATION SAUVONS DES VIES",
    heroTitle: "Ensemble, sauvons des vies.",
    heroDescription:
      "Découvrez les campagnes de solidarité et participez à des actions concrètes pour soutenir les personnes qui ont besoin de soins.",
    heroButton: "Découvrir les campagnes",

    pageTitle: "Campagnes de dons",
    pageDescription:
      "Chaque contribution peut faire la différence. Découvrez les collectes actuellement présentées par notre fondation.",

    searchPlaceholder: "Rechercher une campagne...",
    allCategories: "Toutes les catégories",
    allStatuses: "Tous les statuts",
    allCountries: "Tous les pays",
    allCampaigns: "Toutes les campagnes",

    active: "En cours",
    completed: "Terminée",
    closed: "Clôturée",
    urgent: "Urgent",

    newest: "Plus récentes",
    oldest: "Plus anciennes",
    mostFunded: "Montant collecté décroissant",
    leastFunded: "Montant collecté croissant",
    endingSoon: "Fin proche",

    filters: "Filtres",
    reset: "Réinitialiser",
    results: "campagnes trouvées",
    oneResult: "campagne trouvée",

    collected: "Collectés",
    goal: "Objectif",
    remaining: "Restants",
    donors: "donateurs",
    oneDonor: "donateur",
    daysLeft: "jours restants",
    oneDayLeft: "jour restant",
    ended: "Collecte clôturée",

    viewCampaign: "Voir la collecte",
    donate: "Faire un don",

    categories: "Catégories",
    commitment: "Notre engagement",
    commitmentText:
      "Nous examinons les dossiers avant leur publication et privilégions le règlement direct des frais auprès des établissements concernés.",
    transparency: "Transparence",
    transparencyText:
      "Les informations de collecte sont actualisées à partir des dons confirmés.",

    news: "Dernières actualités",
    noNews: "Aucune actualité disponible pour le moment.",

    loading: "Chargement des campagnes...",
    refreshing: "Actualisation...",
    emptyTitle: "Aucune campagne trouvée",
    emptyDescription:
      "Aucune campagne ne correspond actuellement à votre recherche. Essayez de modifier les filtres.",
    errorTitle: "Impossible de charger les campagnes",
    retry: "Réessayer",

    previous: "Précédent",
    next: "Suivant",
    page: "Page",
    of: "sur",
    viewGrid: "Affichage en grille",
    viewList: "Affichage en liste",
  },

  en: {
    eyebrow: "SAUVONS DES VIES FOUNDATION",
    heroTitle: "Together, we can save lives.",
    heroDescription:
      "Explore solidarity campaigns and take meaningful action to support people who need medical care.",
    heroButton: "Explore campaigns",

    pageTitle: "Donation campaigns",
    pageDescription:
      "Every contribution can make a difference. Explore the fundraising campaigns presented by our foundation.",

    searchPlaceholder: "Search for a campaign...",
    allCategories: "All categories",
    allStatuses: "All statuses",
    allCountries: "All countries",
    allCampaigns: "All campaigns",

    active: "Active",
    completed: "Completed",
    closed: "Closed",
    urgent: "Urgent",

    newest: "Newest",
    oldest: "Oldest",
    mostFunded: "Highest amount raised",
    leastFunded: "Lowest amount raised",
    endingSoon: "Ending soon",

    filters: "Filters",
    reset: "Reset",
    results: "campaigns found",
    oneResult: "campaign found",

    collected: "Raised",
    goal: "Goal",
    remaining: "Remaining",
    donors: "donors",
    oneDonor: "donor",
    daysLeft: "days left",
    oneDayLeft: "day left",
    ended: "Fundraiser closed",

    viewCampaign: "View campaign",
    donate: "Donate",

    categories: "Categories",
    commitment: "Our commitment",
    commitmentText:
      "We review applications before publication and prioritize direct payments to the institutions concerned.",
    transparency: "Transparency",
    transparencyText:
      "Fundraising figures are updated using confirmed donations.",

    news: "Latest news",
    noNews: "No news available at the moment.",

    loading: "Loading campaigns...",
    refreshing: "Updating...",
    emptyTitle: "No campaigns found",
    emptyDescription:
      "No campaigns currently match your search. Try changing your filters.",
    errorTitle: "Unable to load campaigns",
    retry: "Try again",

    previous: "Previous",
    next: "Next",
    page: "Page",
    of: "of",
    viewGrid: "Grid view",
    viewList: "List view",
  },

  de: {
    eyebrow: "STIFTUNG SAUVONS DES VIES",
    heroTitle: "Gemeinsam Leben retten.",
    heroDescription:
      "Entdecken Sie Spendenaktionen und unterstützen Sie Menschen, die dringend medizinische Hilfe benötigen.",
    heroButton: "Kampagnen entdecken",

    pageTitle: "Spendenkampagnen",
    pageDescription:
      "Jeder Beitrag kann etwas bewirken. Entdecken Sie die Spendenaktionen unserer Stiftung.",

    searchPlaceholder: "Kampagne suchen...",
    allCategories: "Alle Kategorien",
    allStatuses: "Alle Status",
    allCountries: "Alle Länder",
    allCampaigns: "Alle Kampagnen",

    active: "Aktiv",
    completed: "Abgeschlossen",
    closed: "Geschlossen",
    urgent: "Dringend",

    newest: "Neueste",
    oldest: "Älteste",
    mostFunded: "Höchster Spendenbetrag",
    leastFunded: "Niedrigster Spendenbetrag",
    endingSoon: "Endet bald",

    filters: "Filter",
    reset: "Zurücksetzen",
    results: "Kampagnen gefunden",
    oneResult: "Kampagne gefunden",

    collected: "Gesammelt",
    goal: "Ziel",
    remaining: "Verbleibend",
    donors: "Spender",
    oneDonor: "Spender",
    daysLeft: "Tage verbleibend",
    oneDayLeft: "Tag verbleibend",
    ended: "Spendenaktion beendet",

    viewCampaign: "Kampagne ansehen",
    donate: "Spenden",

    categories: "Kategorien",
    commitment: "Unser Engagement",
    commitmentText:
      "Wir prüfen Anträge vor der Veröffentlichung und bevorzugen direkte Zahlungen an die betreffenden Einrichtungen.",
    transparency: "Transparenz",
    transparencyText:
      "Die Spendenbeträge werden anhand bestätigter Spenden aktualisiert.",

    news: "Aktuelle Nachrichten",
    noNews: "Derzeit sind keine Nachrichten verfügbar.",

    loading: "Kampagnen werden geladen...",
    refreshing: "Aktualisierung...",
    emptyTitle: "Keine Kampagnen gefunden",
    emptyDescription:
      "Keine Kampagne entspricht derzeit Ihrer Suche. Bitte ändern Sie die Filter.",
    errorTitle: "Kampagnen konnten nicht geladen werden",
    retry: "Erneut versuchen",

    previous: "Zurück",
    next: "Weiter",
    page: "Seite",
    of: "von",
    viewGrid: "Rasteransicht",
    viewList: "Listenansicht",
  },

  es: {
    eyebrow: "FUNDACIÓN SAUVONS DES VIES",
    heroTitle: "Juntos podemos salvar vidas.",
    heroDescription:
      "Descubre campañas solidarias y ayuda a personas que necesitan atención médica.",
    heroButton: "Descubrir campañas",

    pageTitle: "Campañas de donación",
    pageDescription:
      "Cada contribución puede marcar la diferencia. Descubre las campañas de nuestra fundación.",

    searchPlaceholder: "Buscar una campaña...",
    allCategories: "Todas las categorías",
    allStatuses: "Todos los estados",
    allCountries: "Todos los países",
    allCampaigns: "Todas las campañas",

    active: "Activa",
    completed: "Completada",
    closed: "Cerrada",
    urgent: "Urgente",

    newest: "Más recientes",
    oldest: "Más antiguas",
    mostFunded: "Mayor importe recaudado",
    leastFunded: "Menor importe recaudado",
    endingSoon: "Próximas a finalizar",

    filters: "Filtros",
    reset: "Restablecer",
    results: "campañas encontradas",
    oneResult: "campaña encontrada",

    collected: "Recaudado",
    goal: "Objetivo",
    remaining: "Restante",
    donors: "donantes",
    oneDonor: "donante",
    daysLeft: "días restantes",
    oneDayLeft: "día restante",
    ended: "Campaña cerrada",

    viewCampaign: "Ver campaña",
    donate: "Donar",

    categories: "Categorías",
    commitment: "Nuestro compromiso",
    commitmentText:
      "Revisamos las solicitudes antes de publicarlas y priorizamos los pagos directos a las instituciones correspondientes.",
    transparency: "Transparencia",
    transparencyText:
      "Las cifras se actualizan a partir de donaciones confirmadas.",

    news: "Últimas noticias",
    noNews: "No hay noticias disponibles por el momento.",

    loading: "Cargando campañas...",
    refreshing: "Actualizando...",
    emptyTitle: "No se encontraron campañas",
    emptyDescription:
      "Ninguna campaña coincide con tu búsqueda. Prueba a cambiar los filtros.",
    errorTitle: "No se pudieron cargar las campañas",
    retry: "Reintentar",

    previous: "Anterior",
    next: "Siguiente",
    page: "Página",
    of: "de",
    viewGrid: "Vista de cuadrícula",
    viewList: "Vista de lista",
  },
} as const;

// ----------------------------------------------------------
// UTILITAIRES
// ----------------------------------------------------------

function getLocale(language: Language): string {
  switch (language) {
    case "en":
      return "en-US";
    case "de":
      return "de-DE";
    case "es":
      return "es-ES";
    default:
      return "fr-FR";
  }
}

function formatAmount(
  amount: number,
  currency: string,
  language: Language
): string {
  const cfa = formatCfaAmount(amount, currency, getLocale(language));
  if (cfa !== null) return cfa;
  try {
    return new Intl.NumberFormat(getLocale(language), {
      style: "currency", currencyDisplay: "code", currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${new Intl.NumberFormat(
      getLocale(language)
    ).format(amount)} ${currency}`;
  }
}

function formatCount(
  amount: number,
  language: Language
): string {
  return new Intl.NumberFormat(
    getLocale(language)
  ).format(amount);
}

function getDaysRemaining(
  endDate: string | null
): number | null {
  if (!endDate) return null;

  const end = new Date(endDate).getTime();

  if (Number.isNaN(end)) return null;

  const difference = end - Date.now();

  return Math.max(
    0,
    Math.ceil(difference / 86_400_000)
  );
}

function getCampaignImage(
  campaign: PublicCampaign
): string | null {
  return campaign.imageUrl || null;
}

function isValidLanguage(
  value: unknown
): value is Language {
  return (
    value === "fr" ||
    value === "en" ||
    value === "de" ||
    value === "es"
  );
}

// ----------------------------------------------------------
// CARTE CAMPAGNE
// ----------------------------------------------------------

type CampaignCardProps = {
  campaign: PublicCampaign;
  language: Language;
  t: (typeof translations)[Language];
  viewMode: ViewMode;
};

function CampaignCard({
  campaign,
  language,
  t,
  viewMode,
}: CampaignCardProps) {
  const imageUrl = getCampaignImage(campaign);

  const progress = Math.min(
    100,
    Math.max(0, campaign.progressPercentage)
  );

  const daysRemaining = getDaysRemaining(
    campaign.endDate
  );

  const isActive = campaign.status === "ACTIVE";

  const statusLabel =
    campaign.status === "COMPLETED"
      ? t.completed
      : campaign.status === "CLOSED"
        ? t.closed
        : t.active;

  return (
    <article
      className={[
        "group overflow-hidden rounded-[22px]",
        "border border-slate-200 bg-white",
        "shadow-[0_8px_28px_rgba(9,43,80,0.06)]",
        "transition-all duration-300",
        "hover:-translate-y-1",
        "hover:shadow-[0_18px_42px_rgba(9,43,80,0.12)]",
        viewMode === "list"
          ? "lg:flex lg:min-h-[310px]"
          : "flex h-full flex-col",
      ].join(" ")}
    >
      <Link
        href={`/campagnes/${encodeURIComponent(campaign.slug)}`}
        aria-label={`${t.viewCampaign} : ${campaign.title}`}
        className={[
          "relative block self-start overflow-hidden bg-slate-100",
          viewMode === "list"
            ? "w-full lg:w-[36%] lg:shrink-0"
            : "w-full",
        ].join(" ")}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            unoptimized={imageUrl.startsWith("https://")}
            alt={campaign.title}
            width={768}
            height={512}
            sizes={
              viewMode === "list"
                ? "(max-width: 1024px) 100vw, 35vw"
                : "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
            }
            className="block h-auto w-full"
          />
        ) : (
          <div className="flex aspect-[3/2] items-center justify-center bg-gradient-to-br from-[#092B50] to-[#0B8297]">
            <HandHeart
              className="h-16 w-16 text-white/60"
              strokeWidth={1.3}
            />
          </div>
        )}

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {campaign.category && (
            <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-[#092B50] shadow-sm">
              {campaign.category.name}
            </span>
          )}

          {campaign.isUrgent && isActive && (
            <span className="rounded-full bg-[#E71E3D] px-3 py-1.5 text-xs font-bold text-white shadow-sm">
              {t.urgent}
            </span>
          )}
        </div>

        {!isActive && (
          <div className="absolute bottom-4 left-4">
            <span className="rounded-full bg-[#092B50]/90 px-3 py-1.5 text-xs font-semibold text-white">
              {statusLabel}
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {campaign.country && (
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <MapPin className="h-3.5 w-3.5" />
            <span>{formatPublicCountry(campaign.country, language)}</span>
          </div>
        )}

        <h3 className="line-clamp-2 text-[18px] font-extrabold leading-snug text-[#092B50]">
          {campaign.title}
        </h3>

        <p className="mt-3 line-clamp-3 min-h-[60px] text-sm leading-[1.65] text-slate-600">
          {campaign.shortDescription}
        </p>

        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500">
                {t.collected}
              </p>
              <p className="truncate text-base font-extrabold text-[#092B50]">
                {formatAmount(
                  campaign.collectedAmount,
                  campaign.currency,
                  language
                )}
              </p>
            </div>

            <span className="shrink-0 text-sm font-extrabold text-[#0B9BAE]">
              {progress}%
            </span>
          </div>

          <div
            className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label={`${t.collected}: ${progress}%`}
          >
            <div
              className="h-full rounded-full bg-[#0BC2D4] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              {t.goal}:{" "}
              <strong className="font-bold text-slate-700">
                {formatAmount(
                  campaign.targetAmount,
                  campaign.currency,
                  language
                )}
              </strong>
            </span>

            <span className="text-right">
              {t.remaining}:{" "}
              <strong className="font-bold text-slate-700">
                {formatAmount(
                  campaign.remainingAmount,
                  campaign.currency,
                  language
                )}
              </strong>
            </span>
          </div>

          <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <UsersRound className="h-4 w-4 text-[#0B9BAE]" />
              {formatCount(
                campaign.donorCount,
                language
              )}{" "}
              {campaign.donorCount === 1
                ? t.oneDonor
                : t.donors}
            </span>

            <span className="flex items-center gap-1.5">
              <Clock3 className="h-4 w-4 text-[#0B9BAE]" />
              {isActive && daysRemaining !== null
                ? `${daysRemaining} ${
                    daysRemaining === 1
                      ? t.oneDayLeft
                      : t.daysLeft
                  }`
                : isActive
                  ? statusLabel
                  : t.ended}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <Link
              href={`/campagnes/${encodeURIComponent(
                campaign.slug
              )}`}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-[#092B50] px-3 text-center text-sm font-bold text-[#092B50] transition-colors hover:bg-[#092B50] hover:text-white"
            >
              {t.viewCampaign}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            {isActive ? (
              <Link
                href={`/campagnes/${encodeURIComponent(
                  campaign.slug
                )}#campaign-donation-panel`}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#E71E3D] px-3 text-center text-sm font-bold text-white transition-colors hover:bg-[#c91834]"
              >
                <Heart className="h-3.5 w-3.5" />
                {t.donate}
              </Link>
            ) : (
              <span className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-100 px-3 text-center text-xs font-semibold text-slate-500">
                {statusLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// ----------------------------------------------------------
// COMPOSANT PRINCIPAL
// ----------------------------------------------------------

export default function CampaignsPage({
  initialCampaigns = [],
}: CampaignsPageProps) {
  const translationContext = useTranslation();

  const language: Language = isValidLanguage(
    translationContext.language
  )
    ? translationContext.language
    : "fr";

  const t = translations[language];

  const [viewMode, setViewMode] =
    useState<ViewMode>("grid");

  const [mobileFiltersOpen, setMobileFiltersOpen] =
    useState(false);

  const {
    campaigns,
    categories,
    filters,
    pagination,
    isLoading,
    isRefreshing,
    error,
    setSearch,
    setCategory,
    setStatus,
    setCountry,
    setSort,
    setPage,
    resetFilters,
    refresh,
  } = usePublicCampaigns({
    initialCampaigns,
  });

  // --------------------------------------------------------
  // PAYS DISPONIBLES
  // --------------------------------------------------------

  const countries = useMemo(() => {
    const values = new Set<string>();

    for (const campaign of campaigns) {
      if (campaign.country) {
        values.add(campaign.country);
      }
    }

    if (filters.country) {
      values.add(filters.country);
    }

    return Array.from(values).sort(
      (a, b) => a.localeCompare(b)
    );
  }, [campaigns, filters.country]);

  // --------------------------------------------------------
  // FILTRES ACTIFS
  // --------------------------------------------------------

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.category ||
    filters.status ||
    filters.country ||
    filters.sort !== "newest"
  );

  const handleReset = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  // --------------------------------------------------------
  // CHAMPS DE FILTRE
  // --------------------------------------------------------

  const filtersContent = (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
      <div className="relative xl:col-span-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-slate-400" />

        <input
          type="search"
          value={filters.search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder={t.searchPlaceholder}
          aria-label={t.searchPlaceholder}
          maxLength={200}
          className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-[#092B50] outline-none transition-colors placeholder:text-slate-400 focus:border-[#0BC2D4] focus:ring-2 focus:ring-[#0BC2D4]/15"
        />
      </div>

      <select
        value={filters.category}
        onChange={(event) =>
          setCategory(event.target.value)
        }
        aria-label={t.allCategories}
        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-[#092B50] outline-none focus:border-[#0BC2D4] focus:ring-2 focus:ring-[#0BC2D4]/15"
      >
        <option value="">{t.allCategories}</option>
        {categories.map((category) => (
          <option
            key={category.id}
            value={category.slug}
          >
            {category.name}
          </option>
        ))}
      </select>

      <select
        value={filters.status}
        onChange={(event) =>
          setStatus(event.target.value)
        }
        aria-label={t.allStatuses}
        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-[#092B50] outline-none focus:border-[#0BC2D4] focus:ring-2 focus:ring-[#0BC2D4]/15"
      >
        <option value="">{t.allStatuses}</option>
        <option value="ACTIVE">{t.active}</option>
        <option value="COMPLETED">{t.completed}</option>
        <option value="CLOSED">{t.closed}</option>
      </select>

      <select
        value={filters.country}
        onChange={(event) =>
          setCountry(event.target.value)
        }
        aria-label={t.allCountries}
        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-[#092B50] outline-none focus:border-[#0BC2D4] focus:ring-2 focus:ring-[#0BC2D4]/15"
      >
        <option value="">{t.allCountries}</option>
        {countries.map((country) => (
          <option key={country} value={country}>
            {country}
          </option>
        ))}
      </select>

      <select
        value={filters.sort}
        onChange={(event) =>
          setSort(
            event.target.value as CampaignSort
          )
        }
        aria-label={t.newest}
        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-[#092B50] outline-none focus:border-[#0BC2D4] focus:ring-2 focus:ring-[#0BC2D4]/15"
      >
        <option value="newest">{t.newest}</option>
        <option value="oldest">{t.oldest}</option>
        <option value="most-funded">
          {t.mostFunded}
        </option>
        <option value="least-funded">
          {t.leastFunded}
        </option>
        <option value="ending-soon">
          {t.endingSoon}
        </option>
      </select>
    </div>
  );

  // --------------------------------------------------------
  // RENDU
  // --------------------------------------------------------

  return (
    <main className="min-h-screen bg-[#F6F9FC]">
      {/* HERO */}

      <section className="relative isolate min-h-[330px] overflow-hidden bg-[#092B50] sm:min-h-[380px] lg:min-h-[420px]">
        <Image
          src="/images/home/hero.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-contain object-center"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#092B50]/95 via-[#092B50]/80 to-[#092B50]/25" />

        <div className="relative mx-auto flex min-h-[330px] max-w-none flex-col justify-center px-4 py-6 sm:min-h-[330px] sm:px-6 lg:min-h-[350px] lg:px-8">
          <div className="max-w-[660px]">
            <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.22em] text-[#58E3EE] sm:text-sm">
              {t.eyebrow}
            </p>

            <h1 className="max-w-[620px] text-[34px] font-extrabold leading-[1.12] tracking-tight text-white sm:text-[45px] lg:text-[56px]">
              {t.heroTitle}
            </h1>

            <p className="mt-5 max-w-[550px] text-sm leading-[1.85] text-white/90 sm:text-base">
              {t.heroDescription}
            </p>

            <a
              href="#liste-campagnes"
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#E71E3D] px-6 text-sm font-bold text-white shadow-lg shadow-black/10 transition-colors hover:bg-[#c91834]"
            >
              {t.heroButton}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* CONTENU */}

      <section
        id="liste-campagnes"
        className="scroll-mt-24"
      >
        <div className="mx-auto max-w-none px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-[780px]">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-1 w-8 rounded-full bg-[#0BC2D4]" />
              <span className="text-xs font-extrabold uppercase tracking-[0.17em] text-[#0B9BAE]">
                {t.eyebrow}
              </span>
            </div>

            <h2 className="text-[27px] font-extrabold tracking-tight text-[#092B50] sm:text-[35px]">
              {t.pageTitle}
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-600">
              {t.pageDescription}
            </p>
          </div>

          {/* FILTRES DESKTOP */}

          <div className="hidden rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_6px_25px_rgba(9,43,80,0.04)] md:block">
            {filtersContent}

            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-[#092B50] hover:text-[#0B9BAE]"
                >
                  <X className="h-3.5 w-3.5" />
                  {t.reset}
                </button>
              </div>
            )}
          </div>

          {/* FILTRES MOBILE */}

          <div className="mb-5 md:hidden">
            <button
              type="button"
              onClick={() =>
                setMobileFiltersOpen((previous) => !previous)
              }
              aria-expanded={mobileFiltersOpen}
              className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#092B50]"
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                {t.filters}
              </span>

              <span>
                {mobileFiltersOpen ? "−" : "+"}
              </span>
            </button>

            {mobileFiltersOpen && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
                {filtersContent}

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="mt-4 flex items-center gap-1.5 text-sm font-bold text-[#092B50]"
                  >
                    <X className="h-3.5 w-3.5" />
                    {t.reset}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* RÉSULTATS + COLONNE LATÉRALE */}

          <div className="mt-7 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-extrabold text-[#092B50] sm:text-[17px]">
                    {t.allCampaigns}
                  </h3>

                  <span className="rounded-full bg-[#E8F8FA] px-3 py-1.5 text-xs font-bold text-[#087F8E]">
                    {formatCount(
                      pagination.total,
                      language
                    )}{" "}
                    {pagination.total === 1
                      ? t.oneResult
                      : t.results}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isRefreshing && (
                    <span className="hidden items-center gap-1 text-xs text-slate-500 sm:inline-flex">
                      <RotateCw className="h-3 w-3 animate-spin" />
                      {t.refreshing}
                    </span>
                  )}

                  <div className="hidden rounded-lg border border-slate-200 bg-white p-1 lg:flex">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      aria-label={t.viewGrid}
                      aria-pressed={viewMode === "grid"}
                      className={`rounded-md p-2 ${
                        viewMode === "grid"
                          ? "bg-[#092B50] text-white"
                          : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      <Grid2X2 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      aria-label={t.viewList}
                      aria-pressed={viewMode === "list"}
                      className={`rounded-md p-2 ${
                        viewMode === "list"
                          ? "bg-[#092B50] text-white"
                          : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* ERREUR */}

              {error && (
                <div
                  role="alert"
                  className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4"
                >
                  <p className="text-sm font-semibold text-red-700">
                    {t.errorTitle}: {error}
                  </p>

                  <button
                    type="button"
                    onClick={() => void refresh()}
                    className="inline-flex items-center gap-2 text-xs font-bold text-red-700"
                  >
                    <RotateCw className="h-4 w-4" />
                    {t.retry}
                  </button>
                </div>
              )}

              {/* CHARGEMENT */}

              {isLoading && campaigns.length === 0 ? (
                <div
                  className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
                  aria-label={t.loading}
                >
                  {Array.from({ length: 6 }).map(
                    (_, index) => (
                      <div
                        key={index}
                        className="overflow-hidden rounded-[20px] border border-slate-200 bg-white"
                      >
                        <div className="h-[210px] animate-pulse bg-slate-200" />
                        <div className="space-y-4 p-5">
                          <div className="h-5 w-4/5 animate-pulse rounded bg-slate-200" />
                          <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                          <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                          <div className="h-2 w-full animate-pulse rounded bg-slate-100" />
                          <div className="h-11 w-full animate-pulse rounded bg-slate-100" />
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : campaigns.length > 0 ? (
                <div
                  className={
                    viewMode === "list"
                      ? "grid grid-cols-1 gap-5"
                      : "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
                  }
                >
                  {campaigns.map((campaign) => (
                    <CampaignCard
                      key={campaign.id}
                      campaign={campaign}
                      language={language}
                      t={t}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[330px] flex-col items-center justify-center rounded-[20px] border border-slate-200 bg-white px-6 py-12 text-center">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F8FA]">
                    <Search className="h-7 w-7 text-[#0B9BAE]" />
                  </div>

                  <h3 className="text-xl font-extrabold text-[#092B50]">
                    {t.emptyTitle}
                  </h3>

                  <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">
                    {t.emptyDescription}
                  </p>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="mt-6 rounded-xl bg-[#092B50] px-5 py-3 text-sm font-bold text-white"
                    >
                      {t.reset}
                    </button>
                  )}
                </div>
              )}

              {/* PAGINATION */}

              {pagination.totalPages > 1 && (
                <nav
                  aria-label={t.page}
                  className="mt-10 flex flex-wrap items-center justify-center gap-3"
                >
                  <button
                    type="button"
                    disabled={!pagination.hasPreviousPage}
                    onClick={() =>
                      setPage(pagination.page - 1)
                    }
                    className="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-[#092B50] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t.previous}
                  </button>

                  <span className="px-2 text-xs font-bold text-slate-600">
                    {t.page} {pagination.page} {t.of}{" "}
                    {pagination.totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={!pagination.hasNextPage}
                    onClick={() =>
                      setPage(pagination.page + 1)
                    }
                    className="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-[#092B50] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {t.next}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </nav>
              )}
            </div>

            {/* COLONNE LATÉRALE */}

            <aside className="space-y-6">
              {/* CATÉGORIES */}

              <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="flex items-center gap-2 text-base font-extrabold text-[#092B50]">
                  <HeartHandshake className="h-5 w-5 text-[#0B9BAE]" />
                  {t.categories}
                </h3>

                <div className="mt-5 space-y-1">
                  <button
                    type="button"
                    onClick={() => setCategory("")}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm transition-colors ${
                      !filters.category
                        ? "bg-[#E8F8FA] font-bold text-[#087F8E]"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>{t.allCategories}</span>
                    <span>{categories.reduce(
                      (sum, item) =>
                        sum + item.campaignCount,
                      0
                    )}</span>
                  </button>

                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() =>
                        setCategory(category.slug)
                      }
                      className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left text-sm transition-colors ${
                        filters.category === category.slug
                          ? "bg-[#E8F8FA] font-bold text-[#087F8E]"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span>{category.name}</span>
                      <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                        {category.campaignCount}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ENGAGEMENT */}

              <div className="overflow-hidden rounded-[20px] bg-[#092B50] p-6 text-white shadow-[0_12px_35px_rgba(9,43,80,0.15)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                  <ShieldCheck className="h-6 w-6 text-[#59E4EE]" />
                </div>

                <h3 className="mt-5 text-[19px] font-extrabold">
                  {t.commitment}
                </h3>

                <p className="mt-3 text-sm leading-7 text-white/80">
                  {t.commitmentText}
                </p>

                <div className="mt-5 border-t border-white/15 pt-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#59E4EE]" />
                    <div>
                      <p className="text-sm font-bold">
                        {t.transparency}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-white/75">
                        {t.transparencyText}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTUALITÉS */}

              <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="flex items-center gap-2 text-base font-extrabold text-[#092B50]">
                  <CalendarDays className="h-5 w-5 text-[#0B9BAE]" />
                  {t.news}
                </h3>

                <p className="mt-5 rounded-xl bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-500">
                  {t.noNews}
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
