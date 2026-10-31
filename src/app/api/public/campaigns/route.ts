import { localizePublicContent } from "@/lib/i18n/public-content";

import { connection, NextResponse } from "next/server";

import {
  getPublicCampaigns,
} from "@/lib/public/campaigns-data";

// ==========================================================
// FONDATION SAUVONS DES VIES
// API PUBLIQUE — CAMPAGNES DE DONS
// ==========================================================
//
// GET /api/public/campaigns
//
// - Lecture des campagnes publiques
// - Campagnes urgentes et ordinaires
// - Recherche par mots-clés
// - Filtrage par catégorie, statut et pays
// - Tri et pagination
// - Actualisation sans cache HTTP
// - Aucune exposition des données privées
// - Compatible Next.js 16 / Cache Components
//
// Ne pas ajouter :
// export const runtime = "nodejs";
//
// ==========================================================

// ----------------------------------------------------------
// CONFIGURATION
// ----------------------------------------------------------

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 60;
const MAX_SEARCH_LENGTH = 200;
const MAX_FILTER_LENGTH = 100;

const ALLOWED_SORTS = [
  "newest",
  "oldest",
  "most-funded",
  "least-funded",
  "ending-soon",
] as const;

type CampaignSort = (typeof ALLOWED_SORTS)[number];

type CampaignQuery = {
  search: string;
  category: string;
  status: string;
  country: string;
  sort: CampaignSort;
  page: number;
  pageSize: number;
};

type PublicCampaignsApiError = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

// ----------------------------------------------------------
// EN-TÊTES HTTP
// ----------------------------------------------------------

const RESPONSE_HEADERS = {
  "Cache-Control":
    "private, no-store, no-cache, max-age=0, must-revalidate",
  "X-Content-Type-Options": "nosniff",
} as const;

// ----------------------------------------------------------
// OUTILS DE VALIDATION
// ----------------------------------------------------------

function normalizeText(
  value: string | null,
  maxLength: number
): string {
  if (!value) {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function normalizePositiveInteger(
  value: string | null,
  fallback: number,
  maximum: number
): number {
  if (!value) {
    return fallback;
  }

  if (!/^\d+$/.test(value)) {
    return fallback;
  }

  const parsed = Number(value);

  if (
    !Number.isSafeInteger(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  return Math.min(parsed, maximum);
}

function normalizeSort(
  value: string | null
): CampaignSort {
  if (
    value &&
    ALLOWED_SORTS.some((sort) => sort === value)
  ) {
    return value as CampaignSort;
  }

  return "newest";
}

// ----------------------------------------------------------
// LECTURE DES PARAMÈTRES
// ----------------------------------------------------------

function parseCampaignQuery(
  searchParams: URLSearchParams
): CampaignQuery {
  return {
    search: normalizeText(
      searchParams.get("search"),
      MAX_SEARCH_LENGTH
    ),

    category: normalizeText(
      searchParams.get("category"),
      MAX_FILTER_LENGTH
    ),

    status: normalizeText(
      searchParams.get("status"),
      MAX_FILTER_LENGTH
    ),

    country: normalizeText(
      searchParams.get("country"),
      MAX_FILTER_LENGTH
    ),

    sort: normalizeSort(
      searchParams.get("sort")
    ),

    page: normalizePositiveInteger(
      searchParams.get("page"),
      1,
      Number.MAX_SAFE_INTEGER
    ),

    pageSize: normalizePositiveInteger(
      searchParams.get("pageSize"),
      DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    ),
  };
}

// ----------------------------------------------------------
// RÉPONSE D'ERREUR PUBLIQUE
// ----------------------------------------------------------

function errorResponse(
  status: number,
  code: string,
  message: string
) {
  const response: PublicCampaignsApiError = {
    success: false,
    error: {
      code,
      message,
    },
  };

  return NextResponse.json(response, {
    status,
    headers: RESPONSE_HEADERS,
  });
}

// ----------------------------------------------------------
// GET — LISTE PUBLIQUE DES CAMPAGNES
// ----------------------------------------------------------

export async function GET(request: Request) {
  // Empêche la génération d'une réponse statique.
  // Compatible avec cacheComponents.

  await connection();

  try {
    const url = new URL(request.url);

    const query = parseCampaignQuery(
      url.searchParams
    );

    // Le service doit :
    //
    // 1. Lire uniquement les campagnes publiées.
    // 2. Inclure les campagnes urgentes et ordinaires.
    // 3. Appliquer les filtres et le tri.
    // 4. Calculer la pagination.
    // 5. Retourner uniquement des données publiques.
    //
    // Les noms réels des modèles Prisma restent
    // définis dans campaigns-data.ts.

    const result = await localizePublicContent(await getPublicCampaigns(query), url.searchParams.get("lang"));

    return NextResponse.json(
      {
        success: true,
        campaigns: result.campaigns,
        pagination: result.pagination,
        categories: result.categories,
      },
      {
        status: 200,
        headers: RESPONSE_HEADERS,
      }
    );
  } catch (error: unknown) {
    // Les détails internes sont uniquement
    // enregistrés côté serveur.

    console.error(
      "[PUBLIC_CAMPAIGNS_API] Lecture impossible.",
      error instanceof Error
        ? error.name
        : "UnknownError"
    );

    return errorResponse(
      503,
      "CAMPAIGNS_UNAVAILABLE",
      "Les campagnes de dons sont temporairement indisponibles."
    );
  }
}
