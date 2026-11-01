import { getPaymentRequestOrigin } from "@/lib/payments/request-origin";

/**
 * FONDATION SAUVONS DES VIES
 * =====================================================
 * src/app/api/payments/status/route.ts
 *
 * Consultation sécurisée du statut des paiements.
 *
 * GET  /api/payments/status
 * POST /api/payments/status
 *
 * GET :
 * - Lecture du statut enregistré en base.
 *
 * POST :
 * - Vérification auprès du prestataire.
 * - Confirmation uniquement côté serveur.
 * - Prise en charge du retour du widget Kkiapay.
 *
 * SÉCURITÉ :
 * - Jeton privé de consultation obligatoire.
 * - Jeton comparé en temps constant.
 * - Aucune clé secrète exposée.
 * - Aucune confiance accordée au statut client.
 * - Pas de mise en cache.
 *
 * IMPORTANT :
 * Le jeton doit être créé et enregistré par
 * le service de création des paiements.
 * =====================================================
 */

import {
  createHash,
  timingSafeEqual,
} from "node:crypto";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
} from "@/lib/payments/types";

import {
  getStoredPaymentStatus,
  verifyPaymentById,
  verifyKkiapayWidgetPayment,
} from "@/lib/payments/verification";

// =====================================================
// 1. CONFIGURATION
// =====================================================


const MAX_BODY_BYTES = 4096;

const RESPONSE_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store, private, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

// =====================================================
// 2. TYPES
// =====================================================

type StatusSuccess = {
  success: true;
  donationId: string;
  transactionId: string;
  status:
    | "PENDING"
    | "PROCESSING"
    | "CONFIRMED"
    | "FAILED"
    | "CANCELLED"
    | "EXPIRED";
  amount: number;
  currency: string;
  paymentMethod: string;
  confirmedAt: string | null;
};

type StatusFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    retryable: boolean;
  };
};

type StatusResponse =
  | StatusSuccess
  | StatusFailure;

type PaymentAccessData = {
  transactionId: string;
  accessToken: string;
};

// =====================================================
// 3. RÉPONSES JSON
// =====================================================

function jsonResponse(
  body: StatusResponse,
  status = 200
): NextResponse<StatusResponse> {
  return NextResponse.json(body, {
    status,
    headers: RESPONSE_HEADERS,
  });
}

function failure(
  status: number,
  code: string,
  message: string,
  retryable = false
): NextResponse<StatusResponse> {
  return jsonResponse(
    {
      success: false,
      error: {
        code,
        message,
        retryable,
      },
    },
    status
  );
}

// =====================================================
// 4. VALIDATION DES IDENTIFIANTS
// =====================================================

function isUuid(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

function isAccessToken(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    /^[a-f0-9]{64}$/i.test(value)
  );
}

