
/**
 * FONDATION SAUVONS DES VIES
 * ==========================================================
 * src/app/api/payments/webhooks/fedapay/route.ts
 *
 * Webhook officiel FedaPay — paiements réels.
 *
 * Sécurité :
 * - Vérification de la signature FedaPay.
 * - Lecture du corps brut de la requête.
 * - Secret de webhook obligatoire.
 * - Rapprochement strict avec PaymentTransaction.
 * - Vérification indépendante auprès de FedaPay.
 * - Confirmation idempotente via verification.ts.
 * - Aucun montant confirmé depuis le webhook seul.
 * - Aucune information sensible dans la réponse.
 * ==========================================================
 */

import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "fedapay";

import { prisma } from "@/lib/prisma";

import {
  verifyFedaPayTransaction,
} from "@/lib/payments/verification";

// ==========================================================
// 1. CONFIGURATION
// ==========================================================


const MAX_WEBHOOK_BYTES = 256 * 1024;

const HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

// ==========================================================
// 2. TYPES
// ==========================================================

type JsonObject = Record<string, unknown>;

type WebhookResponse = {
  received: boolean;
  processed?: boolean;
  error?: string;
};

// ==========================================================
// 3. RÉPONSES
// ==========================================================

function respond(
  status: number,
  body: WebhookResponse
): NextResponse<WebhookResponse> {
  return NextResponse.json(body, {
    status,
    headers: HEADERS,
  });
}

// ==========================================================
// 4. VALIDATION DES OBJETS
// ==========================================================

function isObject(
  value: unknown
): value is JsonObject {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function nonEmptyString(
  value: unknown
): string | null {
  if (typeof value === "string") {
    const result = value.trim();

    return result.length > 0
      ? result
      : null;
  }

  return null;
}

function providerIdentifier(
  value: unknown
): string | null {
  if (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  ) {
    return String(value);
  }

  if (typeof value === "string") {
    const result = value.trim();

    if (
      result.length > 0 &&
      result.length <= 255 &&
      !/[\u0000-\u001f\u007f]/.test(result)
    ) {
      return result;
    }
  }

  return null;
}

// ==========================================================
// 5. LECTURE DU CORPS BRUT
// ==========================================================

async function readRawBody(
  request: NextRequest
): Promise<Buffer> {
  const contentLength = request.headers.get(
    "content-length"
  );

  if (contentLength !== null) {
    const declaredLength = Number(contentLength);

    if (
      !Number.isSafeInteger(declaredLength) ||
      declaredLength < 0 ||
      declaredLength > MAX_WEBHOOK_BYTES
    ) {
      throw new Error("INVALID_BODY_SIZE");
    }
  }

  if (!request.body) {
    throw new Error("EMPTY_BODY");
  }

  const reader = request.body.getReader();
  const chunks: Buffer[] = [];

  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      total += value.byteLength;

      if (total > MAX_WEBHOOK_BYTES) {
        await reader.cancel();
        throw new Error("INVALID_BODY_SIZE");
      }

      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }

  if (total === 0) {
    throw new Error("EMPTY_BODY");
  }

  return Buffer.concat(chunks, total);
}

// ==========================================================
// 6. VÉRIFICATION DE LA SIGNATURE OFFICIELLE
// ==========================================================

function verifySignedEvent(
  rawBody: Buffer,
  signature: string,
  secret: string
): JsonObject {
  /**
   * L'implémentation officielle FedaPay vérifie
   * la signature à partir du corps brut.
   *
   * Aucune vérification HMAC improvisée.
   */
  const event: unknown = Webhook.constructEvent(
    rawBody,
    signature,
    secret
  );

  if (!isObject(event)) {
    throw new Error("INVALID_EVENT");
  }

  return event;
}

// ==========================================================
// 7. EXTRACTION DE L'ÉVÉNEMENT
// ==========================================================

function getEventName(
  event: JsonObject
): string | null {
  return (
    nonEmptyString(event.name) ??
    nonEmptyString(event.type)
  );
}

function getTransactionData(
  event: JsonObject
): JsonObject | null {
  const data = event.data;

  if (!isObject(data)) {
    return null;
  }

  /**
   * Certains événements enveloppent l'objet
   * transaction dans data.object.
   */
  if (isObject(data.object)) {
    return data.object;
  }

  return data;
}

function getTransactionIdentifier(
  transaction: JsonObject
): string | null {
  return providerIdentifier(transaction.id);
}

function getTransactionReference(
  transaction: JsonObject
): string | null {
  return providerIdentifier(
    transaction.reference
  );
}

// ==========================================================
// 8. TYPES D'ÉVÉNEMENTS CONCERNÉS
// ==========================================================

function isTransactionEvent(
  eventName: string
): boolean {
  return eventName.startsWith("transaction.");
}

// ==========================================================
// 9. RAPPROCHEMENT AVEC SUPABASE
// ==========================================================

