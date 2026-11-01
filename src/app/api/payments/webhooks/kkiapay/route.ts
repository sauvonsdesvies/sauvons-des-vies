
/**
 * FONDATION SAUVONS DES VIES
 * ============================================================
 * src/app/api/payments/webhooks/kkiapay/route.ts
 *
 * Webhook Kkiapay - production
 *
 * - Authentification par x-kkiapay-secret
 * - Contrôle du corps JSON
 * - Rapprochement avec la transaction Prisma
 * - Contrôle du partenaire, montant et méthode
 * - Vérification indépendante auprès de Kkiapay
 * - Confirmation idempotente dans verification.ts
 * - Aucune confirmation basée sur le webhook seul
 *
 * Documentation :
 * https://docs.kkiapay.me/v1/tableau-de-bord/webhook
 * ============================================================
 */

import "server-only";

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
  verifyKkiapayWidgetPayment,
} from "@/lib/payments/verification";

// ============================================================
// 1. CONFIGURATION
// ============================================================


const MAX_BODY_BYTES = 32 * 1024;

const RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

type JsonRecord = Record<string, unknown>;

type WebhookResponse = {
  received: boolean;
  processed?: boolean;
  error?: string;
};

type KkiapayWebhook = {
  event: "transaction.success" | "transaction.failed";
  transactionId: string;
  partnerId: string;
  amount: number;
  method: "MOBILE_MONEY" | "WALLET" | "CARD";
  isPaymentSucces: boolean;
};

// ============================================================
// 2. RÉPONSES HTTP
// ============================================================

function respond(
  status: number,
  body: WebhookResponse
): NextResponse<WebhookResponse> {
  return NextResponse.json(body, {
    status,
    headers: RESPONSE_HEADERS,
  });
}

// ============================================================
// 3. VALIDATION
// ============================================================

function isRecord(
  value: unknown
): value is JsonRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

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

function isExternalId(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 255 &&
    value === value.trim() &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

function parseWebhook(
  value: unknown
): KkiapayWebhook | null {
  if (!isRecord(value)) {
    return null;
  }

  const {
    event,
    transactionId,
    partnerId,
    amount,
    method,
    isPaymentSucces,
  } = value;

  if (
    event !== "transaction.success" &&
    event !== "transaction.failed"
  ) {
    return null;
  }

  if (
    !isExternalId(transactionId) ||
    !isUuid(partnerId)
  ) {
    return null;
  }

  if (
    typeof amount !== "number" ||
    !Number.isSafeInteger(amount) ||
    amount <= 0
  ) {
    return null;
  }

  if (
    method !== "MOBILE_MONEY" &&
    method !== "WALLET" &&
    method !== "CARD"
  ) {
    return null;
  }

  if (typeof isPaymentSucces !== "boolean") {
    return null;
  }

  if (
    (event === "transaction.success" &&
      isPaymentSucces !== true) ||
    (event === "transaction.failed" &&
      isPaymentSucces !== false)
  ) {
    return null;
  }

  return {
    event,
    transactionId,
    partnerId,
    amount,
    method,
    isPaymentSucces,
  };
}

// ============================================================
// 4. AUTHENTIFICATION DU WEBHOOK
// ============================================================

/**
 * La documentation Kkiapay v1 décrit l'en-tête
 * x-kkiapay-secret contenant le secret hash
 * configuré dans le tableau de bord marchand.
 *
 * La comparaison est réalisée en temps constant.
 *
 * Ce secret n'est pas la clé privée de l'API.
 */

function verifyWebhookSecret(
  received: string | null,
  configured: string
): boolean {
  if (
    !received ||
    !configured ||
    received.length > 4096
  ) {
    return false;
  }

  const receivedDigest = createHash("sha256")
    .update(received, "utf8")
    .digest();

  const configuredDigest = createHash("sha256")
    .update(configured, "utf8")
    .digest();

  return timingSafeEqual(
    receivedDigest,
    configuredDigest
  );
}

// ============================================================
// 5. LECTURE JSON AVEC LIMITE RÉELLE
// ============================================================

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
    throw new Error("INVALID_CONTENT_TYPE");
  }

  const declaredLength =
    request.headers.get("content-length");

  if (declaredLength !== null) {
    const length = Number(declaredLength);

    if (
      !Number.isSafeInteger(length) ||
      length < 0 ||
      length > MAX_BODY_BYTES
    ) {
      throw new Error("INVALID_BODY_SIZE");
    }
  }

  if (!request.body) {
    throw new Error("EMPTY_BODY");
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      total += value.byteLength;

      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new Error("INVALID_BODY_SIZE");
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  if (total === 0) {
    throw new Error("EMPTY_BODY");
  }

  const bytes = new Uint8Array(total);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const decoder = new TextDecoder(
    "utf-8",
    { fatal: true }
  );

  return JSON.parse(
    decoder.decode(bytes)
  ) as unknown;
}

