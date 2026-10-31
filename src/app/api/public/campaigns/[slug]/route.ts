import { localizePublicContent } from "@/lib/i18n/public-content";

import { connection, NextResponse } from "next/server";

import { getPublicCampaignDetail } from "@/lib/public/campaign-detail-data";

// ==========================================================
// FONDATION SAUVONS DES VIES
// API PUBLIQUE — DÉTAIL D'UNE CAMPAGNE
// ==========================================================
//
// Endpoint : GET /api/public/campaigns/[slug]
//
// Next.js 16 / App Router / TypeScript
//
// Responsabilités :
// - Validation du slug
// - Lecture d'une campagne publiée
// - Informations du bénéficiaire
// - Galerie de photos
// - Dons confirmés et progression
// - Publications et mises à jour
// - Campagnes similaires
// - Gestion des erreurs HTTP
// - Réponses JSON non mises en cache
//
// Sécurité :
// - Aucune donnée administrative privée
// - Aucune information de paiement sensible
// - Aucun accès aux campagnes non publiées
// - Aucun montant inventé
//
// ==========================================================

// ----------------------------------------------------------
// CONFIGURATION
// ----------------------------------------------------------
// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

type PublicApiErrorCode =
  | "INVALID_SLUG"
  | "NOT_FOUND"
  | "CAMPAIGN_UNAVAILABLE"
  | "INTERNAL_ERROR";

// ----------------------------------------------------------
// EN-TÊTES HTTP
// ----------------------------------------------------------

const RESPONSE_HEADERS = {
  "Cache-Control":
    "private, no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "X-Content-Type-Options": "nosniff",
} as const;

// ----------------------------------------------------------
// VALIDATION DU SLUG
// ----------------------------------------------------------

const MAX_SLUG_LENGTH = 200;

function normalizeSlug(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function isValidSlug(slug: string): boolean {
  if (
    slug.length === 0 ||
    slug.length > MAX_SLUG_LENGTH
  ) {
    return false;
  }

  return /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(
    slug
  );
}

// ----------------------------------------------------------
// RÉPONSE D'ERREUR
// ----------------------------------------------------------

function errorResponse(
  status: number,
  code: PublicApiErrorCode,
  message: string
) {
  return NextResponse.json(
    {
      success: false,
      campaign: null,
      error: {
        code,
        message,
      },
    },
    {
      status,
      headers: RESPONSE_HEADERS,
    }
  );
}

// ----------------------------------------------------------
// RÉPONSE DE SUCCÈS
// ----------------------------------------------------------

function successResponse(
  campaign: NonNullable<
    Awaited<
      ReturnType<typeof getPublicCampaignDetail>
    >
  >
) {
  return NextResponse.json(
    {
      success: true,
      campaign,
      error: null,
    },
    {
      status: 200,
      headers: RESPONSE_HEADERS,
    }
  );
}

// ----------------------------------------------------------
// GET — DÉTAIL D'UNE CAMPAGNE
// ----------------------------------------------------------

export async function GET(
  request: Request,
  context: RouteContext
) {
  // --------------------------------------------------------
  // EXÉCUTION DYNAMIQUE — NEXT.JS 16
  // --------------------------------------------------------
  //
  // Le détail contient des données variables :
  // - Dons confirmés
  // - Progression
  // - Dates de campagne
  // - Mises à jour
  //
  // connection() évite leur prérendu statique.

  await connection();

  try {
    // ------------------------------------------------------
    // LECTURE DES PARAMÈTRES
    // ------------------------------------------------------

    const { slug: rawSlug } =
      await context.params;

    const slug = normalizeSlug(rawSlug);

    // ------------------------------------------------------
    // VALIDATION
    // ------------------------------------------------------

    if (!isValidSlug(slug)) {
      return errorResponse(
        400,
        "INVALID_SLUG",
        "L'adresse de cette campagne est invalide."
      );
    }

    // ------------------------------------------------------
    // LECTURE DES DONNÉES
    // ------------------------------------------------------
    //
    // Le service Prisma doit :
    //
    // 1. Rechercher la campagne par son slug.
    // 2. Vérifier qu'elle est publiée.
    // 3. Récupérer ses photos ordonnées.
    // 4. Calculer les dons confirmés.
    // 5. Récupérer les publications publiques.
    // 6. Récupérer les campagnes similaires.
    // 7. Ne retourner aucune donnée privée.

    const campaign =
      await getPublicCampaignDetail(slug);

    // ------------------------------------------------------
    // CAMPAGNE INTROUVABLE
    // ------------------------------------------------------

    if (!campaign) {
      return errorResponse(
        404,
        "NOT_FOUND",
        "Cette campagne est introuvable ou n'est plus disponible."
      );
    }

    // ------------------------------------------------------
    // VÉRIFICATION MINIMALE DE LA RÉPONSE
    // ------------------------------------------------------

    if (
      !campaign.id ||
      !campaign.slug ||
      !campaign.title
    ) {
      console.error(
        "[PUBLIC_CAMPAIGN_DETAIL] Données de campagne incomplètes.",
        {
          slug,
        }
      );

      return errorResponse(
        503,
        "CAMPAIGN_UNAVAILABLE",
        "Les informations de cette campagne sont temporairement indisponibles."
      );
    }

    // ------------------------------------------------------
    // RÉPONSE PUBLIQUE
    // ------------------------------------------------------

    return successResponse(await localizePublicContent(campaign, new URL(request.url).searchParams.get("lang")));
  } catch (error) {
    // ------------------------------------------------------
    // JOURNALISATION SERVEUR
    // ------------------------------------------------------
    //
    // Les détails techniques ne sont jamais envoyés
    // aux visiteurs.

    console.error(
      "[PUBLIC_CAMPAIGN_DETAIL] Erreur GET :",
      error
    );

    // ------------------------------------------------------
    // RÉPONSE GÉNÉRIQUE
    // ------------------------------------------------------

    return errorResponse(
      503,
      "CAMPAIGN_UNAVAILABLE",
      "Impossible de charger cette campagne pour le moment. Veuillez réessayer."
    );
  }
}
