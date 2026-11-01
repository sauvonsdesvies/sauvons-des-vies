
/**
 * FONDATION SAUVONS DES VIES
 * ==========================================
 * src/lib/payments/service.ts
 *
 * Orchestration sécurisée des paiements.
 *
 * - Validation des demandes de don
 * - Vérification des campagnes
 * - Sélection automatique du prestataire
 * - Création des enregistrements Prisma
 * - Protection contre les doublons
 * - Initialisation FedaPay / Kkiapay
 * - Gestion des échecs d'initialisation
 *
 * Aucune confirmation financière ici.
 * ==========================================
 */

import "server-only";

import { randomUUID, randomBytes, createHash } from "node:crypto";

import { prisma } from "@/lib/prisma";

import {
  DEFAULT_PAYMENT_CURRENCY,
  DEFAULT_PAYMENT_LANGUAGE,
  DONATION_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  createPaymentError,
  isPaymentLanguage,
  isPaymentMethod,
  type CreatePaymentRequest,
  type CreatePaymentResponse,
  type PaymentErrorCode,
  type PaymentMethod,
  type PaymentProvider,
  type PaymentProviderAdapter,
  type ProviderPaymentRequest,
  type ProviderPaymentResult,
} from "./types";

import {
  getPaymentProviderCandidates,
} from "./methods";

import {
  fedaPayAdapter,
  resumeFedaPayPayment,
  validateFedaPayReturnUrl,
} from "./fedapay";

import {
  kkiapayAdapter,
} from "./kkiapay";

// ==========================================
// 1. CONFIGURATION
// ==========================================

const MIN_DONATION_AMOUNT = 100;
const MAX_DONATION_AMOUNT = 10_000_000;



const ADAPTERS: Record<
  PaymentProvider,
  PaymentProviderAdapter
> = {
  FEDAPAY: fedaPayAdapter,
  KKIAPAY: kkiapayAdapter,
};

// ==========================================
// 2. ERREUR MÉTIER
// ==========================================

export class PaymentServiceError extends Error {
  readonly code: PaymentErrorCode;
  readonly retryable: boolean;

  constructor(
    code: PaymentErrorCode,
    message: string,
    retryable = false
  ) {
    super(message);

    this.name = "PaymentServiceError";
    this.code = code;
    this.retryable = retryable;
  }
}

function paymentFailure(
  code: PaymentErrorCode,
  message: string,
  retryable = false
): CreatePaymentResponse {
  return {
    success: false,
    error: createPaymentError(
      code,
      message,
      retryable
    ),
  };
}

// ==========================================
// 3. VALIDATION DES DONNÉES
// ==========================================

function normalizeEmail(
  value: unknown
): string | null {
  if (value == null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new PaymentServiceError(
      "INVALID_EMAIL",
      "Adresse e-mail invalide."
    );
  }

  const email = value.trim().toLowerCase();

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new PaymentServiceError(
      "INVALID_EMAIL",
      "Veuillez saisir une adresse e-mail valide."
    );
  }

  return email;
}

function normalizePhone(
  value: unknown
): string | null {
  if (value == null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new PaymentServiceError(
      "INVALID_PHONE",
      "Numéro de téléphone invalide."
    );
  }

  const phone = value.replace(
    /[\s().-]/g,
    ""
  );

  if (!/^\+[1-9]\d{6,14}$/.test(phone)) {
    throw new PaymentServiceError(
      "INVALID_PHONE",
      "Veuillez saisir un numéro international valide."
    );
  }

  return phone;
}

function normalizeIdempotencyKey(
  value: unknown
): string {
  if (value == null || value === "") {
    return randomUUID();
  }

  if (
    typeof value !== "string" ||
    !/^[a-zA-Z0-9_-]{16,128}$/.test(value)
  ) {
    throw new PaymentServiceError(
      "INVALID_REQUEST",
      "Identifiant de requête invalide."
    );
  }

  return value;
}

interface ValidatedPaymentRequest {
  campaignId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  donor: {
    name: string | null;
    email: string | null;
    phone: string | null;
    country: string | null;
    isAnonymous: boolean;
  };
  language:
    | "fr"
    | "en"
    | "de"
    | "es";
  idempotencyKey: string;
  message: string | null;
}

