import { getPaymentRequestOrigin } from "@/lib/payments/request-origin";

/**
 * FONDATION SAUVONS DES VIES
 * ==================================================
 * src/app/api/payments/create/route.ts
 *
 * API de création des paiements.
 *
 * POST /api/payments/create
 *
 * Responsabilités :
 * - Recevoir une demande de don.
 * - Vérifier l'origine de la requête.
 * - Valider les données entrantes.
 * - Contrôler le format du montant.
 * - Contrôler le moyen de paiement.
 * - Transmettre au service de paiement.
 * - Retourner l'action de paiement sécurisée.
 * - Ne jamais exposer de clés secrètes.
 *
 * Le prestataire est choisi par service.ts.
 * La confirmation est gérée par verification.ts.
 *
 * Compatible Next.js App Router / Node.js.
 * ==================================================
 */

import { NextRequest, NextResponse } from "next/server";


import {
  DEFAULT_PAYMENT_CURRENCY,
  DEFAULT_PAYMENT_LANGUAGE,
  createPaymentError,
  isPaymentLanguage,
  isPaymentMethod,
  type CreatePaymentRequest,
  type CreatePaymentResponse,
  type PaymentMethod,
} from "@/lib/payments/types";

import {
  createPayment,
} from "@/lib/payments/service";

// ==================================================
// 1. CONFIGURATION
// ==================================================


const MAX_BODY_BYTES = 16 * 1024;

const MAX_AMOUNT = 10_000_000;

const MIN_AMOUNT = 100;



// ==================================================
// 2. EN-TÊTES DE SÉCURITÉ
// ==================================================

const RESPONSE_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

// ==================================================
// 3. TYPES INTERNES
// ==================================================

type UnknownRecord = Record<string, unknown>;

type ValidationResult =
  | {
      valid: true;
      data: CreatePaymentRequest;
    }
  | {
      valid: false;
      message: string;
    };

// ==================================================
// 4. RÉPONSES JSON
// ==================================================

function jsonResponse(
  body: CreatePaymentResponse,
  status: number
): NextResponse<CreatePaymentResponse> {
  return NextResponse.json(body, {
    status,
    headers: RESPONSE_HEADERS,
  });
}

function failureResponse(
  status: number,
  code:
    | "INVALID_REQUEST"
    | "INVALID_AMOUNT"
    | "INVALID_CURRENCY"
    | "INVALID_PHONE"
    | "INVALID_EMAIL"
    | "INVALID_CAMPAIGN"
    | "METHOD_UNAVAILABLE"
    | "UNAUTHORIZED"
    | "RATE_LIMITED"
    | "INTERNAL_ERROR",
  message: string,
  retryable = false
): NextResponse<CreatePaymentResponse> {
  return jsonResponse(
    {
      success: false,
      error: createPaymentError(
        code,
        message,
        retryable
      ),
    },
    status
  );
}

// ==================================================
// 5. FONCTIONS DE VALIDATION
// ==================================================

function isRecord(
  value: unknown
): value is UnknownRecord {
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

function normalizeEmail(
  value: unknown
): string | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const email = value.trim().toLowerCase();

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return null;
  }

  return email;
}

function normalizePhone(
  value: unknown
): string | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const phone = value.replace(
    /[\s().-]/g,
    ""
  );

  if (
    !/^\+[1-9]\d{6,14}$/.test(phone)
  ) {
    return null;
  }

  return phone;
}

function normalizeIdempotencyKey(
  value: unknown
): string | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  if (
    typeof value !== "string" ||
    !/^[a-zA-Z0-9_-]{16,128}$/.test(value)
  ) {
    return null;
  }

  return value;
}

// ==================================================
// 6. VALIDATION DU CORPS JSON
// ==================================================

function validateRequestBody(
  body: unknown
): ValidationResult {
  if (!isRecord(body)) {
    return {
      valid: false,
      message: "Le corps de la requête est invalide.",
    };
  }

  if (!isUuid(body.campaignId)) {
    return {
      valid: false,
      message: "Identifiant de campagne invalide.",
    };
  }

  if (
    typeof body.amount !== "number" ||
    !Number.isSafeInteger(body.amount) ||
    body.amount < MIN_AMOUNT ||
    body.amount > MAX_AMOUNT
  ) {
    return {
      valid: false,
      message: "Le montant du don est invalide.",
    };
  }

  if (
    typeof body.currency !== "string" ||
    body.currency.trim().toUpperCase() !==
      DEFAULT_PAYMENT_CURRENCY
  ) {
    return {
      valid: false,
      message: "La devise demandée n'est pas disponible.",
    };
  }

  if (!isPaymentMethod(body.paymentMethod)) {
    return {
      valid: false,
      message: "Moyen de paiement invalide.",
    };
  }

  if (!isRecord(body.donor)) {
    return {
      valid: false,
      message: "Informations du donateur manquantes.",
    };
  }

  const email = normalizeEmail(
    body.donor.email
  );

  if (!email) {
    return {
      valid: false,
      message: "Une adresse e-mail valide est obligatoire.",
    };
  }

  const phone = normalizePhone(
    body.donor.phone
  );

  const paymentMethod: PaymentMethod =
    body.paymentMethod;

  if (
    !phone
  ) {
    return {
      valid: false,
      message:
        "Un numéro international valide est obligatoire pour ce moyen de paiement.",
    };
  }

  const idempotencyKey =
    normalizeIdempotencyKey(
      body.idempotencyKey
    );

  if (!idempotencyKey) {
    return {
      valid: false,
      message: "Identifiant de requête invalide.",
    };
  }

  const donor = { email, phone };

  return {
    valid: true,
    data: {
      campaignId:
        body.campaignId,

      amount:
        body.amount,

      currency:
        DEFAULT_PAYMENT_CURRENCY,

      paymentMethod,

      donor,

      language: isPaymentLanguage(body.language) ? body.language : DEFAULT_PAYMENT_LANGUAGE,

      idempotencyKey,

    },
  };
}

