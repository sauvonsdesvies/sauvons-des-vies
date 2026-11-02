"use client";

import { currencyUnit } from "@/lib/campaigns/currencies";
import { formatCfaAmount } from "@/lib/campaigns/currencies";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Heart,
  LockKeyhole,
  Share2,
  ShieldCheck,
  UsersRound,
  Wallet,
} from "lucide-react";

import type {
  PublicCampaignDetail,
} from "@/hooks/usePublicCampaignDetail";

import {
  useTranslation,
} from "@/lib/i18n/LanguageProvider";

// ==========================================================
// FONDATION SAUVONS DES VIES
// PANNEAU PUBLIC — FAIRE UN DON
// ==========================================================
//
// Composant : CampaignDonationPanel
//
// Responsabilités :
// - Statistiques réelles de collecte
// - Barre de progression
// - Montants prédéfinis
// - Montant personnalisé
// - Validation du montant
// - Bouton de don
// - Partage de campagne
// - Copie du lien
// - Responsive PC et mobile
//
// IMPORTANT :
// Ce composant ne traite pas directement les paiements.
// Il transmet le montant sélectionné au parcours sécurisé
// via la fonction onDonate.
//
// Aucun paiement fictif.
// Aucune confirmation de don simulée.
//
// ==========================================================

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

type Language = "fr" | "en" | "de" | "es";

export type CampaignDonationPanelProps = {
  campaign: PublicCampaignDetail;

  onDonate?: (
    amount: number,
    campaign: PublicCampaignDetail
  ) => void | Promise<void>;

  className?: string;

  compact?: boolean;
};

// ----------------------------------------------------------
// CONSTANTES
// ----------------------------------------------------------

const DEFAULT_AMOUNTS_XOF = [
  1_000,
  2_500,
  5_000,
  10_000,
  25_000,
  50_000,
] as const;

const DEFAULT_AMOUNTS_OTHER = [
  10,
  25,
  50,
  100,
  200,
] as const;

// Montant minimal de l'interface.
//
// Le prestataire de paiement et le serveur doivent
// effectuer leur propre validation avant toute transaction.

const MIN_DONATION_XOF = 100;
const MIN_DONATION_OTHER = 1;

// ----------------------------------------------------------
// TRADUCTIONS
// ----------------------------------------------------------