function validatePaymentRequest(
  input: CreatePaymentRequest
): ValidatedPaymentRequest {
  if (
    !input ||
    typeof input !== "object"
  ) {
    throw new PaymentServiceError(
      "INVALID_REQUEST",
      "Données de paiement invalides."
    );
  }

  if (
    typeof input.campaignId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      input.campaignId
    )
  ) {
    throw new PaymentServiceError(
      "INVALID_CAMPAIGN",
      "Campagne invalide."
    );
  }

  if (
    !Number.isSafeInteger(input.amount) ||
    input.amount < MIN_DONATION_AMOUNT ||
    input.amount > MAX_DONATION_AMOUNT
  ) {
    throw new PaymentServiceError(
      "INVALID_AMOUNT",
      "Montant de don invalide."
    );
  }

  const currency =
    typeof input.currency === "string"
      ? input.currency.trim().toUpperCase()
      : "";

  if (
    !/^[A-Z]{3}$/.test(currency)
  ) {
    throw new PaymentServiceError(
      "INVALID_CURRENCY",
      "Devise invalide."
    );
  }

  if (!isPaymentMethod(input.paymentMethod)) {
    throw new PaymentServiceError(
      "METHOD_UNAVAILABLE",
      "Moyen de paiement non reconnu."
    );
  }

  if (
    !input.donor ||
    typeof input.donor !== "object"
  ) {
    throw new PaymentServiceError(
      "INVALID_REQUEST",
      "Informations du donateur manquantes."
    );
  }

  const email = normalizeEmail(
    input.donor.email
  );

  const phone = normalizePhone(
    input.donor.phone
  );

  if (!email) {
    throw new PaymentServiceError(
      "INVALID_EMAIL",
      "L'adresse e-mail est obligatoire."
    );
  }

  if (
    !phone
  ) {
    throw new PaymentServiceError(
      "INVALID_PHONE",
      "Le numéro de téléphone est obligatoire pour ce moyen de paiement."
    );
  }

  return {
    campaignId: input.campaignId,
    amount: input.amount,
    currency,
    paymentMethod: input.paymentMethod,

    donor: {
      name: null,
      email,
      phone,
      country: null,
      isAnonymous: false,
    },

    language: isPaymentLanguage(
      input.language
    )
      ? input.language
      : DEFAULT_PAYMENT_LANGUAGE,

    idempotencyKey:
      normalizeIdempotencyKey(
        input.idempotencyKey
      ),

    message: null,
  };
}

// ==========================================
// 4. VALIDATION DE LA CAMPAGNE
// ==========================================

async function validateCampaign(
  request: ValidatedPaymentRequest
): Promise<void> {
  const campaign =
    await prisma.campaign.findUnique({
      where: {
        id: request.campaignId,
      },
    });

  if (!campaign) {
    throw new PaymentServiceError(
      "INVALID_CAMPAIGN",
      "Cette campagne est introuvable."
    );
  }

  /**
   * Le schéma réel doit déterminer
   * les statuts autorisés.
   *
   * Nous contrôlons ici les champs
   * connus du modèle Campaign.
   */

  if (campaign.status !== "PUBLISHED" || !campaign.publishedAt || campaign.completedAt || (campaign.startDate && campaign.startDate > new Date()) || (campaign.endDate && campaign.endDate < new Date())) {
    throw new PaymentServiceError("CAMPAIGN_UNAVAILABLE", "Cette campagne ne peut pas recevoir de don.");
  }

  if (
    campaign.currency.toUpperCase() !==
    request.currency
  ) {
    throw new PaymentServiceError(
      "INVALID_CURRENCY",
      "La devise ne correspond pas à celle de la campagne."
    );
  }

  if (
    request.currency !==
    DEFAULT_PAYMENT_CURRENCY
  ) {
    throw new PaymentServiceError(
      "INVALID_CURRENCY",
      "Cette devise n'est pas encore activée pour le paiement."
    );
  }
}

// ==========================================
// 5. COMPATIBILITÉ PRESTATAIRE
// ==========================================

