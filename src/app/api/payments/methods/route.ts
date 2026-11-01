
/**
 * FONDATION SAUVONS DES VIES
 * ==================================================
 * src/app/api/payments/methods/route.ts
 *
 * API publique des moyens de paiement.
 *
 * GET /api/payments/methods
 *
 * Responsabilités :
 * - Lire les moyens activés dans Supabase.
 * - Afficher uniquement les moyens configurés.
 * - Ne jamais exposer les prestataires.
 * - Ne jamais exposer les clés API.
 * - Prendre en charge FR, EN, DE et ES.
 * - Empêcher la mise en cache des disponibilités.
 * - Retourner des réponses JSON contrôlées.
 *
 * Compatible avec Next.js App Router.
 * ==================================================
 */

import { NextRequest, NextResponse } from "next/server";

import {
  DEFAULT_PAYMENT_CURRENCY,
  DEFAULT_PAYMENT_LANGUAGE,
  isPaymentLanguage,
  type AvailablePaymentMethodsResponse,
  type PaymentLanguage,
} from "@/lib/payments/types";

import {
  getAvailablePaymentMethodsResponse,
} from "@/lib/payments/methods";

// ==================================================
// 1. CONFIGURATION DE LA ROUTE
// ==================================================


// ==================================================
// 2. EN-TÊTES DE SÉCURITÉ
// ==================================================

const RESPONSE_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

// ==================================================
// 3. LANGUES AUTORISÉES
// ==================================================

function resolveLanguage(
  request: NextRequest
): PaymentLanguage {
  const languageParam =
    request.nextUrl.searchParams.get("lang");

  if (languageParam !== null) {
    const normalized =
      languageParam.trim().toLowerCase();

    if (isPaymentLanguage(normalized)) {
      return normalized;
    }

    return DEFAULT_PAYMENT_LANGUAGE;
  }

  const acceptLanguage =
    request.headers.get("accept-language");

  if (!acceptLanguage) {
    return DEFAULT_PAYMENT_LANGUAGE;
  }

  const preferences = acceptLanguage
    .split(",")
    .map((entry) => {
      const [languagePart, ...parameters] =
        entry.trim().split(";");

      const language = languagePart
        ?.trim()
        .toLowerCase()
        .split("-")[0];

      let quality = 1;

      for (const parameter of parameters) {
        const match = parameter
          .trim()
          .match(/^q=(0(?:\.\d{1,3})?|1(?:\.0{1,3})?)$/);

        if (match) {
          quality = Number(match[1]);
        }
      }

      return {
        language,
        quality,
      };
    })
    .filter(
      (item) =>
        item.quality > 0 &&
        item.language
    )
    .sort(
      (a, b) =>
        b.quality - a.quality
    );

  for (const preference of preferences) {
    if (
      isPaymentLanguage(
        preference.language
      )
    ) {
      return preference.language;
    }
  }

  return DEFAULT_PAYMENT_LANGUAGE;
}

// ==================================================
// 4. DEVISE
// ==================================================

/**
 * La devise est déterminée par le serveur.
 *
 * On ne laisse pas un paramètre public
 * activer arbitrairement une autre devise.
 *
 * La prise en charge d'autres devises
 * nécessitera leur activation explicite
 * dans le service de paiement.
 */

function resolveCurrency(): string {
  return DEFAULT_PAYMENT_CURRENCY;
}

// ==================================================
// 5. CONSTRUCTION DES RÉPONSES
// ==================================================

function jsonResponse(
  body: AvailablePaymentMethodsResponse,
  status: number
): NextResponse<AvailablePaymentMethodsResponse> {
  return NextResponse.json(body, {
    status,
    headers: RESPONSE_HEADERS,
  });
}

// ==================================================
// 6. GET /api/payments/methods
// ==================================================

export async function GET(
  request: NextRequest
): Promise<NextResponse<AvailablePaymentMethodsResponse>> {
  const language = resolveLanguage(request);

  const currency = resolveCurrency();

  try {
    const result =
      await getAvailablePaymentMethodsResponse({
        language,
        currency,
      });

    if (!result.success) {
      return jsonResponse(
        {
          success: false,
          methods: [],
          currency,
          error: {
            code: "PROVIDER_UNAVAILABLE",
            message:
              "Les moyens de paiement sont temporairement indisponibles.",
            retryable: true,
          },
        },
        503
      );
    }

    /**
     * Protection supplémentaire :
     * seules les données publiques
     * nécessaires au formulaire
     * sont retournées.
     *
     * Aucun nom de prestataire,
     * identifiant marchand ou secret
     * n'est inclus dans cette réponse.
     */

    const publicMethods = result.methods.map(
      (method) => ({
        id: method.id,
        label: method.label,
        description: method.description,
        enabled: method.enabled,
        requiresPhone: method.requiresPhone,
        requiresEmail: method.requiresEmail,
      })
    );

    return jsonResponse(
      {
        success: true,
        methods: publicMethods,
        currency,
      },
      200
    );
  } catch (error) {
    console.error(
      "[api/payments/methods] Unexpected error:",
      error instanceof Error
        ? error.message
        : "Unknown error"
    );

    return jsonResponse(
      {
        success: false,
        methods: [],
        currency,
        error: {
          code: "INTERNAL_ERROR",
          message:
            "Impossible de récupérer les moyens de paiement pour le moment.",
          retryable: true,
        },
      },
      500
    );
  }
}
