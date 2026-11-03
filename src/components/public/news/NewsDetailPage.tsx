"use client";

import { formatCfaAmount } from "@/lib/campaigns/currencies";

import { useMemo, useState } from "react";
import Image from "@/components/public/PublicImage";
import Link from "next/link";

import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Coins,
  Copy,
  Folder,
  Heart,
  ListFilter,
  MapPin,
  UserRound,
} from "lucide-react";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import PublicationContent from "./PublicationContent";

import type {
  PublicNewsDetailData,
  PublicNewsDetail,
  PublicNewsCategory,
} from "@/lib/public/news-detail-data";

// ============================================================
// FONDATION SAUVONS DES VIES
// DÉTAIL D'UNE PUBLICATION
// VERSION PC / TABLETTE / MOBILE
// ============================================================
//
// Les données proviennent exclusivement du serveur.
//
// Aucune publication fictive.
// Aucun montant fictif.
// Aucun témoignage inventé.
// Aucune image ajoutée artificiellement.
//
// Le Header et le Footer sont fournis par le layout public.
//
// ============================================================

type Language = "fr" | "en" | "de" | "es";

type NewsDetailPageProps = {
  data: PublicNewsDetailData;
};

type Translation = {
  home: string;
  news: string;
  detail: string;
  completed: string;
  actionFigures: string;
  amountUsed: string;
  beneficiariesHelped: string;
  interventionDate: string;
  medicalPartner: string;
  recent: string;
  categories: string;
  allCategories: string;
  viewAll: string;
  share: string;
  whatsapp: string;
  facebook: string;
  copy: string;
  copied: string;
  donate: string;
  readMore: string;
  readLess: string;
  relatedCampaigns: string;
  minutes: string;
  figuresUnavailable: string;
};

const translations: Record<Language, Translation> = {
  fr: {
    home: "Accueil",
    news: "Journaux / Actualités",
    detail: "Détail de la publication",
    completed: "Action réalisée",
    actionFigures: "Cette action en chiffres",
    amountUsed: "Montant utilisé pour la prise en charge",
    beneficiariesHelped: "Bénéficiaires aidés",
    interventionDate: "Date de l'intervention",
    medicalPartner: "Partenaire médical",
    recent: "Publications récentes",
    categories: "Catégories",
    allCategories: "Toutes les catégories",
    viewAll: "Voir tout",
    share: "Partager cet article",
    whatsapp: "Partager sur WhatsApp",
    facebook: "Partager sur Facebook",
    copy: "Copier le lien",
    copied: "Lien copié",
    donate: "Faire un don maintenant",
    readMore: "Lire la suite",
    readLess: "Afficher moins",
    relatedCampaigns: "Campagnes associées",
    minutes: "min de lecture",
    figuresUnavailable: "Les chiffres de cette action ne sont pas encore renseignés.",
  },
  en: {
    home: "Home",
    news: "News / Updates",
    detail: "Publication details",
    completed: "Completed action",
    actionFigures: "This action in numbers",
    amountUsed: "Amount used for medical care",
    beneficiariesHelped: "People helped",
    interventionDate: "Intervention date",
    medicalPartner: "Medical partner",
    recent: "Recent publications",
    categories: "Categories",
    allCategories: "All categories",
    viewAll: "View all",
    share: "Share this article",
    whatsapp: "Share on WhatsApp",
    facebook: "Share on Facebook",
    copy: "Copy link",
    copied: "Link copied",
    donate: "Donate now",
    readMore: "Read more",
    readLess: "Show less",
    relatedCampaigns: "Related campaigns",
    minutes: "min read",
    figuresUnavailable: "Figures for this action have not been provided yet.",
  },
  de: {
    home: "Startseite",
    news: "Nachrichten / Aktuelles",
    detail: "Details der Veröffentlichung",
    completed: "Abgeschlossene Aktion",
    actionFigures: "Diese Aktion in Zahlen",
    amountUsed: "Verwendeter Betrag für die Versorgung",
    beneficiariesHelped: "Unterstützte Personen",
    interventionDate: "Datum des Eingriffs",
    medicalPartner: "Medizinischer Partner",
    recent: "Neueste Veröffentlichungen",
    categories: "Kategorien",
    allCategories: "Alle Kategorien",
    viewAll: "Alle ansehen",
    share: "Artikel teilen",
    whatsapp: "Auf WhatsApp teilen",
    facebook: "Auf Facebook teilen",
    copy: "Link kopieren",
    copied: "Link kopiert",
    donate: "Jetzt spenden",
    readMore: "Weiterlesen",
    readLess: "Weniger anzeigen",
    relatedCampaigns: "Verknüpfte Kampagnen",
    minutes: "Min. Lesezeit",
    figuresUnavailable: "Für diese Aktion liegen noch keine Zahlen vor.",
  },
  es: {
    home: "Inicio",
    news: "Noticias / Actualidad",
    detail: "Detalle de la publicación",
    completed: "Acción realizada",
    actionFigures: "Esta acción en cifras",
    amountUsed: "Importe utilizado para la atención",
    beneficiariesHelped: "Personas ayudadas",
    interventionDate: "Fecha de intervención",
    medicalPartner: "Centro médico",
    recent: "Publicaciones recientes",
    categories: "Categorías",
    allCategories: "Todas las categorías",
    viewAll: "Ver todo",
    share: "Compartir este artículo",
    whatsapp: "Compartir por WhatsApp",
    facebook: "Compartir en Facebook",
    copy: "Copiar enlace",
    copied: "Enlace copiado",
    donate: "Donar ahora",
    readMore: "Leer más",
    readLess: "Mostrar menos",
    relatedCampaigns: "Campañas relacionadas",
    minutes: "min de lectura",
    figuresUnavailable: "Todavía no se han facilitado las cifras de esta acción.",
  },
};

