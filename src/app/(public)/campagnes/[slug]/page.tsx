
import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { HeartHandshake, LoaderCircle } from "lucide-react";

import CampaignDetailPage from "@/components/public/campaigns/CampaignDetailPage";
import { getPublicCampaignDetail } from "@/lib/public/campaign-detail-data";

// ==========================================================
// FONDATION SAUVONS DES VIES
// PAGE PUBLIQUE — DÉTAIL D'UNE COLLECTE
// ==========================================================
//
// Route : /campagnes/[slug]
// Framework : Next.js 16.4.3 — App Router
//
// - Campagnes publiées uniquement
// - Données réelles Prisma / PostgreSQL
// - Galerie des photos de campagne
// - Montants issus des dons confirmés
// - SEO et partage social
// - Interface responsive PC / mobile
// - Actualisation côté client
// - Gestion des campagnes introuvables
// - Aucun paiement ou don simulé
//
// Header et footer fournis par le layout public.
//
// ==========================================================

// ----------------------------------------------------------
// CONFIGURATION NEXT.JS 16
// ----------------------------------------------------------
//
// La page dépend de données dynamiques :
// - params.slug
// - Prisma
// - connection()
//
// Avec cacheComponents activé, cette option permet
// d'utiliser le rendu bloquant pour cette route.
//
// Ne pas ajouter :
// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";
//
// Ces anciennes configurations ne sont pas nécessaires ici.

export const instant = false;

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

type CampaignPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

// ----------------------------------------------------------
// CONSTANTES
// ----------------------------------------------------------

const FOUNDATION_NAME = "FONDATION SAUVONS DES VIES";

const DEFAULT_DESCRIPTION =
  "Découvrez les campagnes solidaires de la Fondation Sauvons des Vies et soutenez les personnes ayant besoin d'une aide médicale.";

const MAX_SLUG_LENGTH = 200;
const MAX_META_DESCRIPTION_LENGTH = 160;

// ----------------------------------------------------------
// DOMAINE PUBLIC
// ----------------------------------------------------------
//
// NEXT_PUBLIC_SITE_URL doit contenir le domaine public
// réel lorsque le site sera déployé.
//
// Exemple :
// NEXT_PUBLIC_SITE_URL=https://votre-domaine.com
//
// En développement, localhost est utilisé.
// Aucun domaine non acquis n'est supposé être actif.

function getSiteUrl(): URL {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredUrl) {
    try {
      const url = new URL(configuredUrl);

      if (
        url.protocol === "https:" ||
        url.protocol === "http:"
      ) {
        return new URL(url.origin);
      }
    } catch {
      // URL invalide : utilisation du repli local.
    }
  }

  return new URL("http://localhost:3000");
}

// ----------------------------------------------------------
// VALIDATION DU SLUG
// ----------------------------------------------------------