// ============================================================
// 6. CONTRÔLE DU MOYEN DE PAIEMENT
// ============================================================

function isCompatibleMethod(
  internalMethod: string | null,
  externalMethod: KkiapayWebhook["method"]
): boolean {
  if (internalMethod === "MOBILE_MONEY") {
    return externalMethod === "MOBILE_MONEY";
  }

  if (internalMethod === "CARD") {
    return externalMethod === "CARD";
  }

  /**
   * Le service Kkiapay précédemment créé
   * ne prend pas en charge WAVE.
   *
   * Ne jamais convertir WALLET en WAVE
   * sans validation de l'intégration réelle.
   */
  return false;
}

// ============================================================
// 7. RAPPROCHEMENT PRISMA
// ============================================================

async function findAndValidateTransaction(
  payload: KkiapayWebhook
): Promise<{
  id: string;
  alreadyConfirmed: boolean;
}> {
  /**
   * Dans kkiapay.ts, partnerId est initialisé
   * avec l'identifiant interne PaymentTransaction.
   *
   * Il permet de retrouver exactement
   * la transaction concernée.
   */

  const transaction =
    await prisma.paymentTransaction.findUnique({
      where: {
        id: payload.partnerId,
      },

      select: {
        id: true,
        provider: true,
        providerTransactionId: true,
        paymentMethod: true,
        amount: true,
        currency: true,
        status: true,
        donation: {
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
          },
        },
      },
    });

  if (!transaction) {
    throw new Error("TRANSACTION_NOT_FOUND");
  }

  if (transaction.provider !== "KKIAPAY") {
    throw new Error("PROVIDER_MISMATCH");
  }

  if (
    transaction.providerTransactionId &&
    transaction.providerTransactionId !==
      payload.transactionId
  ) {
    throw new Error("PROVIDER_TRANSACTION_MISMATCH");
  }

  if (
    transaction.amount !== payload.amount ||
    transaction.donation.amount !== payload.amount
  ) {
    throw new Error("AMOUNT_MISMATCH");
  }

  if (
    transaction.currency !== "XOF" ||
    transaction.donation.currency !== "XOF"
  ) {
    throw new Error("CURRENCY_MISMATCH");
  }

  if (
    !isCompatibleMethod(
      transaction.paymentMethod,
      payload.method
    )
  ) {
    throw new Error("PAYMENT_METHOD_MISMATCH");
  }

  /**
   * Empêche une même référence Kkiapay
   * d'être associée à deux dons différents.
   */
  const conflictingTransaction =
    await prisma.paymentTransaction.findFirst({
      where: {
        provider: "KKIAPAY",
        providerTransactionId:
          payload.transactionId,
        id: {
          not: transaction.id,
        },
      },
      select: {
        id: true,
      },
    });

  if (conflictingTransaction) {
    throw new Error("DUPLICATE_PROVIDER_TRANSACTION");
  }

  return {
    id: transaction.id,

    alreadyConfirmed:
      transaction.status === "CONFIRMED" &&
      transaction.donation.status === "CONFIRMED",
  };
}

