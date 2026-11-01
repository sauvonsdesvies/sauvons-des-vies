
"use client";

import {
  useCallback,
  useMemo,
  useState,
} from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  FileText,
  Heart,
  Images,
  Info,
  MapPin,
  MessageCircle,
  RefreshCw,
  Share2,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import CampaignDonationPanel from "@/components/public/campaigns/CampaignDonationPanel";

import {
  usePublicCampaignDetail,
  type PublicCampaignDetail,
  type PublicCampaignDetailPhoto,
  type PublicCampaignDetailSimilar,
} from "@/hooks/usePublicCampaignDetail";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

// ==========================================================
// FONDATION SAUVONS DES VIES
// PAGE PUBLIQUE — DÉTAIL D'UNE COLLECTE
// ==========================================================
//
// Architecture :
// - Fil d'Ariane
// - Galerie principale
// - Miniatures et navigation
// - Présentation de la campagne
// - Statistiques et progression
// - Partage
// - Panneau de don
// - Onglets de contenu
// - Informations clés
// - Campagnes similaires
// - Responsive PC / tablette / mobile
//
// Les données proviennent exclusivement du service public.
// Aucun don, commentaire ou justificatif fictif.
//
// ==========================================================

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

type Language = "fr" | "en" | "de" | "es";

type DetailTab =
  | "story"
  | "updates"
  | "usage"
  | "transparency"
  | "comments";

export type CampaignDetailPageProps = {
  slug: string;
  initialCampaign: PublicCampaignDetail;

  onDonate?: (
    amount: number,
    campaign: PublicCampaignDetail
  ) => void | Promise<void>;
};

// ----------------------------------------------------------
// TRADUCTIONS
// ----------------------------------------------------------