// ==================================================
// 7. CONTRÔLE D'ORIGINE
// ==================================================

// ==================================================
// 8. LECTURE SÉCURISÉE DU JSON
// ==================================================

async function readRequestJson(
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
      "UNSUPPORTED_CONTENT_TYPE"
    );
  }

  const contentLength =
    request.headers.get("content-length");

  if (contentLength) {
    const length = Number(
      contentLength
    );

    if (
      !Number.isSafeInteger(length) ||
      length < 0 ||
      length > MAX_BODY_BYTES
    ) {
      throw new Error(
        "REQUEST_TOO_LARGE"
      );
    }
  }

  const reader =
    request.body?.getReader();

  if (!reader) {
    throw new Error(
      "EMPTY_REQUEST_BODY"
    );
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } =
        await reader.read();

      if (done) {
        break;
      }

      totalBytes += value.byteLength;

      if (
        totalBytes > MAX_BODY_BYTES
      ) {
        await reader.cancel();

        throw new Error(
          "REQUEST_TOO_LARGE"
        );
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  if (totalBytes === 0) {
    throw new Error(
      "EMPTY_REQUEST_BODY"
    );
  }

  const combined =
    new Uint8Array(totalBytes);

  let offset = 0;

  for (const chunk of chunks) {
    combined.set(
      chunk,
      offset
    );

    offset += chunk.byteLength;
  }

  const decoder =
    new TextDecoder(
      "utf-8",
      {
        fatal: true,
      }
    );

  const text =
    decoder.decode(combined);

  return JSON.parse(text) as unknown;
}

// ==================================================
// 9. CORRESPONDANCE DES ERREURS
// ==================================================

function resolveErrorStatus(
  response: CreatePaymentResponse
): number {
  if (response.success) {
    return 200;
  }

  switch (response.error.code) {
    case "INVALID_REQUEST":
    case "INVALID_AMOUNT":
    case "INVALID_CURRENCY":
    case "INVALID_PHONE":
    case "INVALID_EMAIL":
    case "INVALID_CAMPAIGN":
      return 400;

    case "CAMPAIGN_UNAVAILABLE":
    case "METHOD_UNAVAILABLE":
    case "PAYMENT_ALREADY_CONFIRMED":
    case "DUPLICATE_REQUEST":
      return 409;

    case "UNAUTHORIZED":
      return 403;

    case "RATE_LIMITED":
      return 429;

    case "PROVIDER_UNAVAILABLE":
    case "PROVIDER_ERROR":
    case "NETWORK_ERROR":
      return 503;

    default:
      return 500;
  }
}

// ==================================================
// 10. POST /api/payments/create
// ==================================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<CreatePaymentResponse>> {
  // ------------------------------------------
  // A. Contrôle d'origine
  // ------------------------------------------

  if (!getPaymentRequestOrigin(request)) {
    return failureResponse(
      403,
      "UNAUTHORIZED",
      "Origine de la requête non autorisée."
    );
  }

  // ------------------------------------------
  // B. Lecture du JSON
  // ------------------------------------------

  let body: unknown;

  try {
    body = await readRequestJson(
      request
    );
  } catch (error) {
    const code =
      error instanceof Error
        ? error.message
        : "INVALID_REQUEST_BODY";

    if (
      code === "REQUEST_TOO_LARGE"
    ) {
      return failureResponse(
        413,
        "INVALID_REQUEST",
        "La requête dépasse la taille autorisée."
      );
    }

    if (
      code === "UNSUPPORTED_CONTENT_TYPE"
    ) {
      return failureResponse(
        415,
        "INVALID_REQUEST",
        "Le format JSON est obligatoire."
      );
    }

    return failureResponse(
      400,
      "INVALID_REQUEST",
      "Le contenu de la requête est invalide."
    );
  }

  // ------------------------------------------
  // C. Validation des données
  // ------------------------------------------

  const validation =
    validateRequestBody(body);

  if (!validation.valid) {
    return failureResponse(
      400,
      "INVALID_REQUEST",
      validation.message
    );
  }

  // ------------------------------------------
  // D. Création sécurisée du paiement
  // ------------------------------------------

  try {
    const result =
      await createPayment(
        validation.data,
        getPaymentRequestOrigin(request)!
      );

    const status =
      resolveErrorStatus(result);

    return jsonResponse(
      result,
      status
    );
  } catch (error) {
    console.error(
      "[api/payments/create] Unexpected error:",
      error instanceof Error
        ? error.message
        : "Unknown error"
    );

    return failureResponse(
      500,
      "INTERNAL_ERROR",
      "Une erreur est survenue lors de la préparation du paiement.",
      true
    );
  }
}