const translations = {
  fr: {
    support: "Soutenir cette collecte",
    subtitle:
      "Votre contribution peut faire une différence.",
    collected: "Collectés",
    goal: "Objectif",
    remaining: "Restants",
    donors: "donateurs",
    oneDonor: "donateur",
    progress: "de l'objectif atteint",
    daysLeft: "jours restants",
    oneDayLeft: "jour restant",
    noDeadline: "Collecte en cours",
    completed: "Objectif atteint",
    closed: "Collecte clôturée",
    urgent: "Collecte urgente",
    selectAmount: "Choisissez votre montant",
    customAmount: "Autre montant",
    amountPlaceholder: "Saisir un montant",
    donate: "Faire un don maintenant",
    processing: "Traitement...",
    share: "Partager cette collecte",
    copyLink: "Copier le lien",
    copied: "Lien copié",
    security: "Paiement sécurisé",
    securityDescription:
      "Vos informations de paiement seront traitées par un prestataire sécurisé.",
    transparency: "Collecte transparente",
    transparencyDescription:
      "Les montants affichés proviennent des dons confirmés.",
    amountRequired:
      "Veuillez sélectionner ou saisir un montant.",
    invalidAmount:
      "Veuillez saisir un montant valide.",
    minimumAmount:
      "Le montant doit être supérieur ou égal à",
    unavailable:
      "Le paiement en ligne n'est pas encore disponible pour cette collecte.",
    donationError:
      "Impossible de lancer le don. Veuillez réessayer.",
    unavailableStatus:
      "Cette collecte n'accepte actuellement plus de dons.",
  },

  en: {
    support: "Support this campaign",
    subtitle:
      "Your contribution can make a difference.",
    collected: "Raised",
    goal: "Goal",
    remaining: "Remaining",
    donors: "donors",
    oneDonor: "donor",
    progress: "of the goal reached",
    daysLeft: "days left",
    oneDayLeft: "day left",
    noDeadline: "Campaign active",
    completed: "Goal reached",
    closed: "Campaign closed",
    urgent: "Urgent campaign",
    selectAmount: "Choose your amount",
    customAmount: "Other amount",
    amountPlaceholder: "Enter an amount",
    donate: "Donate now",
    processing: "Processing...",
    share: "Share this campaign",
    copyLink: "Copy link",
    copied: "Link copied",
    security: "Secure payment",
    securityDescription:
      "Your payment information will be processed by a secure provider.",
    transparency: "Transparent fundraising",
    transparencyDescription:
      "Displayed amounts are based on confirmed donations.",
    amountRequired:
      "Please select or enter an amount.",
    invalidAmount:
      "Please enter a valid amount.",
    minimumAmount:
      "The amount must be at least",
    unavailable:
      "Online payment is not yet available for this campaign.",
    donationError:
      "Unable to start the donation. Please try again.",
    unavailableStatus:
      "This campaign is no longer accepting donations.",
  },

  de: {
    support: "Diese Kampagne unterstützen",
    subtitle:
      "Ihr Beitrag kann etwas bewirken.",
    collected: "Gesammelt",
    goal: "Spendenziel",
    remaining: "Verbleibend",
    donors: "Spender",
    oneDonor: "Spender",
    progress: "des Ziels erreicht",
    daysLeft: "Tage verbleibend",
    oneDayLeft: "Tag verbleibend",
    noDeadline: "Kampagne aktiv",
    completed: "Ziel erreicht",
    closed: "Kampagne geschlossen",
    urgent: "Dringende Kampagne",
    selectAmount: "Betrag auswählen",
    customAmount: "Anderer Betrag",
    amountPlaceholder: "Betrag eingeben",
    donate: "Jetzt spenden",
    processing: "Verarbeitung...",
    share: "Kampagne teilen",
    copyLink: "Link kopieren",
    copied: "Link kopiert",
    security: "Sichere Zahlung",
    securityDescription:
      "Ihre Zahlungsdaten werden von einem sicheren Anbieter verarbeitet.",
    transparency: "Transparente Spendenaktion",
    transparencyDescription:
      "Die angezeigten Beträge basieren auf bestätigten Spenden.",
    amountRequired:
      "Bitte wählen Sie einen Betrag aus.",
    invalidAmount:
      "Bitte geben Sie einen gültigen Betrag ein.",
    minimumAmount:
      "Der Betrag muss mindestens betragen:",
    unavailable:
      "Online-Zahlungen sind für diese Kampagne noch nicht verfügbar.",
    donationError:
      "Die Spende konnte nicht gestartet werden. Bitte versuchen Sie es erneut.",
    unavailableStatus:
      "Diese Kampagne nimmt derzeit keine Spenden mehr an.",
  },

  es: {
    support: "Apoyar esta campaña",
    subtitle:
      "Tu contribución puede marcar la diferencia.",
    collected: "Recaudado",
    goal: "Objetivo",
    remaining: "Restante",
    donors: "donantes",
    oneDonor: "donante",
    progress: "del objetivo alcanzado",
    daysLeft: "días restantes",
    oneDayLeft: "día restante",
    noDeadline: "Campaña activa",
    completed: "Objetivo alcanzado",
    closed: "Campaña cerrada",
    urgent: "Campaña urgente",
    selectAmount: "Elige tu importe",
    customAmount: "Otro importe",
    amountPlaceholder: "Introduce un importe",
    donate: "Donar ahora",
    processing: "Procesando...",
    share: "Compartir esta campaña",
    copyLink: "Copiar enlace",
    copied: "Enlace copiado",
    security: "Pago seguro",
    securityDescription:
      "Tus datos de pago serán procesados por un proveedor seguro.",
    transparency: "Recaudación transparente",
    transparencyDescription:
      "Los importes mostrados provienen de donaciones confirmadas.",
    amountRequired:
      "Selecciona o introduce un importe.",
    invalidAmount:
      "Introduce un importe válido.",
    minimumAmount:
      "El importe debe ser como mínimo",
    unavailable:
      "El pago en línea aún no está disponible para esta campaña.",
    donationError:
      "No se pudo iniciar la donación. Inténtalo de nuevo.",
    unavailableStatus:
      "Esta campaña ya no acepta donaciones.",
  },
} as const;

