import { localizePublicContent } from "@/lib/i18n/public-content";

import { NextResponse, connection } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { getPublicHomeData } from "@/lib/public/home-data";
import type { HomeData } from "@/lib/public/home-types";

import {
  type PublicStatistics,
} from "@/lib/statistics/service";

// ==========================================================
// FONDATION SAUVONS DES VIES
// API PUBLIQUE — PAGE D'ACCUEIL
// ==========================================================
//
// GET /api/public/home
//
// - Lecture des statistiques officielles
// - Même source que /admin/beneficiaires
// - Aucun accès aux données privées
// - Aucun montant total collecté
// - Lecture dynamique de PostgreSQL
// - Réponse non mise en cache
// - Compatible Next.js 16.4.3 / Cache Components
// - Compatible Prisma 7 / Supabase
//
// IMPORTANT :
// Ne pas déclarer export const runtime = "nodejs"
// lorsque cacheComponents est activé.
//
// ==========================================================

// ----------------------------------------------------------
// STRUCTURE DE LA RÉPONSE
// ----------------------------------------------------------

export type PublicHomeApiResponse =
  | {
      success: true;
      statistics: PublicStatistics;
      data: HomeData;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
      };
    };

// ----------------------------------------------------------
// EN-TÊTES DE SÉCURITÉ ET DE CACHE
// ----------------------------------------------------------

const RESPONSE_HEADERS = {
  "Cache-Control":
    "private, no-store, no-cache, max-age=0, must-revalidate",
  "X-Content-Type-Options": "nosniff",
} as const;

// ----------------------------------------------------------
// GET — STATISTIQUES OFFICIELLES
// ----------------------------------------------------------

export async function GET(request: Request) {
  // Lecture dynamique à chaque requête.
  // Empêche la génération d'une réponse statique
  // contenant des statistiques anciennes.

  await connection();

  try {
    // Récupération des données officielles.
    // Le service est également utilisé par
    // l'administration /admin/beneficiaires.

    const data = await localizePublicContent(await getPublicHomeData(), new URL(request.url).searchParams.get("lang"));
    const statistics = data.statistics;

    // Construction explicite de la réponse.
    // Aucune donnée personnelle n'est exposée.

    const response: PublicHomeApiResponse = {
      success: true,
      data,
      statistics: {
        activeCampaigns: statistics.activeCampaigns,
        beneficiariesHelped:
          statistics.beneficiariesHelped,
        verifiedFiles: statistics.verifiedFiles,
        updatedAt: statistics.updatedAt,
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: RESPONSE_HEADERS,
    });
  } catch (error: unknown) {
    unstable_rethrow(error);
    // Journalisation interne uniquement.
    // Aucun détail technique ou secret n'est
    // transmis aux visiteurs.

    console.error(
      "[PUBLIC_HOME_API] Impossible de lire les statistiques.",
      error instanceof Error
        ? error.name
        : "UnknownError"
    );

    const response: PublicHomeApiResponse = {
      success: false,
      error: {
        code: "STATISTICS_UNAVAILABLE",
        message:
          "Les statistiques sont temporairement indisponibles.",
      },
    };

    return NextResponse.json(response, {
      status: 503,
      headers: RESPONSE_HEADERS,
    });
  }
}