function normalizeSlug(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function isValidSlug(slug: string): boolean {
  return (
    slug.length > 0 &&
    slug.length <= MAX_SLUG_LENGTH &&
    /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(slug)
  );
}

// ----------------------------------------------------------
// NETTOYAGE DES MÉTADONNÉES
// ----------------------------------------------------------

function normalizeMetaText(
  value: string | null | undefined,
  fallback: string,
  maxLength: number
): string {
  const normalized = (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const text = normalized || fallback;

  if (text.length <= maxLength) {
    return text;
  }

  return `${text
    .slice(0, maxLength - 1)
    .trimEnd()}…`;
}

// ----------------------------------------------------------
// IMAGE POUR LES RÉSEAUX SOCIAUX
// ----------------------------------------------------------
//
// Accepte :
// - URL HTTPS publique
// - Chemin local commençant par /
//
// Refuse :
// - URL vide
// - URL javascript:
// - URL data:
// - URL relative non normalisée
//
// Les images doivent être accessibles publiquement.

function getSeoImage(
  imageUrl: string | null | undefined
): string | null {
  if (!imageUrl) {
    return null;
  }

  const normalized = imageUrl.trim();

  if (normalized.startsWith("https://")) {
    return normalized;
  }

  if (
    normalized.startsWith("/") &&
    !normalized.startsWith("//")
  ) {
    return normalized;
  }

  return null;
}

function getAbsoluteImageUrl(
  imageUrl: string | null,
  siteUrl: URL
): string | null {
  if (!imageUrl) {
    return null;
  }

  try {
    const resolved = new URL(imageUrl, siteUrl);

    if (
      resolved.protocol !== "https:" &&
      resolved.protocol !== "http:"
    ) {
      return null;
    }

    return resolved.toString();
  } catch {
    return null;
  }
}

// ----------------------------------------------------------
// MÉTADONNÉES PAR DÉFAUT
// ----------------------------------------------------------

function getUnavailableMetadata(): Metadata {
  return {
    metadataBase: getSiteUrl(),

    title: `Campagne introuvable | ${FOUNDATION_NAME}`,

    description: DEFAULT_DESCRIPTION,

    robots: {
      index: false,
      follow: false,
    },
  };
}

// ----------------------------------------------------------
// SEO DYNAMIQUE
// ----------------------------------------------------------
//
// IMPORTANT :
// Aucun appel à connection() dans generateMetadata.
//
// Le rendu dynamique est autorisé par instant = false.
// Les données sont récupérées depuis Prisma.
//
// Le contenu SEO utilise uniquement les informations
// enregistrées pour la campagne réelle.

export async function generateMetadata({
  params,
}: CampaignPageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;

  const slug = normalizeSlug(rawSlug);

  if (!isValidSlug(slug)) {
    return getUnavailableMetadata();
  }

  // Les métadonnées dépendent des données actuelles de la campagne.
// Empêche leur calcul pendant la prégénération statique.
await connection();

const campaign = await getPublicCampaignDetail(slug);

  if (!campaign) {
    return getUnavailableMetadata();
  }

  const siteUrl = getSiteUrl();

  const title = normalizeMetaText(
    campaign.title,
    FOUNDATION_NAME,
    90
  );

  const description = normalizeMetaText(
    campaign.shortDescription || campaign.description,
    DEFAULT_DESCRIPTION,
    MAX_META_DESCRIPTION_LENGTH
  );

  const pathname = `/campagnes/${encodeURIComponent(
    campaign.slug
  )}`;

  const campaignUrl = new URL(
    pathname,
    siteUrl
  ).toString();

  const primaryImage =
    campaign.imageUrl ||
    campaign.photos[0]?.imageUrl ||
    null;

  const imageUrl = getAbsoluteImageUrl(
    getSeoImage(primaryImage),
    siteUrl
  );

  const images = imageUrl
    ? [
        {
          url: imageUrl,
          alt: campaign.title,
        },
      ]
    : undefined;

  return {
    metadataBase: siteUrl,

    title: `${title} | ${FOUNDATION_NAME}`,

    description,

    applicationName: FOUNDATION_NAME,

    alternates: {
      canonical: campaignUrl,
    },

    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: FOUNDATION_NAME,
      title,
      description,
      url: campaignUrl,
      images,
    },

    twitter: {
      card: imageUrl
        ? "summary_large_image"
        : "summary",

      title,
      description,

      images: imageUrl
        ? [imageUrl]
        : undefined,
    },

    robots: {
      index: true,
      follow: true,

      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
      },
    },
  };
}

// ----------------------------------------------------------
// SQUELETTE DE CHARGEMENT
// ----------------------------------------------------------
//
// Architecture :
// - Fil d'Ariane
// - Galerie avec miniatures
// - Informations de la campagne
// - Montants et progression
// - Panneau de don
// - Onglets
//
// Affichage adapté PC et mobile.

function CampaignDetailLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Chargement de la collecte"
      className="min-h-screen bg-[#F7F9FC]"
    >
      <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        {/* FIL D'ARIANE */}

        <div className="mb-7 flex items-center gap-3">
          <div className="h-3 w-16 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-3 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-3 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
        </div>

        {/* GRILLE PRINCIPALE */}

        <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_340px] lg:items-start">
          {/* GALERIE */}

          <div className="min-w-0">
            <div className="aspect-[16/10] animate-pulse rounded-2xl bg-slate-200 sm:aspect-[16/9] lg:aspect-[4/3]" />

            <div className="mt-3 grid grid-cols-5 gap-2 sm:gap-3">
              {Array.from({ length: 5 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="aspect-[4/3] animate-pulse rounded-lg bg-slate-200"
                  />
                )
              )}
            </div>
          </div>

          {/* INFORMATIONS */}

          <div className="min-w-0">
            <div className="h-7 w-32 animate-pulse rounded-full bg-slate-200" />

            <div className="mt-5 space-y-3">
              <div className="h-7 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-7 w-4/5 animate-pulse rounded bg-slate-200" />
            </div>

            <div className="mt-6 space-y-3">
              <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
            </div>

            <div className="mt-7 space-y-4 border-y border-slate-200 py-5">
              <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-44 animate-pulse rounded bg-slate-200" />
            </div>

            {/* STATISTIQUES */}

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map(
                  (_, index) => (
                    <div key={index}>
                      <div className="h-3 w-16 animate-pulse rounded bg-slate-200" />
                      <div className="mt-3 h-5 w-full animate-pulse rounded bg-slate-200" />
                    </div>
                  )
                )}
              </div>

              <div className="mt-5 h-3 w-full animate-pulse rounded-full bg-slate-200" />
            </div>

            {/* BOUTON DE DON */}

            <div className="mt-5 h-[54px] animate-pulse rounded-xl bg-slate-200" />

            {/* PARTAGE */}

            <div className="mt-5 flex gap-2">
              <div className="h-10 w-24 animate-pulse rounded-xl bg-slate-200" />
              <div className="h-10 w-24 animate-pulse rounded-xl bg-slate-200" />
              <div className="h-10 w-24 animate-pulse rounded-xl bg-slate-200" />
            </div>
          </div>

          {/* PANNEAU DE DON */}

          <aside className="min-w-0 lg:row-span-2">
            <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white">
              <div className="flex items-center gap-3 bg-[#092B50] px-6 py-6">
                <HeartHandshake className="h-7 w-7 text-[#59E4EE]" />

                <div className="space-y-2">
                  <div className="h-4 w-40 animate-pulse rounded bg-white/25" />
                  <div className="h-3 w-32 animate-pulse rounded bg-white/15" />
                </div>
              </div>

              <div className="p-6">
                <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                <div className="mt-3 h-8 w-44 animate-pulse rounded bg-slate-200" />
                <div className="mt-5 h-3 w-full animate-pulse rounded-full bg-slate-200" />

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
                  <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
                </div>

                <div className="mt-7 grid grid-cols-2 gap-3">
                  {Array.from({ length: 6 }).map(
                    (_, index) => (
                      <div
                        key={index}
                        className="h-12 animate-pulse rounded-xl bg-slate-100"
                      />
                    )
                  )}
                </div>

                <div className="mt-5 h-[52px] animate-pulse rounded-xl bg-slate-200" />
              </div>
            </div>
          </aside>

          {/* ONGLETS */}

          <div className="min-w-0 lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex gap-4 border-b border-slate-100 pb-5">
                <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
              </div>

              <div className="mt-7 space-y-4">
                {Array.from({ length: 5 }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className="h-3 w-full animate-pulse rounded bg-slate-200"
                    />
                  )
                )}
              </div>

              <div className="mt-8 h-40 animate-pulse rounded-xl bg-[#EAF5F8]" />
            </div>
          </div>
        </div>

        {/* INDICATEUR ACCESSIBLE */}

        <div
          role="status"
          className="mt-8 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500"
        >
          <LoaderCircle className="h-4 w-4 animate-spin text-[#0B9BAE]" />

          Chargement des informations de la collecte…
        </div>
      </div>
    </main>
  );
}

// ----------------------------------------------------------
// CONTENU DYNAMIQUE
// ----------------------------------------------------------
//
// Ce composant se trouve dans Suspense.
//
// Il récupère une campagne réelle depuis Prisma.
// Les campagnes inexistantes ou non publiées
// ne sont pas affichées.

async function CampaignDetailContent({
  slug,
}: {
  slug: string;
}) {
  // Exécution dynamique côté serveur.
  await connection();

  if (!isValidSlug(slug)) {
    notFound();
  }

  const campaign = await getPublicCampaignDetail(
    slug
  );

  if (!campaign) {
    notFound();
  }

  return (
    <CampaignDetailPage
      slug={campaign.slug}
      initialCampaign={campaign}
    />
  );
}

// ----------------------------------------------------------
// PAGE PRINCIPALE
// ----------------------------------------------------------
//
// Les paramètres sont attendus avant le rendu.
//
// Suspense fournit un affichage de chargement
// pendant la récupération des données.

export default async function CampaignDetailRoute({
  params,
}: CampaignPageProps) {
  const { slug: rawSlug } = await params;

  const slug = normalizeSlug(rawSlug);

  return (
    <Suspense
      fallback={<CampaignDetailLoading />}
    >
      <CampaignDetailContent slug={slug} />
    </Suspense>
  );
}