// ============================================================
// 8. WEBHOOK POST
// ============================================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<WebhookResponse>> {
  // ----------------------------------------------------------
  // A. Secret obligatoire
  // ----------------------------------------------------------

  const webhookSecret =
    process.env.KKIAPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error(
      "[kkiapay/webhook] Missing KKIAPAY_WEBHOOK_SECRET"
    );

    return respond(503, {
      received: false,
      error: "Service unavailable",
    });
  }

  // ----------------------------------------------------------
  // B. Authentification de la notification
  // ----------------------------------------------------------

  const receivedSecret =
    request.headers.get("x-kkiapay-secret");

  if (
    !verifyWebhookSecret(
      receivedSecret,
      webhookSecret
    )
  ) {
    return respond(401, {
      received: false,
      error: "Unauthorized",
    });
  }

  // ----------------------------------------------------------
  // C. Lecture de la notification
  // ----------------------------------------------------------

  let body: unknown;

  try {
    body = await readJsonBody(request);
  } catch {
    return respond(400, {
      received: false,
      error: "Invalid JSON payload",
    });
  }

  // ----------------------------------------------------------
  // D. Identification de l'événement
  // ----------------------------------------------------------

  if (!isRecord(body)) {
    return respond(400, {
      received: false,
      error: "Invalid event",
    });
  }

  /**
   * Un événement de test ou non pris en charge
   * ne déclenche aucune opération financière.
   */
  if (
    body.event !== "transaction.success" &&
    body.event !== "transaction.failed"
  ) {
    return respond(200, {
      received: true,
      processed: false,
    });
  }

  const payload = parseWebhook(body);

  if (!payload) {
    return respond(400, {
      received: false,
      error: "Invalid transaction payload",
    });
  }

  // ----------------------------------------------------------
  // E. Contrôle de la transaction
  // ----------------------------------------------------------

  let internal: {
    id: string;
    alreadyConfirmed: boolean;
  };

  try {
    internal =
      await findAndValidateTransaction(payload);
  } catch (error) {
    const reason =
      error instanceof Error
        ? error.message
        : "UNKNOWN_ERROR";

    console.error(
      "[kkiapay/webhook] Transaction validation failed",
      {
        reason,
        partnerId: payload.partnerId,
      }
    );

    if (
      reason === "TRANSACTION_NOT_FOUND"
    ) {
      return respond(503, {
        received: false,
        error: "Transaction not available",
      });
    }

    if (
      reason === "PROVIDER_MISMATCH" ||
      reason === "PROVIDER_TRANSACTION_MISMATCH" ||
      reason === "AMOUNT_MISMATCH" ||
      reason === "CURRENCY_MISMATCH" ||
      reason === "PAYMENT_METHOD_MISMATCH" ||
      reason === "DUPLICATE_PROVIDER_TRANSACTION"
    ) {
      return respond(409, {
        received: false,
        error: "Transaction mismatch",
      });
    }

    return respond(503, {
      received: false,
      error: "Database unavailable",
    });
  }

  // ----------------------------------------------------------
  // F. Confirmation déjà enregistrée
  // ----------------------------------------------------------

  if (internal.alreadyConfirmed) {
    return respond(200, {
      received: true,
      processed: true,
    });
  }

  // ----------------------------------------------------------
  // G. Vérification officielle Kkiapay
  // ----------------------------------------------------------

  try {
    /**
     * Cette fonction doit :
     *
     * 1. Associer la référence Kkiapay.
     * 2. Interroger Kkiapay côté serveur.
     * 3. Contrôler le montant et la devise.
     * 4. Enregistrer le statut dans Prisma.
     * 5. Confirmer une seule fois le don.
     *
     * Le statut du webhook n'est pas utilisé
     * comme preuve de paiement.
     */

    const result =
      await verifyKkiapayWidgetPayment(
        internal.id,
        payload.transactionId
      );

    console.info(
      "[kkiapay/webhook] Payment verified",
      {
        transactionId: internal.id,
        status: result.status,
        confirmed: result.confirmed,
        alreadyProcessed: result.alreadyProcessed,
      }
    );

    return respond(200, {
      received: true,
      processed: true,
    });
  } catch (error) {
    console.error(
      "[kkiapay/webhook] Payment verification failed",
      {
        transactionId: internal.id,
        reason:
          error instanceof Error
            ? error.message
            : "UNKNOWN_ERROR",
      }
    );

    /**
     * Une erreur de vérification ne doit jamais
     * être transformée en paiement confirmé.
     *
     * Le code 503 permet une nouvelle tentative
     * suivant la politique de livraison Kkiapay.
     */

    return respond(503, {
      received: false,
      error: "Verification unavailable",
    });
  }
}