// ============================================================
// FORMATAGE
// ============================================================

const localeMap: Record<Language, string> = {
  fr: "fr-FR",
  en: "en-GB",
  de: "de-DE",
  es: "es-ES",
};

function formatDate(
  value: string | null,
  language: Language
): string | null {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(localeMap[language], {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatMoney(
  amount: number,
  currency: string,
  language: Language
): string {
  const cfa = formatCfaAmount(amount, currency, localeMap[language]);
  if (cfa !== null) return cfa;
  const formatted = new Intl.NumberFormat(
    localeMap[language],
    { maximumFractionDigits: 0 }
  ).format(amount);

  return currency === "XOF"
    ? `${formatted} FCFA`
    : `${formatted} ${currency}`;
}

function normalized(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function categoryAppearance(category: string) {
  const name = normalized(category);

  if (name.includes("action")) {
    return {
      Icon: CheckCircle2,
      background: "bg-[#079C61]",
    };
  }

  if (name.includes("campagne")) {
    return {
      Icon: Heart,
      background: "bg-[#087CF3]",
    };
  }

  if (
    name.includes("paiement") ||
    name.includes("hopital")
  ) {
    return {
      Icon: Building2,
      background: "bg-[#8438D8]",
    };
  }

  if (name.includes("temoignage")) {
    return {
      Icon: UserRound,
      background: "bg-[#F57C18]",
    };
  }

  if (name.includes("alimentaire")) {
    return {
      Icon: Heart,
      background: "bg-[#E71E3D]",
    };
  }

  return {
    Icon: Folder,
    background: "bg-[#0879AA]",
  };
}

function categoryLabel(category: string, language: Language): string {
  const names: Record<string, Record<Language, string>> = {
    ACTION_REALISEE: { fr: "Action réalisée", en: "Completed action", de: "Abgeschlossene Aktion", es: "Acción realizada" },
    PAIEMENT_HOPITAL: { fr: "Paiement à l’hôpital", en: "Hospital payment", de: "Krankenhauszahlung", es: "Pago al hospital" },
    REMISE_AIDE: { fr: "Remise d’aide", en: "Aid delivered", de: "Geleistete Hilfe", es: "Entrega de ayuda" },
    SUIVI_BENEFICIAIRE: { fr: "Suivi d’un bénéficiaire", en: "Beneficiary follow-up", de: "Begleitung einer unterstützten Person", es: "Seguimiento de un beneficiario" },
    MISE_A_JOUR_CAMPAGNE: { fr: "Mise à jour de campagne", en: "Campaign update", de: "Kampagnen-Update", es: "Actualización de campaña" },
    TEMOIGNAGE: { fr: "Témoignage", en: "Testimonial", de: "Erfahrungsbericht", es: "Testimonio" },
    AIDE_ALIMENTAIRE: { fr: "Aide alimentaire", en: "Food assistance", de: "Lebensmittelhilfe", es: "Ayuda alimentaria" },
    RAPPORT: { fr: "Rapport", en: "Report", de: "Bericht", es: "Informe" },
  };
  const key = normalized(category).replace(/[^a-z0-9]+/g, "_").toUpperCase();
  return names[key]?.[language] ?? category.replace(/_/g, " ");
}

function validImageUrl(
  value: string | null | undefined
): string | null {
  if (!value) return null;

  const url = value.trim();

  if (url.startsWith("/") && !url.startsWith("//")) {
    return url;
  }

  if (/^https:\/\//i.test(url)) {
    return url;
  }

  return null;
}

function publicationImages(
  publication: PublicNewsDetail
): string[] {
  const urls = [
    publication.imageUrl,
    ...publication.photos.map((photo) => photo.imageUrl),
  ];

  const unique = new Set<string>();

  for (const url of urls) {
    const safeUrl = validImageUrl(url);

    if (safeUrl) {
      unique.add(safeUrl);
    }
  }

  return Array.from(unique);
}

// ============================================================
// ICÔNES SOCIALES OFFICIELLES EN SVG
// ============================================================

function WhatsAppIcon({
  size = 20,
}: {
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.52 3.48A11.82 11.82 0 0 0 12.04 0C5.46 0 .1 5.35.1 11.93c0 2.1.55 4.16 1.6 5.97L0 24l6.27-1.64a11.9 11.9 0 0 0 5.77 1.47h.01c6.58 0 11.94-5.35 11.95-11.93a11.85 11.85 0 0 0-3.48-8.42ZM12.05 21.8a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.73.98.99-3.63-.23-.37a9.87 9.87 0 0 1-1.52-5.26c0-5.47 4.45-9.92 9.93-9.92a9.86 9.86 0 0 1 7.02 2.91 9.86 9.86 0 0 1 2.9 7.02c0 5.47-4.45 9.92-9.97 9.92Zm5.44-7.43c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.09 4.49.71.31 1.27.49 1.7.63.71.22 1.36.19 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
    </svg>
  );
}

function FacebookIcon({
  size = 20,
}: {
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.096 10.125 24v-8.436H7.078v-3.49h3.047V9.412c0-3.027 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.97H15.83c-1.49 0-1.955.931-1.955 1.887v2.265h3.328l-.532 3.49h-2.796V24C19.612 23.096 24 18.1 24 12.073Z" />
    </svg>
  );
}

// ============================================================
// IMAGE DE PUBLICATION
// ============================================================

function PublicationImage({
  src,
  alt,
  className = "",
  priority = false,
}: {
  src: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const safeUrl = validImageUrl(src);

  if (!safeUrl) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-[#E8F5FC] ${className}`}
      >
        <Heart
          size={42}
          strokeWidth={1.4}
          className="text-[#8CB6D1]"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-[#E8F5FC] ${className}`}
    >
      <Image
        src={safeUrl}
        alt={alt}
        fill
        priority={priority}
        unoptimized
        sizes="(max-width: 767px) 100vw, (max-width: 1279px) 75vw, 900px"
        className="object-contain object-center"
      />
    </div>
  );
}

// ============================================================
// FIL D'ARIANE
// ============================================================

function Breadcrumb({
  labels,
}: {
  labels: Translation;
}) {
  return (
    <nav
      aria-label="Fil d'Ariane"
      className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#4C78BD]"
    >
      <Link
        href="/"
        className="transition hover:text-[#087CF3] hover:underline"
      >
        {labels.home}
      </Link>

      <ChevronRight size={14} />

      <Link
        href="/actualites"
        className="transition hover:text-[#087CF3] hover:underline"
      >
        {labels.news}
      </Link>

      <ChevronRight size={14} />

      <span className="text-[#6383B8]">
        {labels.detail}
      </span>
    </nav>
  );
}

// ============================================================
// BADGE DE CATÉGORIE
// ============================================================

function PublicationBadge({
  category,
  labels,
}: {
  category: string;
  labels: Translation;
}) {
  const { language } = useTranslation();
  const appearance = categoryAppearance(category);
  const Icon = appearance.Icon;

  const text = normalized(category).replace(/[^a-z0-9]+/g, "_") === "action_realisee"
    ? labels.completed
    : categoryLabel(category, language);

  return (
    <span
      className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold text-white sm:text-xs ${appearance.background}`}
    >
      <Icon
        size={14}
        strokeWidth={2.5}
        aria-hidden="true"
      />

      {text}
    </span>
  );
}

// ============================================================
// INFORMATIONS DE PUBLICATION
// ============================================================

function PublicationMetadata({
  publication,
  language,
  labels,
  mobile = false,
}: {
  publication: PublicNewsDetail;
  language: Language;
  labels: Translation;
  mobile?: boolean;
}) {
  const date = formatDate(
    publication.publicationDate,
    language
  );

  const hospital = publication.actionStats.hospitalName;

  const items = [
    date
      ? {
          id: "date",
          Icon: CalendarDays,
          text: date,
        }
      : null,

    publication.authorName
      ? {
          id: "author",
          Icon: UserRound,
          text: publication.authorName,
        }
      : null,

    publication.category
      ? {
          id: "category",
          Icon: Folder,
          text: categoryLabel(publication.category, language),
        }
      : null,

    hospital
      ? {
          id: "hospital",
          Icon: MapPin,
          text: hospital,
        }
      : null,

    {
      id: "reading",
      Icon: Clock3,
      text: `${publication.readingTimeMinutes} ${labels.minutes}`,
    },
  ].filter(
    (
      item
    ): item is {
      id: string;
      Icon: typeof Heart;
      text: string;
    } => item !== null
  );

  return (
    <div
      className={
        mobile
          ? "flex flex-wrap items-center gap-x-3 gap-y-2"
          : "flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-[#E8EFF8] py-4"
      }
    >
      {items.map(({ id, Icon, text }) => (
        <span
          key={id}
          className={`inline-flex min-w-0 items-center gap-1.5 text-[#4165A6] ${
            mobile
              ? "text-xs sm:text-xs"
              : "text-xs xl:text-sm"
          }`}
        >
          <Icon
            size={mobile ? 14 : 19}
            strokeWidth={2.2}
            className="shrink-0 text-[#063AA9]"
            aria-hidden="true"
          />

          <span>{text}</span>
        </span>
      ))}
    </div>
  );
}

// ============================================================
// TEXTE DE L'ARTICLE
// ============================================================

const PublicationBody = PublicationContent;

// ============================================================
// GALERIE PHOTOS
// ============================================================

function PublicationGallery({
  publication,
  images,
  mobile = false,
}: {
  publication: PublicNewsDetail;
  images: string[];
  mobile?: boolean;
}) {
  const galleryImages = images.slice(1);

  if (galleryImages.length === 0) {
    return null;
  }

  return (
    <div
      className={`grid gap-2.5 ${
        mobile
          ? "grid-cols-2 sm:grid-cols-3"
          : "grid-cols-3"
      }`}
    >
      {galleryImages.map((src, index) => (
        <PublicationImage
          key={src}
          src={src}
          alt={`${publication.title} — photo ${index + 2}`}
          className="aspect-[1.5] w-full rounded-lg"
        />
      ))}
    </div>
  );
}

// ============================================================
// CHIFFRES RÉELS DE L'ACTION
// ============================================================

function ActionFigures({
  publication,
  labels,
  language,
}: {
  publication: PublicNewsDetail;
  labels: Translation;
  language: Language;
}) {
  const stats = publication.actionStats;

  const figures: Array<{
    id: string;
    Icon: typeof Heart;
    value: string;
    description: string;
    color: string;
  }> = [];

  if (
    stats.amountUsed !== null &&
    stats.currency
  ) {
    figures.push({
      id: "amount",
      Icon: Coins,
      value: formatMoney(
        stats.amountUsed,
        stats.currency,
        language
      ),
      description: labels.amountUsed,
      color: "text-[#087CF3]",
    });
  }

  if (stats.beneficiariesHelped !== null) {
    figures.push({
      id: "beneficiaries",
      Icon: Heart,
      value: String(stats.beneficiariesHelped),
      description: labels.beneficiariesHelped,
      color: "text-[#E71E3D]",
    });
  }

  if (stats.interventionDate) {
    const date = formatDate(
      stats.interventionDate,
      language
    );

    if (date) {
      figures.push({
        id: "date",
        Icon: CalendarDays,
        value: date,
        description: labels.interventionDate,
        color: "text-[#063AA9]",
      });
    }
  }

  if (stats.hospitalName) {
    figures.push({
      id: "hospital",
      Icon: Building2,
      value: stats.hospitalName,
      description: labels.medicalPartner,
      color: "text-[#087CF3]",
    });
  }

  return (
    <section className="rounded-xl border border-[#E5EDF7] bg-white p-3.5 shadow-[0_3px_12px_rgba(9,43,80,0.035)] sm:p-4">
      <h2 className="mb-3 text-[17px] font-extrabold tracking-tight text-[#082B80]">
        {labels.actionFigures}
      </h2>

      {figures.length === 0 && <p className="rounded-lg bg-[#F2F9FF] px-3 py-3 text-sm leading-relaxed text-[#5376B4]">{labels.figuresUnavailable}</p>}

      <div className="grid grid-cols-2 gap-2">
        {figures.map(
          ({
            id,
            Icon,
            value,
            description,
            color,
          }) => (
            <div
              key={id}
              className="flex min-h-[82px] min-w-0 items-start gap-2 rounded-lg border border-[#DFEAF7] bg-white p-2.5 sm:p-3"
            >
              <Icon
                size={24}
                strokeWidth={2.4}
                className={`mt-0.5 shrink-0 ${color}`}
                aria-hidden="true"
              />

              <div className="min-w-0">
                <p className="break-words text-sm font-extrabold leading-tight text-[#082D8C] sm:text-sm">
                  {value}
                </p>

                <p className="mt-1 text-sm leading-[1.4] text-[#5376B4] sm:text-sm">
                  {description}
                </p>
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}

// ============================================================
// PUBLICATIONS RÉCENTES
// ============================================================

function RecentPublications({
  data,
  labels,
  language,
}: {
  data: PublicNewsDetailData;
  labels: Translation;
  language: Language;
}) {
  const recentPublications = [data.publication, ...data.recentPublications].slice(0, 4);

  return (
    <section className="rounded-xl border border-[#E5EDF7] bg-white p-3.5 shadow-[0_3px_12px_rgba(9,43,80,0.035)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[17px] font-extrabold tracking-tight text-[#082B80]">
          {labels.recent}
        </h2>

        <Link
          href="/actualites"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-[#087CF3] hover:underline"
        >
          {labels.viewAll}
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="space-y-1">
        {recentPublications.map((item) => (
          <Link
            key={item.id}
            href={`/actualites/${encodeURIComponent(
              item.slug
            )}`}
            aria-current={item.slug === data.publication.slug ? "page" : undefined}
            className={`group flex min-w-0 gap-2.5 rounded-lg border-b border-[#EAF0F7] p-1.5 transition hover:bg-[#EAF7FF] last:border-b-0 ${item.slug === data.publication.slug ? "bg-[#E6F6FF]" : ""}`}
          >
            <PublicationImage
              src={item.imageUrl}
              alt={item.title}
              className="h-[57px] w-[79px] shrink-0 rounded-md"
            />

            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-xs font-extrabold leading-[1.4] text-[#0A378B] group-hover:text-[#087CF3]">
                {item.title}
              </h3>

              {item.publicationDate && (
                <p className="mt-1 text-sm text-[#6482B6]">
                  {formatDate(
                    item.publicationDate,
                    language
                  )}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// CATÉGORIES
// ============================================================

function CategoriesPanel({
  categories,
  labels,
}: {
  categories: PublicNewsCategory[];
  labels: Translation;
}) {
  const { language: currentLanguage } = useTranslation();
  if (categories.length === 0) {
    return null;
  }
  const total = categories.reduce(
    (sum, item) => sum + item.count,
    0
  );

  return (
    <section className="rounded-xl border border-[#E5EDF7] bg-white p-3.5 shadow-[0_3px_12px_rgba(9,43,80,0.035)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[17px] font-extrabold tracking-tight text-[#082B80]">
          {labels.categories}
        </h2>

        <Link
          href="/actualites"
          className="inline-flex items-center gap-1 text-sm font-bold text-[#087CF3] hover:underline"
        >
          {labels.viewAll}
          <ArrowRight size={14} />
        </Link>
      </div>

      <Link
        href="/actualites"
        className="mb-1.5 flex items-center justify-between gap-2 rounded-md bg-[#EAF6FF] px-2.5 py-2 text-sm font-semibold text-[#2455A4]"
      >
        <span className="flex items-center gap-2">
          <ListFilter size={16} />
          {labels.allCategories}
        </span>

        <span className="rounded-full bg-[#D3E9FF] px-2 py-0.5 text-xs font-extrabold text-[#073C9B]">
          {total}
        </span>
      </Link>

      {categories.map((category) => {
        const appearance = categoryAppearance(
          category.name
        );

        const Icon = appearance.Icon;

        return (
          <Link
            key={category.name}
            href={`/actualites?categorie=${encodeURIComponent(category.name)}`}
            className="flex items-center justify-between gap-2 border-b border-[#EAF0F7] px-2 py-1.5 last:border-b-0"
          >
            <span className="flex min-w-0 items-center gap-2 text-xs text-[#315AA0]">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-white ${appearance.background}`}
              >
                <Icon size={12} />
              </span>

              <span className="truncate">
                {categoryLabel(category.name, currentLanguage)}
              </span>
            </span>

            <span className="rounded-full bg-[#E6F1FE] px-2 py-0.5 text-xs font-extrabold text-[#073C9B]">
              {category.count}
            </span>
          </Link>
        );
      })}
    </section>
  );
}

// ============================================================
// PARTAGE SOCIAL
// ============================================================

function ShareSection({
  title,
  labels,
  mobile = false,
}: {
  title: string;
  labels: Translation;
  mobile?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const currentUrl = () =>
    typeof window !== "undefined"
      ? window.location.href
      : "";

  function shareWhatsApp() {
    const url = currentUrl();

    if (!url) return;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(
        `${title}\n${url}`
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function shareFacebook() {
    const url = currentUrl();

    if (!url) return;

    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        url
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function copyLink() {
    const url = currentUrl();

    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (mobile) {
    return (
      <section className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-extrabold text-[#092B80]">
          {labels.share}
        </h2>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={shareWhatsApp}
            aria-label={labels.whatsapp}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#08A65A] text-white transition hover:bg-[#078B4B]"
          >
            <WhatsAppIcon size={22} />
          </button>

          <button
            type="button"
            onClick={shareFacebook}
            aria-label={labels.facebook}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0866FF] text-white transition hover:bg-[#0755D3]"
          >
            <FacebookIcon size={21} />
          </button>

          <button
            type="button"
            onClick={copyLink}
            aria-label={
              copied ? labels.copied : labels.copy
            }
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D5E5F7] bg-white text-[#063FA7] transition hover:bg-[#F1F7FF]"
          >
            {copied ? (
              <Check size={19} />
            ) : (
              <Copy size={19} />
            )}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-5">
      <h2 className="mb-2 text-sm font-extrabold text-[#092B80]">
        {labels.share}
      </h2>

      <div className="grid max-w-[740px] grid-cols-3 gap-3">
        <button
          type="button"
          onClick={shareWhatsApp}
          className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md bg-[#08A65A] px-3 text-sm font-bold text-white transition hover:bg-[#078B4B]"
        >
          <WhatsAppIcon size={19} />
          <span>{labels.whatsapp}</span>
        </button>

        <button
          type="button"
          onClick={shareFacebook}
          className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md bg-[#0866F5] px-3 text-sm font-bold text-white transition hover:bg-[#0755D3]"
        >
          <FacebookIcon size={18} />
          <span>{labels.facebook}</span>
        </button>

        <button
          type="button"
          onClick={copyLink}
          className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md border border-[#BBD9FA] bg-white px-3 text-sm font-bold text-[#083D9A] transition hover:bg-[#F0F7FF]"
        >
          {copied ? (
            <Check size={18} />
          ) : (
            <Copy size={18} />
          )}

          <span>
            {copied ? labels.copied : labels.copy}
          </span>
        </button>
      </div>
    </section>
  );
}

// ============================================================
// CAMPAGNES ASSOCIÉES
// ============================================================

function RelatedCampaigns({
  publication,
  labels,
}: {
  publication: PublicNewsDetail;
  labels: Translation;
}) {
  if (publication.campaigns.length === 0) {
    return null;
  }

  return (
    <section className="mt-5 border-t border-[#E6EDF6] pt-4">
      <h2 className="mb-3 text-base font-extrabold text-[#092B80]">
        {labels.relatedCampaigns}
      </h2>

      <div className="grid gap-2 sm:grid-cols-2">
        {publication.campaigns.map((campaign) => (
          <Link
            key={campaign.id}
            href={`/campagnes/${encodeURIComponent(
              campaign.slug
            )}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-[#DCEAF7] bg-[#F4FAFF] p-3 transition hover:border-[#0BC2D4]"
          >
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-xs font-extrabold text-[#07317C]">
                {campaign.title}
              </h3>

              {campaign.beneficiaryName && (
                <p className="mt-1 text-sm text-[#5A77A9]">
                  {campaign.beneficiaryName}
                </p>
              )}
            </div>

            <ChevronRight
              size={18}
              className="shrink-0 text-[#087CF3]"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================

export default function NewsDetailPage({
  data,
}: NewsDetailPageProps) {
  const { language } = useTranslation();

  const currentLanguage: Language =
    language === "en" ||
    language === "de" ||
    language === "es"
      ? language
      : "fr";

  const labels = translations[currentLanguage];

  const publication = data.publication;

  const [expanded, setExpanded] = useState(false);

  const images = useMemo(
    () => publicationImages(publication),
    [publication]
  );

  const coverImage = images[0] ?? null;

  const hasLongContent =
    publication.content.trim().length > 400;

  return (
    <div className="w-full min-w-0 bg-[#F3FAFE] font-sans text-[#092B50]">
      {/* ====================================================
          VERSION PC
          ==================================================== */}

      <div className="mx-auto hidden w-full max-w-none px-4 py-3 sm:px-6 lg:block lg:px-8">
        <div className="grid grid-cols-[minmax(0,1fr)_300px] items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* ARTICLE */}

          <article className="min-w-0 overflow-hidden rounded-xl bg-white shadow-[0_3px_16px_rgba(9,43,80,0.04)]">
            {/* HERO */}

            <div className="relative isolate min-h-[280px] overflow-hidden bg-white xl:min-h-[300px]">
              {coverImage && (
                <div className="absolute inset-y-0 right-0 w-[57%]">
                  <PublicationImage
                    src={coverImage}
                    alt={publication.title}
                    priority
                    className="h-full w-full"
                  />
                </div>
              )}

              {coverImage && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white from-[20%] via-white/90 via-[42%] to-transparent"
                />
              )}

              <div className="relative z-10 flex min-h-[280px] w-full flex-col justify-start px-5 py-4 xl:min-h-[300px] xl:px-6">
                <div className="mb-4">
                  <Breadcrumb labels={labels} />
                </div>

                <PublicationBadge
                  category={publication.category}
                  labels={labels}
                />

                <h1
                  className={`mt-4 text-[30px] font-extrabold leading-[1.15] tracking-[-0.035em] text-[#092B83] xl:text-[36px] ${
                    coverImage ? "max-w-[62%]" : "max-w-full"
                  }`}
                >
                  {publication.title}
                </h1>

                {publication.shortDescription && (
                  <p
                    className={`mt-3 text-base leading-[1.5] text-[#4D6EAD] xl:text-[17px] ${
                      coverImage
                        ? "max-w-[60%]"
                        : "max-w-[85%]"
                    }`}
                  >
                    {publication.shortDescription}
                  </p>
                )}
              </div>
            </div>

            {/* CONTENU */}

            <div className="px-5 pb-5 xl:px-6">
              <PublicationMetadata
                publication={publication}
                language={currentLanguage}
                labels={labels}
              />

              <div className="pt-5">
                <PublicationBody
                  content={publication.content}
                />
              </div>

              {images.length > 1 && (
                <div className="mt-5">
                  <PublicationGallery
                    publication={publication}
                    images={images}
                  />
                </div>
              )}

              <RelatedCampaigns
                publication={publication}
                labels={labels}
              />

              <ShareSection
                title={publication.title}
                labels={labels}
              />
            </div>
          </article>

          {/* COLONNE DROITE */}

          <aside className="flex min-w-0 flex-col gap-3">
            <ActionFigures
              publication={publication}
              labels={labels}
              language={currentLanguage}
            />

            <RecentPublications
              data={data}
              labels={labels}
              language={currentLanguage}
            />

            <CategoriesPanel
              categories={data.categories}
              labels={labels}
            />
          </aside>
        </div>
      </div>

      {/* ====================================================
          VERSION MOBILE ET TABLETTE
          ==================================================== */}

      <div className="mx-auto w-full max-w-none bg-white lg:hidden">
        <article className="min-w-0">
          {/* IMAGE DE COUVERTURE */}

          <PublicationImage
            src={coverImage}
            alt={publication.title}
            priority
            className="aspect-[1.8] w-full sm:aspect-[2.2]"
          />

          <div className="px-4 pb-5 pt-3 sm:px-6">
            {/* BADGE */}

            <PublicationBadge
              category={publication.category}
              labels={labels}
            />

            {/* TITRE */}

            <h1 className="mt-2.5 text-[23px] font-extrabold leading-[1.12] tracking-[-0.035em] text-[#092B83] sm:text-[30px]">
              {publication.title}
            </h1>

            {/* MÉTADONNÉES */}

            <div className="mt-3">
              <PublicationMetadata
                publication={publication}
                language={currentLanguage}
                labels={labels}
                mobile
              />
            </div>

            {/* RÉSUMÉ */}

            {publication.shortDescription && (
              <p className="mt-4 text-sm leading-[1.6] text-[#4A6AAA] sm:text-sm">
                {publication.shortDescription}
              </p>
            )}

            {/* IMAGE DANS L'ARTICLE */}

            {coverImage && (
              <PublicationImage
                src={coverImage}
                alt={publication.title}
                className="mt-3 aspect-[1.75] w-full rounded-lg"
              />
            )}

            {/* TEXTE */}

            <div className="mt-3">
              {hasLongContent && !expanded ? (
                <>
                  <div className="line-clamp-5">
                    <PublicationBody
                      content={publication.content}
                      mobile
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    aria-expanded={false}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-[#087CF3]"
                  >
                    {labels.readMore}
                    <ChevronDown size={15} />
                  </button>
                </>
              ) : (
                <>
                  <PublicationBody
                    content={publication.content}
                    mobile
                  />

                  {hasLongContent && (
                    <button
                      type="button"
                      onClick={() => setExpanded(false)}
                      aria-expanded={true}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-[#087CF3]"
                    >
                      {labels.readLess}

                      <ChevronDown
                        size={15}
                        className="rotate-180"
                      />
                    </button>
                  )}
                </>
              )}
            </div>

            {/* GALERIE */}

            {images.length > 1 && (
              <div className="mt-4">
                <PublicationGallery
                  publication={publication}
                  images={images}
                  mobile
                />
              </div>
            )}

            {/* CHIFFRES */}

            <div className="mt-5">
              <ActionFigures
                publication={publication}
                labels={labels}
                language={currentLanguage}
              />
            </div>

            {/* PARTAGE */}

            <div className="mt-4">
              <ShareSection
                title={publication.title}
                labels={labels}
                mobile
              />
            </div>

            {/* DON */}

            <Link
              href="/faire-un-don"
              className="mt-4 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-[#E71E3D] px-4 text-center text-sm font-extrabold text-white shadow-[0_4px_12px_rgba(231,30,61,0.16)] transition hover:bg-[#CB1734]"
            >
              <Heart
                size={21}
                fill="currentColor"
                strokeWidth={2}
              />

              {labels.donate}
            </Link>

            {/* CAMPAGNES ASSOCIÉES */}

            <RelatedCampaigns
              publication={publication}
              labels={labels}
            />
          </div>
        </article>
      </div>
    </div>
  );
}
