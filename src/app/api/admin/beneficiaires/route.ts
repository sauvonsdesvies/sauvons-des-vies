import { NextRequest, NextResponse } from "next/server";

import { unstable_rethrow } from "next/navigation";

import { getAdminSession } from "@/lib/admin-auth";

import {
  getPublicStatistics,
  savePublicStatistics,
} from "@/lib/statistics/service";

// ==========================================
// FONDATION SAUVONS DES VIES
// API ADMIN — STATISTIQUES BÉNÉFICIAIRES
// ==========================================

// Vérification de la session administrateur
// Réutilisation du système existant du projet.

// ==========================================
// PROTECTION DES REQUÊTES
// ==========================================

function sameOrigin(
  request: NextRequest
): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return false;
  }

  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);

    return originUrl.origin === requestUrl.origin;
  } catch {
    return false;
  }
}

// ==========================================
// RÉPONSES D'ERREUR
// ==========================================

function unauthorized() {
  return NextResponse.json(
    {
      success: false,
      error: "Session administrateur requise.",
    },
    {
      status: 401,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

function forbidden() {
  return NextResponse.json(
    {
      success: false,
      error: "Origine de la requête non autorisée.",
    },
    {
      status: 403,
    }
  );
}

function invalidData(message: string) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    {
      status: 400,
    }
  );
}

// ==========================================
// GET — LIRE LES STATISTIQUES
// ==========================================

export async function GET() {
  try {
    const authorized = await getAdminSession();

    if (!authorized) {
      return unauthorized();
    }

    const statistics = await getPublicStatistics();

    return NextResponse.json(
      {
        success: true,
        statistics,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    unstable_rethrow(error);
    console.error(
      "[ADMIN BENEFICIAIRES GET]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Impossible de charger les statistiques.",
      },
      {
        status: 500,
      }
    );
  }
}

// ==========================================
// PUT — MODIFIER LES STATISTIQUES
// ==========================================

export async function PUT(
  request: NextRequest
) {
  try {
    // Vérification de l'origine de la requête

    if (!sameOrigin(request)) {
      return forbidden();
    }

    // Vérification de la session existante

    const authorized = await getAdminSession();

    if (!authorized) {
      return unauthorized();
    }

    // Lecture des données

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return invalidData(
        "Le contenu de la requête est invalide."
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return invalidData(
        "Les données envoyées sont invalides."
      );
    }

    const data = body as Record<
      string,
      unknown
    >;

    // Champs autorisés

    const fields = [
      "activeCampaigns",
      "beneficiariesHelped",
      "verifiedFiles",
    ] as const;

    // Validation des chiffres

    for (const field of fields) {
      const value = data[field];

      if (
        typeof value !== "number" ||
        !Number.isSafeInteger(value) ||
        value < 0
      ) {
        return invalidData(
          `La valeur du champ ${field} est invalide.`
        );
      }
    }

    // Valeurs validées

    const activeCampaigns =
      data.activeCampaigns as number;

    const beneficiariesHelped =
      data.beneficiariesHelped as number;

    const verifiedFiles =
      data.verifiedFiles as number;

    // Enregistrement dans la base existante

    const statistics =
      await savePublicStatistics({
        activeCampaigns,
        beneficiariesHelped,
        verifiedFiles,
      });

    // Réponse après enregistrement

    return NextResponse.json(
      {
        success: true,
        message:
          "Les statistiques ont été enregistrées avec succès.",
        statistics,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    unstable_rethrow(error);
    console.error(
      "[ADMIN BENEFICIAIRES PUT]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Impossible d'enregistrer les statistiques.",
      },
      {
        status: 500,
      }
    );
  }
}
