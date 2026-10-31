
import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";

import NewsDetailPage from "@/components/public/news/NewsDetailPage";

import {
  getPublicNewsBySlug,
  getPublicNewsDetailData,
} from "@/lib/public/news-detail-data";

// ==========================================================
// FONDATION SAUVONS DES VIES
// PAGE PUBLIQUE — DÉTAIL D'UNE PUBLICATION
// ==========================================================
//
// Route : /actualites/[slug]
//
// Compatible :
// - Next.js 16
// - App Router
// - TypeScript
// - Prisma / Supabase PostgreSQL
// - React Server Components
// - Cache Components
//
// Fonctionnalités :
// - Publication publique par slug
// - Lecture des données réelles
// - Publications récentes et catégories
// - Métadonnées SEO dynamiques
// - Gestion des publications introuvables
// - Affichage PC / tablette / mobile
// - Réutilisation du layout public existant
//
// Aucune donnée fictive.
// Aucun accès aux publications brouillon.
// Aucun changement de l'administration.
//
// ==========================================================

// ----------------------------------------------------------
// CONFIGURATION NEXT.JS 16
// ----------------------------------------------------------
//
// Autorise le rendu dynamique bloquant de cette route
// avec Cache Components.
//
// Évite l'erreur Blocking RouteServer provoquée par
// connection() pendant le pré-rendu.
//
// ----------------------------------------------------------

export const instant = false;

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

type NewsDetailRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

// ----------------------------------------------------------
// CONSTANTES
// ----------------------------------------------------------

const SITE_NAME = "Fondation Sauvons des Vies";

const DEFAULT_DESCRIPTION =
  "Découvrez les actions réalisées, les journaux et les actualités de la Fondation Sauvons des Vies.";

const DEFAULT_OG_IMAGE = "/logo/logo.png";

// ----------------------------------------------------------
// VALIDATION DU SLUG
// ----------------------------------------------------------

function normalizeSlug(value: string): string | null {
  const slug = value.trim();

  if (
    !slug ||
    slug.length > 200 ||
    slug.includes("/") ||
    slug.includes("\\") ||
    slug.includes("\0")
  ) {
    return null;
  }

  return slug;
}

// ----------------------------------------------------------
// DESCRIPTION SEO
// ----------------------------------------------------------

function getMetaDescription(
  shortDescription: string,
  content: string
): string {
  const source =
    shortDescription.trim() ||
    content
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  if (!source) {
    return DEFAULT_DESCRIPTION;
  }

  if (source.length <= 160) {
    return source;
  }

  return `${source.slice(0, 157).trimEnd()}...`;
}

// ----------------------------------------------------------
// IMAGE SEO
// ----------------------------------------------------------

function getMetaImage(
  imageUrl: string | null
): string {
  if (!imageUrl) {
    return DEFAULT_OG_IMAGE;
  }

  const image = imageUrl.trim();

  if (
    image.startsWith("/") &&
    !image.startsWith("//")
  ) {
    return image;
  }

  if (/^https:\/\//i.test(image)) {
    return image;
  }

  return DEFAULT_OG_IMAGE;
}

// ----------------------------------------------------------
// MÉTADONNÉES DYNAMIQUES
// ----------------------------------------------------------

export async function generateMetadata({
  params,
}: NewsDetailRouteProps): Promise<Metadata> {
  // Les métadonnées proviennent de la publication
  // réellement enregistrée dans la base de données.

  await connection();

  const { slug: rawSlug } = await params;

  const slug = normalizeSlug(rawSlug);

  if (!slug) {
    return {
      title: "Publication introuvable",
      description: DEFAULT_DESCRIPTION,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const publication = await getPublicNewsBySlug(slug);

  if (!publication) {
    return {
      title: "Publication introuvable",
      description: DEFAULT_DESCRIPTION,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description = getMetaDescription(
    publication.shortDescription,
    publication.content
  );

  const image = getMetaImage(
    publication.imageUrl
  );

  return {
    title: publication.title,

    description,

    keywords:
      publication.tags.length > 0
        ? publication.tags
        : undefined,

    openGraph: {
      type: "article",

      siteName: SITE_NAME,

      title: publication.title,

      description,

      images: [
        {
          url: image,
          alt: publication.title,
        },
      ],

      publishedTime:
        publication.publicationDate ?? undefined,

      modifiedTime:
        publication.updatedAt,

      authors: publication.authorName
        ? [publication.authorName]
        : undefined,

      section: publication.category,
    },

    twitter: {
      card: "summary_large_image",
      title: publication.title,
      description,
      images: [image],
    },

    robots: {
      index: true,
      follow: true,
    },
  };
}

// ----------------------------------------------------------
// CHARGEMENT DE LA PUBLICATION
// ----------------------------------------------------------

async function NewsDetailContent({
  slug,
}: {
  slug: string;
}) {
  // Récupération depuis Prisma / Supabase :
  //
  // - Publication publiée
  // - Titre et descriptions
  // - Photos réelles
  // - Catégorie
  // - Auteur et dates
  // - Campagnes associées
  // - Statistiques disponibles
  // - Publications récentes
  // - Catégories et compteurs
  //
  // Le composant NewsDetailPage gère uniquement
  // la présentation responsive.

  const data = await getPublicNewsDetailData(slug);

  if (!data) {
    notFound();
  }

  return <NewsDetailPage data={data} />;
}

// ----------------------------------------------------------
// PAGE PRINCIPALE
// ----------------------------------------------------------

export default async function NewsDetailRoute({
  params,
}: NewsDetailRouteProps) {
  // Attend la requête avant la lecture dynamique.
  // Compatible avec la configuration instant = false.

  await connection();

  const { slug: rawSlug } = await params;

  const slug = normalizeSlug(rawSlug);

  if (!slug) {
    notFound();
  }

  return <NewsDetailContent slug={slug} />;
}