async function findInternalTransaction(
  providerTransactionId: string | null,
  providerReference: string | null
): Promise<string | null> {
  if (
    !providerTransactionId &&
    !providerReference
  ) {
    return null;
  }

  const conditions: Array<
    | { providerTransactionId: string }
    | { providerReference: string }
  > = [];

  if (providerTransactionId) {
    conditions.push({
      providerTransactionId,
    });
  }

  if (providerReference) {
    conditions.push({
      providerReference,
    });
  }

  const matches =
    await prisma.paymentTransaction.findMany({
      where: {
        provider: "FEDAPAY",
        OR: conditions,
      },

      select: {
        id: true,
        providerTransactionId: true,
        providerReference: true,
      },

      take: 2,
    });

  /**
   * Plusieurs correspondances seraient anormales.
   * On ne confirme aucun don en cas d'ambiguïté.
   */
  if (matches.length > 1) {
    throw new Error("AMBIGUOUS_TRANSACTION");
  }

  const match = matches[0];

  if (!match) {
    return null;
  }

  /**
   * Si une référence existe déjà en base,
   * elle ne doit pas contredire le webhook.
   */
  if (
    providerTransactionId &&
    match.providerTransactionId &&
    match.providerTransactionId !==
      providerTransactionId
  ) {
    throw new Error("TRANSACTION_ID_MISMATCH");
  }

  if (
    providerReference &&
    match.providerReference &&
    match.providerReference !==
      providerReference
  ) {
    throw new Error("REFERENCE_MISMATCH");
  }

  return match.id;
}

// ==========================================================
// 10. POST — WEBHOOK FEDAPAY
// ==========================================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<WebhookResponse>> {
  // --------------------------------------------------------
  // A. Configuration obligatoire
  // --------------------------------------------------------

  const webhookSecret =
    process.env.FEDAPAY_WEBHOOK_SECRET?.trim();

  if (!webhookSecret) {
    console.error(
      "[fedapay/webhook] FEDAPAY_WEBHOOK_SECRET missing"
    );

    return respond(503, {
      received: false,
      error: "Service unavailable",
    });
  }

  // --------------------------------------------------------
  // B. Signature obligatoire
  // --------------------------------------------------------

  const signature = request.headers.get(
    "x-fedapay-signature"
  );

  if (!signature) {
    return respond(401, {
      received: false,
      error: "Missing signature",
    });
  }

  // --------------------------------------------------------
  // C. Lecture du corps brut
  // --------------------------------------------------------

  let rawBody: Buffer;

  try {
    rawBody = await readRawBody(request);
  } catch {
    return respond(400, {
      received: false,
      error: "Invalid request body",
    });
  }

  // --------------------------------------------------------
  // D. Authentification de la notification
  // --------------------------------------------------------

  let event: JsonObject;

  try {
    event = verifySignedEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch {
    console.warn(
      "[fedapay/webhook] Invalid webhook signature or event"
    );

    return respond(400, {
      received: false,
      error: "Invalid webhook signature",
    });
  }

  // --------------------------------------------------------
  // E. Identification de l'événement
  // --------------------------------------------------------

  const eventName = getEventName(event);

  if (!eventName) {
    return respond(400, {
      received: false,
      error: "Invalid event",
    });
  }

  /**
   * Les événements non financiers sont reconnus
   * mais ne modifient aucun don.
   */
  if (!isTransactionEvent(eventName)) {
    return respond(200, {
      received: true,
      processed: false,
    });
  }

  const transactionData =
    getTransactionData(event);

  if (!transactionData) {
    return respond(400, {
      received: false,
      error: "Missing transaction data",
    });
  }

  const providerTransactionId =
    getTransactionIdentifier(transactionData);

  const providerReference =
    getTransactionReference(transactionData);

  if (
    !providerTransactionId &&
    !providerReference
  ) {
    return respond(400, {
      received: false,
      error: "Missing transaction identifier",
    });
  }

  // --------------------------------------------------------
  // F. Recherche de la transaction interne
  // --------------------------------------------------------

  let internalTransactionId: string | null;

  try {
    internalTransactionId =
      await findInternalTransaction(
        providerTransactionId,
        providerReference
      );
  } catch (error) {
    console.error(
      "[fedapay/webhook] Transaction lookup failed:",
      error instanceof Error
        ? error.message
        : "Unknown error"
    );

    return respond(503, {
      received: false,
      error: "Transaction lookup failed",
    });
  }

  if (!internalTransactionId) {
    /**
     * La transaction peut avoir été créée chez
     * FedaPay avant l'enregistrement local
     * de ses références.
     *
     * Une erreur temporaire permet au prestataire
     * de réessayer selon sa politique de livraison.
     *
     * Aucune autre donation n'est sélectionnée
     * par simple montant ou adresse e-mail.
     */
    console.warn(
      "[fedapay/webhook] Unmatched transaction",
      {
        providerTransactionId,
        providerReference,
      }
    );

    return respond(503, {
      received: false,
      error: "Transaction not yet available",
    });
  }

  // --------------------------------------------------------
  // G. Vérification indépendante auprès de FedaPay
  // --------------------------------------------------------

  try {
    const result =
      await verifyFedaPayTransaction(
        internalTransactionId
      );

    /**
     * verification.ts :
     *
     * - interroge l'API officielle FedaPay ;
     * - contrôle le montant et la devise ;
     * - confirme en transaction Prisma ;
     * - empêche les confirmations multiples.
     *
     * Nous n'utilisons jamais le statut du webhook
     * comme preuve financière suffisante.
     */

    console.info(
      "[fedapay/webhook] Verification completed",
      {
        transactionId: internalTransactionId,
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
      "[fedapay/webhook] Verification failed",
      {
        transactionId: internalTransactionId,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      }
    );

    /**
     * Ne jamais répondre "traité" lorsque
     * la vérification financière a échoué.
     */
    return respond(503, {
      received: false,
      error: "Payment verification unavailable",
    });
  }
}