// ----------------------------------------------------------
// UTILITAIRES
// ----------------------------------------------------------

function resolveLanguage(
  value: unknown
): Language {
  if (
    value === "en" ||
    value === "de" ||
    value === "es"
  ) {
    return value;
  }

  return "fr";
}

function localeForLanguage(
  language: Language
): string {
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

function formatMoney(
  amount: number,
  currency: string,
  language: Language
): string {
  const cfa = formatCfaAmount(amount, currency, localeForLanguage(language));
  if (cfa !== null) return cfa;
  try {
    return new Intl.NumberFormat(
      localeForLanguage(language),
      {
        style: "currency", currencyDisplay: "code", currency,
        maximumFractionDigits: 0,
      }
    ).format(amount);
  } catch {
    return `${new Intl.NumberFormat(
      localeForLanguage(language)
    ).format(amount)} ${currency}`;
  }
}

function formatNumber(
  value: number,
  language: Language
): string {
  return new Intl.NumberFormat(
    localeForLanguage(language)
  ).format(value);
}

function getRemainingDays(
  endDate: string | null
): number | null {
  if (!endDate) {
    return null;
  }

  const timestamp = Date.parse(endDate);

  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return Math.max(
    0,
    Math.ceil(
      (timestamp - Date.now()) /
        86_400_000
    )
  );
}

function getMinimumDonation(
  currency: string
): number {
  return currency === "XOF"
    ? MIN_DONATION_XOF
    : MIN_DONATION_OTHER;
}

function getPresetAmounts(
  currency: string
): number[] {
  return currency === "XOF"
    ? [...DEFAULT_AMOUNTS_XOF]
    : [...DEFAULT_AMOUNTS_OTHER];
}

function getCampaignUrl(
  slug: string
): string {
  if (typeof window === "undefined") {
    return `/campagnes/${encodeURIComponent(
      slug
    )}`;
  }

  return new URL(
    `/campagnes/${encodeURIComponent(slug)}`,
    window.location.origin
  ).toString();
}

function parseDonationAmount(
  value: string
): number | null {
  const normalized = value
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");

  if (!normalized) {
    return null;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const amount = Number(normalized);

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return null;
  }

  return amount;
}

// ----------------------------------------------------------
// COMPOSANT
// ----------------------------------------------------------

export default function CampaignDonationPanel({
  campaign,
  onDonate,
  className = "",
  compact = false,
}: CampaignDonationPanelProps) {
  const translationContext =
    useTranslation();

  const language = resolveLanguage(
    translationContext.language
  );

  const t = translations[language];

  // --------------------------------------------------------
  // DONNÉES DE COLLECTE
  // --------------------------------------------------------

  const targetAmount = Math.max(
    0,
    campaign.targetAmount
  );

  const collectedAmount = Math.max(
    0,
    campaign.collectedAmount
  );

  const remainingAmount = Math.max(
    0,
    targetAmount - collectedAmount
  );

  const progress = Math.min(
    100,
    Math.max(
      0,
      campaign.progressPercentage
    )
  );

  const donorCount = Math.max(
    0,
    campaign.donorCount
  );

  const isActive =
    campaign.status === "ACTIVE";

  const isUrgent =
    campaign.isUrgent && isActive;

  // --------------------------------------------------------
  // MONTANTS
  // --------------------------------------------------------

  const presetAmounts = useMemo(
    () => getPresetAmounts(campaign.currency),
    [campaign.currency]
  );

  const minimumAmount = getMinimumDonation(
    campaign.currency
  );

  const [selectedAmount, setSelectedAmount] =
    useState<number | null>(null);

  const [customAmount, setCustomAmount] =
    useState("");

  const [isCustomAmount, setIsCustomAmount] =
    useState(false);

  const [isProcessing, setIsProcessing] =
    useState(false);

  const [formError, setFormError] =
    useState<string | null>(null);

  const [copied, setCopied] =
    useState(false);

  // --------------------------------------------------------
  // DATES
  // --------------------------------------------------------

  const [daysRemaining, setDaysRemaining] =
    useState<number | null>(null);

  useEffect(() => {
    const updateDays = () => {
      setDaysRemaining(
        getRemainingDays(campaign.endDate)
      );
    };

    const timeout = window.setTimeout(
      updateDays,
      0
    );

    const interval = window.setInterval(
      updateDays,
      60_000
    );

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [campaign.endDate]);

  // --------------------------------------------------------
  // SÉLECTION D'UN MONTANT
  // --------------------------------------------------------

  const handleSelectPreset = useCallback(
    (amount: number) => {
      setSelectedAmount(amount);
      setCustomAmount("");
      setIsCustomAmount(false);
      setFormError(null);
    },
    []
  );

  const handleCustomAmount = useCallback(
    (value: string) => {
      setCustomAmount(value);
      setSelectedAmount(null);
      setIsCustomAmount(true);
      setFormError(null);
    },
    []
  );

  // --------------------------------------------------------
  // VALIDATION
  // --------------------------------------------------------

  const resolvedAmount = isCustomAmount
    ? parseDonationAmount(customAmount)
    : selectedAmount;

  const handleDonate = useCallback(
    async () => {
      if (!isActive) {
        setFormError(
          t.unavailableStatus
        );
        return;
      }

      if (resolvedAmount === null) {
        setFormError(
          t.amountRequired
        );
        return;
      }

      if (
        !Number.isFinite(resolvedAmount) ||
        resolvedAmount <= 0
      ) {
        setFormError(
          t.invalidAmount
        );
        return;
      }

      if (
        resolvedAmount < minimumAmount
      ) {
        setFormError(
          `${t.minimumAmount} ${formatMoney(
            minimumAmount,
            campaign.currency,
            language
          )}`
        );
        return;
      }

      if (!onDonate) {
        setFormError(
          t.unavailable
        );
        return;
      }

      setFormError(null);
      setIsProcessing(true);

      try {
        await onDonate(
          resolvedAmount,
          campaign
        );
      } catch {
        setFormError(
          t.donationError
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [
      isActive,
      resolvedAmount,
      minimumAmount,
      onDonate,
      campaign,
      language,
      t,
    ]
  );

  // --------------------------------------------------------
  // PARTAGE
  // --------------------------------------------------------

  const handleCopyLink = useCallback(
    async () => {
      const url = getCampaignUrl(
        campaign.slug
      );

      try {
        await navigator.clipboard.writeText(
          url
        );

        setCopied(true);
      } catch {
        setCopied(false);
      }
    },
    [campaign.slug]
  );

  const handleShare = useCallback(
    async () => {
      const url = getCampaignUrl(
        campaign.slug
      );

      if (
        typeof navigator.share ===
        "function"
      ) {
        try {
          await navigator.share({
            title: campaign.title,
            text: campaign.shortDescription,
            url,
          });

          return;
        } catch {
          // Le partage peut être annulé
          // volontairement par le visiteur.
        }
      }

      await handleCopyLink();
    },
    [
      campaign.slug,
      campaign.title,
      campaign.shortDescription,
      handleCopyLink,
    ]
  );

  // --------------------------------------------------------
  // RENDU
  // --------------------------------------------------------

  return (
    <section
      aria-label={t.support}
      className={[
        "overflow-hidden rounded-[22px]",
        "border border-slate-200",
        "bg-white",
        "shadow-[0_12px_40px_rgba(9,43,80,0.08)]",
        className,
      ].join(" ")}
    >
      {/* EN-TÊTE */}

      <div
        className={[
          "bg-[#092B50] text-white",
          compact ? "px-5 py-5" : "px-6 py-6",
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <Heart className="h-5 w-5 text-[#59E4EE]" />
          </div>

          <div className="min-w-0">
            <h2 className="text-[18px] font-extrabold leading-snug">
              {t.support}
            </h2>

            <p className="mt-1 text-sm leading-5 text-white/75">
              {t.subtitle}
            </p>
          </div>
        </div>

        {isUrgent && (
          <div className="mt-4 inline-flex items-center rounded-full bg-[#E71E3D] px-3 py-1.5 text-xs font-extrabold">
            {t.urgent}
          </div>
        )}
      </div>

      {/* CONTENU */}

      <div
        className={
          compact ? "p-5" : "p-5 sm:p-6"
        }
      >
        {/* MONTANT COLLECTÉ */}

        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-500">
              {t.collected}
            </p>

            <p className="mt-1 break-words text-[27px] font-extrabold leading-tight tracking-tight text-[#092B50] sm:text-[30px]">
              {formatMoney(
                collectedAmount,
                campaign.currency,
                language
              )}
            </p>
          </div>

          <span className="shrink-0 text-[17px] font-extrabold text-[#0B9BAE]">
            {progress}%
          </span>
        </div>

        {/* BARRE DE PROGRESSION */}

        <div
          className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label={t.progress}
        >
          <div
            className="h-full rounded-full bg-[#0BC2D4] transition-[width] duration-500"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <p className="mt-2 text-right text-sm font-semibold text-slate-500">
          {progress}% {t.progress}
        </p>

        {/* OBJECTIF ET RESTANT */}

        <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-[#F5F9FC] p-4">
          <div>
            <p className="text-sm font-medium text-slate-500">
              {t.goal}
            </p>

            <p className="mt-1 break-words text-sm font-extrabold text-[#092B50]">
              {formatMoney(
                targetAmount,
                campaign.currency,
                language
              )}
            </p>
          </div>

          <div className="border-l border-slate-200 pl-3">
            <p className="text-sm font-medium text-slate-500">
              {t.remaining}
            </p>

            <p className="mt-1 break-words text-sm font-extrabold text-[#092B50]">
              {formatMoney(
                remainingAmount,
                campaign.currency,
                language
              )}
            </p>
          </div>
        </div>

        {/* DONATEURS ET DÉLAI */}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <UsersRound className="h-4 w-4 text-[#0B9BAE]" />

            {formatNumber(
              donorCount,
              language
            )}{" "}
            {donorCount === 1
              ? t.oneDonor
              : t.donors}
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Clock3 className="h-4 w-4 text-[#0B9BAE]" />

            {!isActive
              ? campaign.status === "COMPLETED"
                ? t.completed
                : t.closed
              : daysRemaining === null
                ? t.noDeadline
                : `${daysRemaining} ${
                    daysRemaining === 1
                      ? t.oneDayLeft
                      : t.daysLeft
                  }`}
          </div>
        </div>

        {/* SÉLECTION DU MONTANT */}

        <div className="mt-6">
          <h3 className="text-sm font-extrabold text-[#092B50]">
            {t.selectAmount}
          </h3>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {presetAmounts.map((amount) => {
              const selected =
                !isCustomAmount &&
                selectedAmount === amount;

              return (
                <button
                  key={amount}
                  type="button"
                  disabled={!isActive || isProcessing}
                  onClick={() =>
                    handleSelectPreset(amount)
                  }
                  aria-pressed={selected}
                  className={[
                    "relative min-h-[48px] rounded-xl",
                    "border px-2 py-3",
                    "text-xs font-extrabold",
                    "transition-all duration-200",
                    "disabled:cursor-not-allowed",
                    "disabled:opacity-50",
                    selected
                      ? "border-[#0B9BAE] bg-[#E8F8FA] text-[#087F8E] ring-1 ring-[#0B9BAE]"
                      : "border-slate-200 bg-white text-[#092B50] hover:border-[#0BC2D4] hover:bg-[#F3FBFC]",
                  ].join(" ")}
                >
                  {formatMoney(
                    amount,
                    campaign.currency,
                    language
                  )}

                  {selected && (
                    <Check className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-[#0B9BAE]" />
                  )}
                </button>
              );
            })}

            {/* AUTRE MONTANT */}

            <button
              type="button"
              disabled={!isActive || isProcessing}
              onClick={() => {
                setIsCustomAmount(true);
                setSelectedAmount(null);
                setFormError(null);
              }}
              aria-pressed={isCustomAmount}
              className={[
                "min-h-[48px] rounded-xl",
                "border px-3 py-3",
                "text-xs font-extrabold",
                "transition-colors",
                "disabled:cursor-not-allowed",
                "disabled:opacity-50",
                isCustomAmount
                  ? "border-[#0B9BAE] bg-[#E8F8FA] text-[#087F8E]"
                  : "border-slate-200 text-[#092B50] hover:border-[#0BC2D4]",
              ].join(" ")}
            >
              {t.customAmount}
            </button>
          </div>

          {isCustomAmount && (
            <div className="mt-3">
              <label
                htmlFor={`custom-donation-${campaign.id}`}
                className="mb-2 block text-sm font-bold text-slate-600"
              >
                {t.customAmount} ({currencyUnit(campaign.currency)})
              </label>

              <div className="relative">
                <Wallet className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  id={`custom-donation-${campaign.id}`}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  disabled={!isActive || isProcessing}
                  value={customAmount}
                  onChange={(event) =>
                    handleCustomAmount(
                      event.target.value
                    )
                  }
                  placeholder={t.amountPlaceholder}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold text-[#092B50] outline-none focus:border-[#0BC2D4] focus:ring-2 focus:ring-[#0BC2D4]/15"
                />
              </div>
            </div>
          )}
        </div>

        {/* ERREUR */}

        {formError && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-5 text-red-700"
          >
            {formError}
          </p>
        )}

        {/* BOUTON PRINCIPAL */}

        <button
          type="button"
          onClick={() => void handleDonate()}
          disabled={!isActive || isProcessing}
          className="mt-5 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#E71E3D] px-4 text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(231,30,61,0.18)] transition-colors hover:bg-[#C91834] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          {isProcessing ? (
            t.processing
          ) : (
            <>
              <Heart className="h-4 w-4" />
              {t.donate}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        {!isActive && (
          <p className="mt-3 text-center text-sm font-medium text-slate-500">
            {t.unavailableStatus}
          </p>
        )}

        {/* SÉCURITÉ */}

        <div className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
          <LockKeyhole className="h-3.5 w-3.5 text-[#0B9BAE]" />
          {t.security}
        </div>

        {/* PARTAGE */}

        <div className="mt-6 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={() => void handleShare()}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-[#092B50] transition-colors hover:bg-slate-50"
          >
            <Share2 className="h-4 w-4" />
            {t.share}
          </button>

          <button
            type="button"
            onClick={() => void handleCopyLink()}
            className="mt-2 flex min-h-10 w-full items-center justify-center gap-2 text-xs font-semibold text-slate-500 transition-colors hover:text-[#0B9BAE]"
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {t.copied}
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                {t.copyLink}
              </>
            )}
          </button>
        </div>

        {/* ENGAGEMENTS */}

        {!compact && (
          <div className="mt-5 space-y-3 rounded-xl bg-[#F5F9FC] p-4">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0B9BAE]" />

              <div>
                <p className="text-sm font-extrabold text-[#092B50]">
                  {t.transparency}
                </p>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  {t.transparencyDescription}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#0B9BAE]" />

              <div>
                <p className="text-sm font-extrabold text-[#092B50]">
                  {t.security}
                </p>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  {t.securityDescription}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export type {
  CampaignDonationPanelProps as DonationPanelProps,
};