const translations = {
  fr: {
    home: "Accueil",
    campaigns: "Campagnes",
    urgent: "Urgent",
    photos: "photos",
    location: "Localisation",
    launched: "Début de la collecte",
    deadline: "Date de fin",
    noDeadline: "Non précisée",
    collected: "Collectés",
    goal: "Objectif",
    remaining: "Restants",
    donors: "dons confirmés",
    progress: "de l'objectif atteint",
    donate: "Faire un don maintenant",
    share: "Partager",
    copy: "Copier le lien",
    copied: "Lien copié",
    story: "Notre histoire",
    updates: "Mises à jour",
    usage: "Utilisation des dons",
    transparency: "Transparence",
    comments: "Commentaires",
    keyInfo: "Informations clés",
    beneficiary: "Bénéficiaire",
    country: "Pays",
    category: "Type d'aide",
    support: "Objectif financier",
    deadlineInfo: "Date limite",
    similar: "Campagnes similaires",
    seeAll: "Voir toutes les campagnes",
    seeCampaign: "Voir la collecte",
    readMore: "Lire la suite",
    readLess: "Réduire",
    noUpdates:
      "Aucune mise à jour publiée pour le moment.",
    noUsage:
      "Les informations détaillées sur l'utilisation des dons ne sont pas encore publiées pour cette collecte.",
    noTransparency:
      "Aucun document public de transparence n'est disponible pour le moment.",
    noComments:
      "Les commentaires ne sont pas encore disponibles sur cette plateforme.",
    noSimilar:
      "Aucune campagne similaire disponible actuellement.",
    noImage: "Photo non disponible",
    noDescription:
      "La description détaillée n'est pas encore disponible.",
    noLocation: "Non précisé",
    active: "Collecte en cours",
    completed: "Objectif atteint",
    closed: "Collecte clôturée",
    refresh: "Actualiser",
    retry: "Réessayer",
    loading: "Actualisation...",
    unavailable:
      "Les informations de cette collecte sont temporairement indisponibles.",
    confirmed:
      "Les montants affichés correspondent aux dons confirmés.",
    directPayment:
      "La fondation prévoit de régler directement les établissements de santé après vérification des dossiers.",
    updatesCount: "publication(s)",
    shareMessage: "Découvrez cette collecte solidaire :",
    viewPublication: "Lire la publication",
    galleryPrevious: "Photo précédente",
    galleryNext: "Photo suivante",
    selectPhoto: "Afficher la photo",
    paymentUnavailable:
      "Le parcours de paiement n'est pas encore connecté.",
  },

  en: {
    home: "Home",
    campaigns: "Campaigns",
    urgent: "Urgent",
    photos: "photos",
    location: "Location",
    launched: "Campaign start",
    deadline: "End date",
    noDeadline: "Not specified",
    collected: "Raised",
    goal: "Goal",
    remaining: "Remaining",
    donors: "confirmed donations",
    progress: "of goal reached",
    donate: "Donate now",
    share: "Share",
    copy: "Copy link",
    copied: "Link copied",
    story: "Our story",
    updates: "Updates",
    usage: "Use of donations",
    transparency: "Transparency",
    comments: "Comments",
    keyInfo: "Key information",
    beneficiary: "Beneficiary",
    country: "Country",
    category: "Type of support",
    support: "Funding goal",
    deadlineInfo: "Deadline",
    similar: "Similar campaigns",
    seeAll: "View all campaigns",
    seeCampaign: "View campaign",
    readMore: "Read more",
    readLess: "Show less",
    noUpdates:
      "No updates have been published yet.",
    noUsage:
      "Detailed information about the use of donations has not yet been published for this campaign.",
    noTransparency:
      "No public transparency documents are available yet.",
    noComments:
      "Comments are not yet available on this platform.",
    noSimilar:
      "No similar campaigns are currently available.",
    noImage: "Photo unavailable",
    noDescription:
      "A detailed description is not yet available.",
    noLocation: "Not specified",
    active: "Campaign active",
    completed: "Goal reached",
    closed: "Campaign closed",
    refresh: "Refresh",
    retry: "Try again",
    loading: "Refreshing...",
    unavailable:
      "Campaign information is temporarily unavailable.",
    confirmed:
      "Displayed amounts are based on confirmed donations.",
    directPayment:
      "The foundation plans to pay healthcare facilities directly after verifying applications.",
    updatesCount: "publication(s)",
    shareMessage: "Discover this fundraising campaign:",
    viewPublication: "Read update",
    galleryPrevious: "Previous photo",
    galleryNext: "Next photo",
    selectPhoto: "Show photo",
    paymentUnavailable:
      "The payment process has not yet been connected.",
  },

  de: {
    home: "Startseite",
    campaigns: "Kampagnen",
    urgent: "Dringend",
    photos: "Fotos",
    location: "Standort",
    launched: "Beginn der Kampagne",
    deadline: "Enddatum",
    noDeadline: "Nicht angegeben",
    collected: "Gesammelt",
    goal: "Spendenziel",
    remaining: "Verbleibend",
    donors: "bestätigte Spenden",
    progress: "des Ziels erreicht",
    donate: "Jetzt spenden",
    share: "Teilen",
    copy: "Link kopieren",
    copied: "Link kopiert",
    story: "Unsere Geschichte",
    updates: "Neuigkeiten",
    usage: "Verwendung der Spenden",
    transparency: "Transparenz",
    comments: "Kommentare",
    keyInfo: "Wichtige Informationen",
    beneficiary: "Begünstigte Person",
    country: "Land",
    category: "Art der Hilfe",
    support: "Spendenziel",
    deadlineInfo: "Frist",
    similar: "Ähnliche Kampagnen",
    seeAll: "Alle Kampagnen ansehen",
    seeCampaign: "Kampagne ansehen",
    readMore: "Mehr lesen",
    readLess: "Weniger anzeigen",
    noUpdates:
      "Noch keine Neuigkeiten veröffentlicht.",
    noUsage:
      "Detaillierte Angaben zur Verwendung der Spenden wurden noch nicht veröffentlicht.",
    noTransparency:
      "Derzeit sind keine öffentlichen Transparenzdokumente verfügbar.",
    noComments:
      "Kommentare sind auf dieser Plattform noch nicht verfügbar.",
    noSimilar:
      "Derzeit sind keine ähnlichen Kampagnen verfügbar.",
    noImage: "Foto nicht verfügbar",
    noDescription:
      "Eine ausführliche Beschreibung ist noch nicht verfügbar.",
    noLocation: "Nicht angegeben",
    active: "Kampagne läuft",
    completed: "Ziel erreicht",
    closed: "Kampagne beendet",
    refresh: "Aktualisieren",
    retry: "Erneut versuchen",
    loading: "Wird aktualisiert...",
    unavailable:
      "Die Kampagneninformationen sind vorübergehend nicht verfügbar.",
    confirmed:
      "Die angezeigten Beträge basieren auf bestätigten Spenden.",
    directPayment:
      "Die Stiftung plant, Gesundheitseinrichtungen nach Prüfung der Anträge direkt zu bezahlen.",
    updatesCount: "Veröffentlichung(en)",
    shareMessage: "Entdecken Sie diese Spendenkampagne:",
    viewPublication: "Neuigkeit lesen",
    galleryPrevious: "Vorheriges Foto",
    galleryNext: "Nächstes Foto",
    selectPhoto: "Foto anzeigen",
    paymentUnavailable:
      "Der Zahlungsvorgang ist noch nicht angebunden.",
  },

  es: {
    home: "Inicio",
    campaigns: "Campañas",
    urgent: "Urgente",
    photos: "fotos",
    location: "Ubicación",
    launched: "Inicio de la campaña",
    deadline: "Fecha de finalización",
    noDeadline: "No especificada",
    collected: "Recaudado",
    goal: "Objetivo",
    remaining: "Restante",
    donors: "donaciones confirmadas",
    progress: "del objetivo alcanzado",
    donate: "Donar ahora",
    share: "Compartir",
    copy: "Copiar enlace",
    copied: "Enlace copiado",
    story: "Nuestra historia",
    updates: "Actualizaciones",
    usage: "Uso de donaciones",
    transparency: "Transparencia",
    comments: "Comentarios",
    keyInfo: "Información clave",
    beneficiary: "Beneficiario",
    country: "País",
    category: "Tipo de ayuda",
    support: "Objetivo financiero",
    deadlineInfo: "Fecha límite",
    similar: "Campañas similares",
    seeAll: "Ver todas las campañas",
    seeCampaign: "Ver campaña",
    readMore: "Leer más",
    readLess: "Leer menos",
    noUpdates:
      "Todavía no se han publicado actualizaciones.",
    noUsage:
      "Aún no se ha publicado información detallada sobre el uso de las donaciones.",
    noTransparency:
      "Todavía no hay documentos públicos de transparencia.",
    noComments:
      "Los comentarios aún no están disponibles.",
    noSimilar:
      "No hay campañas similares disponibles.",
    noImage: "Foto no disponible",
    noDescription:
      "La descripción detallada aún no está disponible.",
    noLocation: "No especificado",
    active: "Campaña activa",
    completed: "Objetivo alcanzado",
    closed: "Campaña cerrada",
    refresh: "Actualizar",
    retry: "Reintentar",
    loading: "Actualizando...",
    unavailable:
      "La información de la campaña no está disponible temporalmente.",
    confirmed:
      "Los importes mostrados corresponden a donaciones confirmadas.",
    directPayment:
      "La fundación prevé pagar directamente a los centros sanitarios tras verificar las solicitudes.",
    updatesCount: "publicación(es)",
    shareMessage: "Descubre esta campaña solidaria:",
    viewPublication: "Leer actualización",
    galleryPrevious: "Foto anterior",
    galleryNext: "Foto siguiente",
    selectPhoto: "Mostrar foto",
    paymentUnavailable:
      "El proceso de pago aún no está conectado.",
  },
} as const;