function supportsPaymentRequest(
  provider: PaymentProvider,
  request: ValidatedPaymentRequest
): boolean {
  if (
    provider === "KKIAPAY"
  ) {
    return (
      request.currency === "XOF" &&
      request.paymentMethod !==
        PAYMENT_METHODS.WAVE
    );
  }

  if (
    provider === "FEDAPAY"
  ) {
    /**
     * L'adaptateur FedaPay effectue
     * la validation finale auprès
     * de l'API officielle.
     */
    return true;
  }

  return false;
}

// ==========================================
// 6. CONSTRUCTION DE LA RÉPONSE
// ==========================================

function buildSuccessResponse(
  donationId: string,
  transactionId: string,
  request: ValidatedPaymentRequest,
  providerResult: ProviderPaymentResult,
  accessToken: string
): CreatePaymentResponse {
  return {
    success: true,
    accessToken,

    donationId,
    transactionId,

    status: PAYMENT_STATUSES.PENDING,

    amount: request.amount,
    currency: request.currency,

    paymentMethod:
      request.paymentMethod,

    nextAction:
      providerResult.nextAction,
  };
}

// ==========================================
// 7. INITIALISATION DU PAIEMENT
// ==========================================

export async function createPayment(
  input: CreatePaymentRequest,
  returnOrigin?: string
): Promise<CreatePaymentResponse> {
  let request: ValidatedPaymentRequest;

  try {
    request = validatePaymentRequest(input);
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      return paymentFailure(
        error.code,
        error.message,
        error.retryable
      );
    }

    return paymentFailure(
      "INVALID_REQUEST",
      "Demande de paiement invalide."
    );
  }

  try {
    await validateCampaign(request);

    const candidates =
      await getPaymentProviderCandidates(
        request.paymentMethod
      );

    const compatibleCandidates =
      candidates.filter((candidate) =>
        supportsPaymentRequest(
          candidate.provider,
          request
        )
      );

    if (compatibleCandidates.length === 0) {
      return paymentFailure(
        "METHOD_UNAVAILABLE",
        "Ce moyen de paiement n'est pas disponible actuellement."
      );
    }

    // ======================================
    // 8. PROTECTION CONTRE LES DOUBLONS
    // ======================================

    const existing =
      await prisma.paymentTransaction.findUnique({
        where: {
          idempotencyKey:
            request.idempotencyKey,
        },
        include: {
          donation: true,
        },
      });

    if (existing) {
      const matches = existing.donation.campaignId === request.campaignId && existing.amount === request.amount && existing.currency === request.currency && existing.paymentMethod === request.paymentMethod && existing.donation.donorEmail === request.donor.email && existing.donation.donorPhone === request.donor.phone;
      if (matches && existing.provider === "FEDAPAY" && existing.providerTransactionId) {
        const resumed = await resumeFedaPayPayment(existing, request.language);
        const accessToken = randomBytes(32).toString("hex");
        const accessTokenHash = createHash("sha256").update(accessToken).digest("hex");
        const savedData = existing.providerData && typeof existing.providerData === "object" && !Array.isArray(existing.providerData) ? existing.providerData : {};
        await prisma.paymentTransaction.updateMany({ where: { id: existing.id }, data: { providerData: { ...savedData, accessTokenHash } } });
        return buildSuccessResponse(existing.donationId, existing.id, request, resumed, accessToken);
      }
      return paymentFailure(
        "DUPLICATE_REQUEST",
        "Cette demande de paiement existe déjà. Veuillez consulter son statut."
      );
    }

    // ======================================
    // 9. CHOIX DU PRESTATAIRE
    // ======================================

    /**
     * La priorité est définie dans
     * PaymentMethodConfig.
     *
     * Aucun choix du prestataire
     * n'est demandé au donateur.
     */

    const selected =
      compatibleCandidates[0];

    const adapter =
      ADAPTERS[selected.provider];

    if (selected.provider === "FEDAPAY") validateFedaPayReturnUrl(returnOrigin ? `${returnOrigin}/paiement/retour` : undefined);

    if (!adapter) {
      return paymentFailure(
        "PROVIDER_UNAVAILABLE",
        "Le service de paiement est temporairement indisponible.",
        true
      );
    }

    // ======================================
    // 10. CRÉATION ATOMIQUE PRISMA
    // ======================================

    const accessToken = randomBytes(32).toString("hex");
    const accessTokenHash = createHash("sha256").update(accessToken).digest("hex");
    const records =
      await prisma.$transaction(
        async (tx) => {
          const donation =
            await tx.donation.create({
              data: {
                campaignId:
                  request.campaignId,

                amount:
                  request.amount,

                currency:
                  request.currency,

                donorName:
                  request.donor.name,

                donorEmail:
                  request.donor.email,

                donorPhone:
                  request.donor.phone,

                isAnonymous:
                  request.donor.isAnonymous,

                message:
                  request.message,

                status:
                  DONATION_STATUSES.PENDING,
              },
            });

          const transaction =
            await tx.paymentTransaction.create({
              data: {
                donationId:
                  donation.id,

                provider:
                  selected.provider,

                paymentMethod:
                  request.paymentMethod,

                amount:
                  request.amount,

                currency:
                  request.currency,

                status:
                  PAYMENT_STATUSES.PENDING,

                idempotencyKey:
                  request.idempotencyKey,
                providerData: { accessTokenHash },
              },
            });

          return {
            donation,
            transaction,
          };
        }
      );

    // ======================================
    // 11. PRÉPARATION POUR LE PRESTATAIRE
    // ======================================

    const providerRequest:
      ProviderPaymentRequest = {
        onTransactionCreated: async (id, reference) => {
          await prisma.paymentTransaction.updateMany({ where: { id: records.transaction.id, providerTransactionId: null }, data: { providerTransactionId: id, providerReference: reference } });
        },
        returnUrl: returnOrigin ? `${returnOrigin}/paiement/retour?transactionId=${records.transaction.id}` : undefined,
        donationId:
          records.donation.id,

        transactionId:
          records.transaction.id,

        campaignId:
          request.campaignId,

        amount:
          request.amount,

        currency:
          request.currency,

        paymentMethod:
          request.paymentMethod,

        donor: request.donor,

        language:
          request.language,

        idempotencyKey:
          request.idempotencyKey,

        description:
          `Don Fondation Sauvons des Vies - ${records.donation.id}`,
      };

    // ======================================
    // 12. APPEL DU PRESTATAIRE
    // ======================================

    let providerResult:
      ProviderPaymentResult;

    try {
      providerResult =
        await adapter.createPayment(
          providerRequest
        );
    } catch (error) {
      /**
       * Une erreur réseau ne prouve
       * pas que le prestataire n'a
       * créé aucune transaction.
       *
       * On conserve donc les
       * enregistrements PENDING
       * pour permettre un
       * rapprochement ultérieur.
       */

      console.error(
        "[payments/service] Provider initialization failed:",
        selected.provider,
        error instanceof Error
          ? error.message
          : "Unknown error"
      );

      return paymentFailure(
        "PROVIDER_ERROR",
        "Impossible d'initialiser le paiement. Veuillez vérifier son statut avant de réessayer.",
        true
      );
    }

    // ======================================
    // 13. ENREGISTREMENT DES RÉFÉRENCES
    // ======================================

    await prisma.paymentTransaction.updateMany({
      where: {
        id:
          records.transaction.id,
        status: { in: [PAYMENT_STATUSES.PENDING, PAYMENT_STATUSES.PROCESSING] },
      },

      data: {
        providerReference:
          providerResult.providerReference ??
          null,

        providerTransactionId:
          providerResult.providerTransactionId ??
          null,

        expiresAt:
          providerResult.expiresAt ??
          null,

        /**
         * Ne pas stocker les tokens
         * du widget ou les URL de
         * checkout dans providerData.
         */
        providerData: {
          initialized: true,
          accessTokenHash,
          paymentMethod:
            request.paymentMethod,
        },
      },
    });

    return buildSuccessResponse(
      records.donation.id,
      records.transaction.id,
      request,
      providerResult,
      accessToken
    );
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      return paymentFailure(
        error.code,
        error.message,
        error.retryable
      );
    }

    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return paymentFailure("DUPLICATE_REQUEST", "Cette demande de paiement existe déjà.");
    }

    console.error(
      "[payments/service] Payment creation failed:",
      error instanceof Error
        ? error.message
        : "Unknown error"
    );

    return paymentFailure(
      "INTERNAL_ERROR",
      "Le paiement n'a pas pu être préparé. Veuillez réessayer.",
      true
    );
  }
}

export default createPayment;