function isProviderTransactionId(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    value.length >= 1 &&
    value.length <= 255 &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

// =====================================================
// 5. COMPARAISON SÉCURISÉE
// =====================================================

function hashAccessToken(
  token: string
): Buffer {
  return createHash("sha256")
    .update(token, "utf8")
    .digest();
}

function compareAccessToken(
  token: string,
  storedHash: string
): boolean {
  if (
    !/^[a-f0-9]{64}$/i.test(storedHash)
  ) {
    return false;
  }

  const actual = hashAccessToken(token);

  const expected = Buffer.from(
    storedHash,
    "hex"
  );

  return timingSafeEqual(
    actual,
    expected
  );
}

// =====================================================
// 6. AUTORISATION DE CONSULTATION
// =====================================================

async function authorizePaymentAccess(
  data: PaymentAccessData
): Promise<{
  id: string;
  donationId: string;
  provider: string;
  amount: number;
  currency: string;
  paymentMethod: string | null;
}> {
  const transaction =
    await prisma.paymentTransaction.findUnique({
      where: {
        id: data.transactionId,
      },
    });

  if (!transaction) {
    throw new Error("ACCESS_DENIED");
  }

  /**
   * Le hash du jeton est conservé
   * dans providerData.accessTokenHash.
   *
   * Aucun jeton en clair n'est stocké.
   */
  const providerData =
    transaction.providerData;

  if (
    !providerData ||
    typeof providerData !== "object" ||
    Array.isArray(providerData)
  ) {
    throw new Error("ACCESS_DENIED");
  }

  const storedHash =
    (providerData as Record<string, unknown>)
      .accessTokenHash;

  if (
    typeof storedHash !== "string" ||
    !compareAccessToken(
      data.accessToken,
      storedHash
    )
  ) {
    throw new Error("ACCESS_DENIED");
  }

  return {
    id: transaction.id,
    donationId: transaction.donationId,
    provider: transaction.provider,
    amount: transaction.amount,
    currency: transaction.currency,
    paymentMethod:
      transaction.paymentMethod,
  };
}

// =====================================================
// 7. CONTRÔLE D'ORIGINE
// =====================================================

// =====================================================
// 8. LECTURE JSON LIMITÉE
// =====================================================

async function readJsonBody(
  request: NextRequest
): Promise<unknown> {
  const contentType =
    request.headers.get("content-type") ?? "";

  if (
    !/^application\/json(?:\s*;|$)/i.test(
      contentType
    )
  ) {
    throw new Error(
      "INVALID_CONTENT_TYPE"
    );
  }

  const contentLength =
    request.headers.get("content-length");

  if (contentLength !== null) {
    const length = Number(
      contentLength
    );

    if (
      !Number.isSafeInteger(length) ||
      length < 0 ||
      length > MAX_BODY_BYTES
    ) {
      throw new Error(
        "INVALID_BODY_SIZE"
      );
    }
  }

  const text = await request.text();

  if (
    Buffer.byteLength(text, "utf8") >
    MAX_BODY_BYTES
  ) {
    throw new Error(
      "INVALID_BODY_SIZE"
    );
  }

  return JSON.parse(text) as unknown;
}

// =====================================================
// 9. CONSTRUCTION DU STATUT PUBLIC
// =====================================================

async function buildStatusResponse(
  transactionId: string
): Promise<StatusSuccess> {
  const stored =
    await getStoredPaymentStatus(
      transactionId
    );

  const transaction =
    await prisma.paymentTransaction.findUnique({
      where: {
        id: transactionId,
      },
      select: {
        amount: true,
        currency: true,
        paymentMethod: true,
      },
    });

  if (!transaction) {
    throw new Error(
      "PAYMENT_NOT_FOUND"
    );
  }

  return {
    success: true,

    donationId:
      stored.donationId,

    transactionId:
      stored.transactionId,

    status:
      stored.status,

    amount:
      transaction.amount,

    currency:
      transaction.currency,

    paymentMethod:
      transaction.paymentMethod ??
      "MOBILE_MONEY",

    confirmedAt:
      stored.confirmedAt
        ? stored.confirmedAt.toISOString()
        : null,
  };
}

// =====================================================
// 10. GET : CONSULTATION DU STATUT
// =====================================================

export async function GET(
  request: NextRequest
): Promise<NextResponse<StatusResponse>> {
  const transactionId =
    request.nextUrl.searchParams.get(
      "transactionId"
    );

  /**
   * Le jeton est transmis dans
   * l'en-tête HTTP, jamais dans l'URL.
   */
  const accessToken =
    request.headers.get(
      "x-payment-access-token"
    );

  if (
    !isUuid(transactionId) ||
    !isAccessToken(accessToken)
  ) {
    return failure(
      400,
      "INVALID_REQUEST",
      "Informations de consultation invalides."
    );
  }

  try {
    await authorizePaymentAccess({
      transactionId,
      accessToken,
    });

    const result =
      await buildStatusResponse(
        transactionId
      );

    return jsonResponse(result);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ACCESS_DENIED"
    ) {
      return failure(
        403,
        "UNAUTHORIZED",
        "Accès au paiement non autorisé."
      );
    }

    console.error(
      "[payments/status] GET failed:",
      error instanceof Error
        ? error.message
        : "Unknown error"
    );

    return failure(
      500,
      "INTERNAL_ERROR",
      "Impossible de consulter le statut du paiement.",
      true
    );
  }
}

// =====================================================
// 11. POST : VÉRIFICATION DU PAIEMENT
// =====================================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<StatusResponse>> {
  if (!getPaymentRequestOrigin(request)) {
    return failure(
      403,
      "UNAUTHORIZED",
      "Origine non autorisée."
    );
  }

  let body: unknown;

  try {
    body = await readJsonBody(
      request
    );
  } catch {
    return failure(
      400,
      "INVALID_REQUEST",
      "Requête JSON invalide."
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return failure(
      400,
      "INVALID_REQUEST",
      "Données de paiement invalides."
    );
  }

  const data =
    body as Record<string, unknown>;

  const transactionId =
    data.transactionId;

  const accessToken =
    request.headers.get(
      "x-payment-access-token"
    );

  if (
    !isUuid(transactionId) ||
    !isAccessToken(accessToken)
  ) {
    return failure(
      400,
      "INVALID_REQUEST",
      "Identifiants de paiement invalides."
    );
  }

  const providerTransactionId =
    data.providerTransactionId;

  if (
    providerTransactionId !== undefined &&
    !isProviderTransactionId(
      providerTransactionId
    )
  ) {
    return failure(
      400,
      "INVALID_REQUEST",
      "Référence du prestataire invalide."
    );
  }

  try {
    const transaction =
      await authorizePaymentAccess({
        transactionId,
        accessToken,
      });

    if (
      providerTransactionId !== undefined
    ) {
      if (
        transaction.provider !== "KKIAPAY"
      ) {
        return failure(
          400,
          "INVALID_REQUEST",
          "Une référence de widget n'est pas attendue pour ce prestataire."
        );
      }

      await verifyKkiapayWidgetPayment(
        transactionId,
        providerTransactionId
      );
    } else {
      await verifyPaymentById(
        transactionId
      );
    }

    const result =
      await buildStatusResponse(
        transactionId
      );

    return jsonResponse(result);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ACCESS_DENIED"
    ) {
      return failure(
        403,
        "UNAUTHORIZED",
        "Accès au paiement non autorisé."
      );
    }

    console.error(
      "[payments/status] POST verification failed:",
      error instanceof Error
        ? error.message
        : "Unknown error"
    );

    return failure(
      503,
      "VERIFICATION_FAILED",
      "La vérification du paiement n'a pas abouti. Veuillez réessayer.",
      true
    );
  }
}