// ----------------------------------------------------------
// OUTILS
// ----------------------------------------------------------

function resolveLanguage(value: unknown): Language {
  if (
    value === "en" ||
    value === "de" ||
    value === "es"
  ) {
    return value;
  }

  return "fr";
}

function localeForLanguage(language: Language): string {
  const locales: Record<Language, string> = {
    fr: "fr-FR",
    en: "en-US",
    de: "de-DE",
    es: "es-ES",
  };

  return locales[language];
}

function formatMoney(
  amount: number,
  currency: string,
  language: Language
): string {
  try {
    return new Intl.NumberFormat(
      localeForLanguage(language),
      {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }
    ).format(amount);
  } catch {
    return `${new Intl.NumberFormat(
      localeForLanguage(language)
    ).format(amount)} ${currency}`;
  }
}

function formatDate(
  date: string | null,
  language: Language,
  fallback: string
): string {
  if (!date) {
    return fallback;
  }

  const parsed = new Date(date);

  if (!Number.isFinite(parsed.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat(
    localeForLanguage(language),
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ).format(parsed);
}

function getCampaignUrl(slug: string): string {
  const pathname = `/campagnes/${encodeURIComponent(
    slug
  )}`;

  if (typeof window === "undefined") {
    return pathname;
  }

  return new URL(
    pathname,
    window.location.origin
  ).toString();
}

function getImageSource(
  value: string | null | undefined
): string | null {
  if (!value) {
    return null;
  }

  const source = value.trim();

  if (
    source.startsWith("https://") ||
    (source.startsWith("/") &&
      !source.startsWith("//"))
  ) {
    return source;
  }

  return null;
}

function isDeadlineExpired(
  endDate: string | null
): boolean {
  if (!endDate) {
    return false;
  }

  const timestamp = Date.parse(endDate);

  return (
    Number.isFinite(timestamp) &&
    timestamp < Date.now()
  );
}

// ----------------------------------------------------------
// IMAGE DE CAMPAGNE
// ----------------------------------------------------------

function CampaignImage({
  src,
  alt,
  className = "",
  priority = false,
  sizes = "100vw",
}: {
  src: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  if (!src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-[#E7F5F8] to-[#DCEAF2] ${className}`}
      >
        <Images className="h-12 w-12 text-[#85B5C4]" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      unoptimized
      className={`object-contain ${className}`}
    />
  );
}

// ----------------------------------------------------------
// GALERIE
// ----------------------------------------------------------

function CampaignGallery({
  campaign,
  photos,
  language,
}: {
  campaign: PublicCampaignDetail;
  photos: PublicCampaignDetailPhoto[];
  language: Language;
}) {
  const t = translations[language];

  const [activeIndex, setActiveIndex] =
    useState(0);

  const safeIndex =
    photos.length > 0
      ? Math.min(activeIndex, photos.length - 1)
      : 0;

  const activePhoto = photos[safeIndex];

  const goPrevious = useCallback(() => {
    setActiveIndex((current) =>
      photos.length > 0
        ? (current - 1 + photos.length) %
          photos.length
        : 0
    );
  }, [photos.length]);

  const goNext = useCallback(() => {
    setActiveIndex((current) =>
      photos.length > 0
        ? (current + 1) % photos.length
        : 0
    );
  }, [photos.length]);

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-[#EAF3F7] sm:aspect-[16/9] lg:aspect-[4/3]">
        <CampaignImage
          src={getImageSource(
            activePhoto?.imageUrl ??
              campaign.imageUrl
          )}
          alt={`${campaign.title} — ${
            safeIndex + 1
          }`}
          priority
          sizes="(max-width: 1024px) 100vw, 42vw"
        />

        {campaign.isUrgent &&
          campaign.status === "ACTIVE" && (
            <span className="absolute left-4 top-4 rounded-full bg-[#E71E3D] px-4 py-2 text-xs font-extrabold text-white shadow-lg">
              {t.urgent}
            </span>
          )}

        {photos.length > 0 && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-[#092B50]/85 px-3 py-2 text-xs font-bold text-white">
            <Images className="h-4 w-4" />
            {safeIndex + 1}/{photos.length}
          </div>
        )}

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrevious}
              aria-label={t.galleryPrevious}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#092B50] shadow-md transition hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={goNext}
              aria-label={t.galleryNext}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#092B50] shadow-md transition hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2 sm:gap-3">
          {photos.slice(0, 5).map((photo, index) => {
            const selected = index === safeIndex;

            return (
              <button
                key={photo.id}
                type="button"
                onClick={() =>
                  setActiveIndex(index)
                }
                aria-label={`${t.selectPhoto} ${
                  index + 1
                }`}
                aria-pressed={selected}
                className={[
                  "relative aspect-[4/3] overflow-hidden rounded-lg border-2 transition",
                  selected
                    ? "border-[#0BC2D4]"
                    : "border-transparent hover:border-slate-300",
                ].join(" ")}
              >
                <CampaignImage
                  src={getImageSource(
                    photo.imageUrl
                  )}
                  alt={`${campaign.title} — ${
                    index + 1
                  }`}
                  sizes="120px"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------
// PROGRESSION
// ----------------------------------------------------------

function CampaignProgress({
  campaign,
  language,
}: {
  campaign: PublicCampaignDetail;
  language: Language;
}) {
  const t = translations[language];

  const progress = Math.max(
    0,
    Math.min(100, campaign.progressPercentage)
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: t.collected,
            value: campaign.collectedAmount,
          },
          {
            label: t.goal,
            value: campaign.targetAmount,
          },
          {
            label: t.remaining,
            value: campaign.remainingAmount,
          },
        ].map((item) => (
          <div key={item.label} className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500">
              {item.label}
            </p>

            <p className="mt-1 break-words text-[13px] font-extrabold text-[#092B50] sm:text-[15px]">
              {formatMoney(
                item.value,
                campaign.currency,
                language
              )}
            </p>
          </div>
        ))}
      </div>

      <div
        className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label={t.progress}
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-[#0BC2D4] transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-slate-500">
          {campaign.donorCount} {t.donors}
        </span>

        <span className="font-extrabold text-[#0B9BAE]">
          {progress}%
        </span>
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// PARTAGE
// ----------------------------------------------------------

function CampaignSharing({
  campaign,
  language,
}: {
  campaign: PublicCampaignDetail;
  language: Language;
}) {
  const t = translations[language];

  const [copied, setCopied] = useState(false);

  const shareUrl = getCampaignUrl(
    campaign.slug
  );

  const encodedUrl = encodeURIComponent(shareUrl);

  const encodedMessage = encodeURIComponent(
    `${t.shareMessage} ${campaign.title}\n${shareUrl}`
  );

  const whatsappUrl =
    `https://wa.me/?text=${encodedMessage}`;

  const facebookUrl =
    `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(
        getCampaignUrl(campaign.slug)
      );

      setCopied(true);
    } catch {
      setCopied(false);
    }
  }, [campaign.slug]);

  const nativeShare = useCallback(async () => {
    const url = getCampaignUrl(campaign.slug);

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: campaign.title,
          text: campaign.shortDescription,
          url,
        });
      } catch {
        // L'utilisateur peut annuler le partage.
      }

      return;
    }

    await copyLink();
  }, [
    campaign.title,
    campaign.shortDescription,
    campaign.slug,
    copyLink,
  ]);

  const buttonClass =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-[#092B50] transition hover:border-[#0BC2D4] hover:bg-[#F2FBFC]";

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => void nativeShare()}
        className={buttonClass}
      >
        <Share2 className="h-4 w-4" />
        {t.share}
      </button>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
      >
        <MessageCircle className="h-4 w-4 text-[#169D58]" />
        WhatsApp
      </a>

      <a
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
      >
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1877F2] text-[12px] font-black text-white">
          f
        </span>
        Facebook
      </a>

      <button
        type="button"
        onClick={() => void copyLink()}
        className={buttonClass}
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        {copied ? t.copied : t.copy}
      </button>
    </div>
  );
}

// ----------------------------------------------------------
// CAMPAGNE SIMILAIRE
// ----------------------------------------------------------

function SimilarCampaignCard({
  campaign,
  language,
}: {
  campaign: PublicCampaignDetailSimilar;
  language: Language;
}) {
  const t = translations[language];

  return (
    <Link
      href={`/campagnes/${encodeURIComponent(
        campaign.slug
      )}`}
      className="group flex gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-[#0BC2D4] hover:shadow-sm"
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
        <CampaignImage
          src={getImageSource(
            campaign.imageUrl
          )}
          alt={campaign.title}
          sizes="96px"
        />
      </div>

      <div className="min-w-0 flex-1">
        {campaign.category && (
          <p className="truncate text-[10px] font-bold text-[#0B9BAE]">
            {campaign.category.name}
          </p>
        )}

        <h3 className="mt-1 line-clamp-2 text-[12px] font-extrabold leading-4 text-[#092B50] group-hover:text-[#0B9BAE]">
          {campaign.title}
        </h3>

        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#0BC2D4]"
            style={{
              width: `${Math.min(
                100,
                Math.max(
                  0,
                  campaign.progressPercentage
                )
              )}%`,
            }}
          />
        </div>

        <p className="mt-1 text-[10px] font-semibold text-slate-500">
          {formatMoney(
            campaign.collectedAmount,
            campaign.currency,
            language
          )}
          {" / "}
          {formatMoney(
            campaign.targetAmount,
            campaign.currency,
            language
          )}
        </p>

        <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-[#0B9BAE]">
          {t.seeCampaign}
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}

// ----------------------------------------------------------
// ONGLETS
// ----------------------------------------------------------

function CampaignTabs({
  campaign,
  language,
}: {
  campaign: PublicCampaignDetail;
  language: Language;
}) {
  const t = translations[language];

  const [activeTab, setActiveTab] =
    useState<DetailTab>("story");

  const tabs: Array<{
    id: DetailTab;
    label: string;
  }> = [
    { id: "story", label: t.story },
    {
      id: "updates",
      label: `${t.updates} (${campaign.updates.length})`,
    },
    { id: "usage", label: t.usage },
    {
      id: "transparency",
      label: t.transparency,
    },
    { id: "comments", label: t.comments },
  ];

  const beneficiaryName = campaign.beneficiary
    ? [
        campaign.beneficiary.firstName,
        campaign.beneficiary.lastName,
      ]
        .filter(Boolean)
        .join(" ")
    : null;

  const location = [
    campaign.beneficiary?.city,
    campaign.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div
        role="tablist"
        aria-label={t.story}
        className="flex gap-1 overflow-x-auto border-b border-slate-200 px-3 pt-3 sm:px-5"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() =>
              setActiveTab(tab.id)
            }
            className={[
              "shrink-0 border-b-[3px] px-3 py-3 text-xs font-extrabold transition-colors sm:px-4",
              activeTab === tab.id
                ? "border-[#0BC2D4] text-[#092B50]"
                : "border-transparent text-slate-500 hover:text-[#092B50]",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        className="p-5 sm:p-7"
      >
        {activeTab === "story" && (
          <div className="space-y-6">
            <div className="whitespace-pre-line break-words text-[14px] leading-7 text-slate-700">
              {campaign.description ||
                t.noDescription}
            </div>

            <div className="rounded-2xl border border-[#CDECF2] bg-[#F0FAFC] p-5">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-[#0B9BAE]" />

                <h3 className="text-[16px] font-extrabold text-[#092B50]">
                  {t.keyInfo}
                </h3>
              </div>

              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  {
                    label: t.beneficiary,
                    value:
                      beneficiaryName ||
                      t.noLocation,
                  },
                  {
                    label: t.location,
                    value:
                      location ||
                      t.noLocation,
                  },
                  {
                    label: t.category,
                    value:
                      campaign.category?.name ||
                      t.noLocation,
                  },
                  {
                    label: t.support,
                    value: formatMoney(
                      campaign.targetAmount,
                      campaign.currency,
                      language
                    ),
                  },
                  {
                    label: t.deadlineInfo,
                    value: formatDate(
                      campaign.endDate,
                      language,
                      t.noDeadline
                    ),
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <dt className="text-[11px] font-semibold text-slate-500">
                      {item.label}
                    </dt>

                    <dd className="mt-1 text-[13px] font-extrabold text-[#092B50]">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#0B9BAE]" />

                <p className="text-xs leading-5 text-slate-600">
                  {t.confirmed}
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                <Heart className="mt-0.5 h-5 w-5 shrink-0 text-[#0B9BAE]" />

                <p className="text-xs leading-5 text-slate-600">
                  {t.directPayment}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "updates" && (
          <div>
            {campaign.updates.length === 0 ? (
              <div className="py-10 text-center">
                <FileText className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm text-slate-500">
                  {t.noUpdates}
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {campaign.updates.map((update) => (
                  <article
                    key={update.id}
                    className="rounded-xl border border-slate-200 p-4 sm:p-5"
                  >
                    <div className="flex gap-4">
                      {getImageSource(
                        update.imageUrl
                      ) && (
                        <div className="relative hidden h-28 w-36 shrink-0 overflow-hidden rounded-lg sm:block">
                          <CampaignImage
                            src={getImageSource(
                              update.imageUrl
                            )}
                            alt={update.title}
                            sizes="144px"
                          />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-slate-500">
                          {formatDate(
                            update.publishedAt,
                            language,
                            ""
                          )}
                        </p>

                        <h3 className="mt-1 text-base font-extrabold text-[#092B50]">
                          {update.title}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {update.shortDescription}
                        </p>

                        <Link
                          href={`/actualites/${encodeURIComponent(
                            update.slug
                          )}`}
                          className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-[#0B9BAE] hover:underline"
                        >
                          {t.viewPublication}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "usage" && (
          <div className="py-8 text-center">
            <Wallet className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-slate-600">
              {t.noUsage}
            </p>
          </div>
        )}

        {activeTab === "transparency" && (
          <div className="py-8 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-slate-600">
              {t.noTransparency}
            </p>
          </div>
        )}

        {activeTab === "comments" && (
          <div className="py-8 text-center">
            <MessageCircle className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-slate-600">
              {t.noComments}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// ----------------------------------------------------------
// COMPOSANT PRINCIPAL
// ----------------------------------------------------------

export default function CampaignDetailPage({
  slug,
  initialCampaign,
  onDonate,
}: CampaignDetailPageProps) {
  const router = useRouter();
  const translationContext =
    useTranslation();

  const language = resolveLanguage(
    translationContext.language
  );

  const t = translations[language];

  const {
    campaign: liveCampaign,
    photos,
    similarCampaigns,
    isLoading,
    isRefreshing,
    error,
    refresh,
  } = usePublicCampaignDetail({
    slug,
    initialCampaign,
    refreshInterval: 10_000,
    enabled: true,
  });

  const campaign = liveCampaign;

  const [descriptionExpanded, setDescriptionExpanded] =
    useState(false);

  const [donationNotice, setDonationNotice] =
    useState(false);

  const galleryPhotos = useMemo(() => {
    if (photos.length > 0) {
      return photos;
    }

    if (campaign?.imageUrl) {
      return [
        {
          id: `main-${campaign.id}`,
          imageUrl: campaign.imageUrl,
          position: 0,
        },
      ];
    }

    return [];
  }, [photos, campaign]);

  const scrollToDonation = useCallback(() => {
    if (campaign?.id) router.push(`/faire-un-don?campagne=${encodeURIComponent(campaign.id)}`);
  }, [campaign, router]);

  const handleDonate = useCallback(
    async (
      amount: number,
      selectedCampaign: PublicCampaignDetail
    ) => {
      if (!onDonate) {
        router.push(`/faire-un-don?campagne=${encodeURIComponent(selectedCampaign.id)}&montant=${amount}`);
        return;
      }

      setDonationNotice(false);
      await onDonate(amount, selectedCampaign);
    },
    [onDonate, router]
  );

  if (!campaign) {
    return (
      <main className="mx-auto max-w-none px-4 py-20 text-center">
        <Info className="mx-auto h-10 w-10 text-slate-400" />

        <p className="mt-4 text-sm text-slate-600">
          {error?.message || t.unavailable}
        </p>

        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#092B50] px-5 py-3 text-sm font-bold text-white"
        >
          <RefreshCw className="h-4 w-4" />
          {t.retry}
        </button>
      </main>
    );
  }

  const location = [
    campaign.beneficiary?.city,
    campaign.country,
  ]
    .filter(Boolean)
    .join(", ");

  const statusLabel =
    campaign.status === "COMPLETED"
      ? t.completed
      : campaign.status === "CLOSED"
        ? t.closed
        : t.active;

  return (
    <main className="min-h-screen bg-[#F7F9FC]">
      <div className="mx-auto max-w-none px-4 pb-6 pt-4 sm:px-6 lg:px-8">
        {/* FIL D'ARIANE */}

        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-2 text-[12px] text-slate-500"
        >
          <Link href="/" className="hover:text-[#0B9BAE]">
            {t.home}
          </Link>

          <ChevronRight className="h-3.5 w-3.5" />

          <Link
            href="/campagnes"
            className="hover:text-[#0B9BAE]"
          >
            {t.campaigns}
          </Link>

          {campaign.category && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />

              <span>
                {campaign.category.name}
              </span>
            </>
          )}

          <ChevronRight className="h-3.5 w-3.5" />

          <span className="font-semibold text-[#092B50]">
            {campaign.title}
          </span>
        </nav>

        {/* ERREUR NON BLOQUANTE */}

        {error && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            <span>{error.message}</span>

            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex items-center gap-1 font-bold underline"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t.retry}
            </button>
          </div>
        )}

        {/* GRILLE PRINCIPALE */}

        <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_340px] lg:items-start">
          {/* GALERIE */}

          <div className="min-w-0">
            <CampaignGallery
              campaign={campaign}
              photos={galleryPhotos}
              language={language}
            />
          </div>

          {/* INFORMATIONS */}

          <div className="min-w-0">
            {campaign.category && (
              <span className="inline-flex rounded-full bg-[#E7F7FA] px-3 py-1.5 text-[11px] font-extrabold text-[#087E8E]">
                {campaign.category.name}
              </span>
            )}

            <h1 className="mt-4 text-[27px] font-black leading-[1.2] tracking-tight text-[#092B50] sm:text-[32px] lg:text-[29px]">
              {campaign.title}
            </h1>

            <div className="mt-4">
              <p
                className={[
                  "text-[14px] leading-7 text-slate-600",
                  !descriptionExpanded &&
                    "line-clamp-4",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {campaign.shortDescription ||
                  campaign.description ||
                  t.noDescription}
              </p>

              {(campaign.shortDescription ||
                campaign.description).length >
                200 && (
                <button
                  type="button"
                  onClick={() =>
                    setDescriptionExpanded(
                      (value) => !value
                    )
                  }
                  className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-[#0B9BAE]"
                >
                  {descriptionExpanded
                    ? t.readLess
                    : t.readMore}

                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      descriptionExpanded
                        ? "rotate-180"
                        : ""
                    }`}
                  />
                </button>
              )}
            </div>

            {/* LOCALISATION ET DATES */}

            <div className="mt-5 space-y-3 border-y border-slate-200 py-5">
              <div className="flex items-start gap-2 text-[12px] text-slate-600">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#0B9BAE]" />

                <span>
                  {location || t.noLocation}
                </span>
              </div>

              <div className="flex items-start gap-2 text-[12px] text-slate-600">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#0B9BAE]" />

                <span>
                  {t.launched} :{" "}
                  <strong>
                    {formatDate(
                      campaign.startDate ??
                        campaign.publishedAt,
                      language,
                      t.noDeadline
                    )}
                  </strong>
                </span>
              </div>

              <div
                className={`flex items-start gap-2 text-[12px] ${
                  isDeadlineExpired(
                    campaign.endDate
                  )
                    ? "text-[#E71E3D]"
                    : "text-slate-600"
                }`}
              >
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />

                <span>
                  {t.deadline} :{" "}
                  <strong>
                    {formatDate(
                      campaign.endDate,
                      language,
                      t.noDeadline
                    )}
                  </strong>
                </span>
              </div>
            </div>

            <div className="mt-5">
              <CampaignProgress
                campaign={campaign}
                language={language}
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-[12px] font-semibold text-slate-500">
                {statusLabel}
              </span>

              <button
                type="button"
                onClick={() => void refresh()}
                disabled={isRefreshing || isLoading}
                aria-label={t.refresh}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0B9BAE] disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    isRefreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />

                {isRefreshing
                  ? t.loading
                  : t.refresh}
              </button>
            </div>

            {/* BOUTON MOBILE / PC */}

            <button
              type="button"
              disabled={
                campaign.status !== "ACTIVE"
              }
              onClick={scrollToDonation}
              className="mt-5 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-[#E71E3D] px-5 text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(231,30,61,0.18)] transition hover:bg-[#C91834] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Heart className="h-4 w-4" />
              {t.donate}
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="mt-5">
              <CampaignSharing
                campaign={campaign}
                language={language}
              />
            </div>
          </div>

          {/* PANNEAU DONATION DESKTOP */}

          <aside
            id="campaign-donation-panel"
            className="min-w-0 scroll-mt-24 lg:row-span-2"
          >
            <CampaignDonationPanel
              campaign={campaign}
              onDonate={handleDonate}
            />

            {donationNotice && (
              <div
                role="status"
                className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800"
              >
                {t.paymentUnavailable}
              </div>
            )}

            {/* CAMPAGNES SIMILAIRES */}

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-[16px] font-extrabold text-[#092B50]">
                  {t.similar}
                </h2>

                <Link
                  href="/campagnes"
                  className="text-[11px] font-bold text-[#0B9BAE] hover:underline"
                >
                  {t.seeAll}
                </Link>
              </div>

              {similarCampaigns.length > 0 ? (
                <div className="space-y-3">
                  {similarCampaigns.map(
                    (similar) => (
                      <SimilarCampaignCard
                        key={similar.id}
                        campaign={similar}
                        language={language}
                      />
                    )
                  )}
                </div>
              ) : (
                <p className="text-xs leading-6 text-slate-500">
                  {t.noSimilar}
                </p>
              )}
            </div>
          </aside>

          {/* ONGLETS — SOUS GALERIE ET DESCRIPTION */}

          <div className="min-w-0 lg:col-span-2">
            <CampaignTabs
              campaign={campaign}
              language={language}
            />
          </div>
        </div>

        {/* LIEN RETOUR */}

        <div className="mt-5">
          <Link
            href="/campagnes"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#092B50] hover:text-[#0B9BAE]"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.seeAll}
          </Link>
        </div>
      </div>
    </main>
  );
}

export type {
  CampaignDetailPageProps as PublicCampaignDetailPageProps,
};
