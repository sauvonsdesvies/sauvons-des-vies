
/**
 * FONDATION SAUVONS DES VIES
 * ==================================================
 * src/lib/payments/verification.ts
 *
 * Vérification et confirmation sécurisées des dons.
 *
 * PRINCIPES :
 *
 * 1. Le navigateur ne confirme jamais un don.
 * 2. Un webhook seul ne constitue pas une preuve.
 * 3. Le statut est vérifié auprès du prestataire.
 * 4. Le montant et la devise sont contrôlés.
 * 5. Une confirmation est enregistrée une seule fois.
 * 6. Les mises à jour utilisent une transaction Prisma.
 * 7. Aucun secret de paiement n'est exposé.
 * 8. Les erreurs réseau ne deviennent pas des échecs
 *    financiers définitifs.
 *
 * Compatible avec :
 * - Prisma / PostgreSQL / Supabase
 * - FedaPay
 * - Kkiapay
 * - Next.js App Router
 * ==================================================
 */

import "server-only";

import { prisma } from "@/lib/prisma";

import {
  DONATION_STATUSES,
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES,
  isPaymentProvider,
  isPaymentStatus,
  type PaymentProvider,
  type PaymentProviderAdapter,
  type PaymentStatus,
  type PaymentTransactionRecord,
  type PaymentVerificationResult,
  type ProviderPaymentVerification,
} from "./types";

import { fedaPayAdapter } from "./fedapay";
import { kkiapayAdapter } from "./kkiapay";

// ==================================================
// 1. CONFIGURATION
// ==================================================

const PROVIDER_ADAPTERS: Record<
  PaymentProvider,
  PaymentProviderAdapter
> = {
  [PAYMENT_PROVIDERS.FEDAPAY]: fedaPayAdapter,
  [PAYMENT_PROVIDERS.KKIAPAY]: kkiapayAdapter,
};

const MAX_REFERENCE_LENGTH = 255;

// ==================================================
// 2. TYPES INTERNES
// ==================================================

type DatabaseTransaction = Awaited<
  ReturnType<
    typeof prisma.paymentTransaction.findUnique
  >
>;

type PaymentRecord = NonNullable<DatabaseTransaction>;

export interface VerifyPaymentOptions {
  /**
   * Identifiant interne de PaymentTransaction.
   */
  transactionId: string;

  /**
   * Référence externe reçue éventuellement
   * d'un webhook ou du widget Kkiapay.
   *
   * Elle ne constitue pas une preuve.
   */
  providerTransactionId?: string;

  /**
   * Prestataire attendu, si connu.
   */
  expectedProvider?: PaymentProvider;
}

export class PaymentVerificationError extends Error {
  readonly code: string;
  readonly retryable: boolean;

  constructor(
    code: string,
    message: string,
    retryable = false
  ) {
    super(message);

    this.name = "PaymentVerificationError";
    this.code = code;
    this.retryable = retryable;
  }
}

// ==================================================
// 3. VALIDATION DES IDENTIFIANTS
// ==================================================

function assertInternalId(
  value: unknown
): asserts value is string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    )
  ) {
    throw new PaymentVerificationError(
      "INVALID_TRANSACTION_ID",
      "Identifiant de transaction invalide."
    );
  }
}

function normalizeProviderReference(
  value: unknown
): string | null {
  if (value == null) {
    return null;
  }

  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.trim().length > MAX_REFERENCE_LENGTH
  ) {
    throw new PaymentVerificationError(
      "INVALID_PROVIDER_REFERENCE",
      "Référence de paiement invalide."
    );
  }

  return value.trim();
}

// ==================================================
// 4. CONVERSION DU MODÈLE PRISMA
// ==================================================

function toPaymentTransactionRecord(
  record: PaymentRecord
): PaymentTransactionRecord {
  return {
    id: record.id,
    donationId: record.donationId,

    provider: record.provider,

    providerReference:
      record.providerReference,

    providerTransactionId:
      record.providerTransactionId,

    paymentMethod:
      record.paymentMethod,

    amount: record.amount,
    currency: record.currency,

    status: record.status,

    failureReason:
      record.failureReason,

    idempotencyKey:
      record.idempotencyKey,

    expiresAt:
      record.expiresAt,

    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    confirmedAt: record.confirmedAt,
  };
}

// ==================================================
// 5. NORMALISATION DES STATUTS
// ==================================================

function assertVerifiedStatus(
  value: unknown
): asserts value is PaymentStatus {
  if (!isPaymentStatus(value)) {
    throw new PaymentVerificationError(
      "INVALID_PROVIDER_STATUS",
      "Le prestataire a retourné un statut inconnu.",
      true
    );
  }
}

function getDonationStatus(
  status: PaymentStatus
): string {
  switch (status) {
    case PAYMENT_STATUSES.CONFIRMED:
      return DONATION_STATUSES.CONFIRMED;

    case PAYMENT_STATUSES.FAILED:
      return DONATION_STATUSES.FAILED;

    case PAYMENT_STATUSES.CANCELLED:
      return DONATION_STATUSES.CANCELLED;

    case PAYMENT_STATUSES.EXPIRED:
      return DONATION_STATUSES.CANCELLED;

    default:
      return DONATION_STATUSES.PENDING;
  }
}

// ==================================================
// 6. VÉRIFICATION DES DONNÉES FINANCIÈRES
// ==================================================

function assertFinancialIntegrity(
  transaction: PaymentRecord,
  verified: ProviderPaymentVerification
): void {
  if (
    verified.provider !== transaction.provider
  ) {
    throw new PaymentVerificationError(
      "PROVIDER_MISMATCH",
      "Le prestataire ne correspond pas à la transaction."
    );
  }

  if (
    !Number.isSafeInteger(verified.amount) ||
    verified.amount <= 0 ||
    verified.amount !== transaction.amount
  ) {
    throw new PaymentVerificationError(
      "AMOUNT_MISMATCH",
      "Le montant confirmé ne correspond pas au don."
    );
  }

  if (
    typeof verified.currency !== "string" ||
    verified.currency.toUpperCase() !==
      transaction.currency.toUpperCase()
  ) {
    throw new PaymentVerificationError(
      "CURRENCY_MISMATCH",
      "La devise confirmée ne correspond pas au don."
    );
  }

  if (
    transaction.providerTransactionId &&
    verified.providerTransactionId !==
      transaction.providerTransactionId
  ) {
    throw new PaymentVerificationError(
      "PROVIDER_TRANSACTION_MISMATCH",
      "La transaction du prestataire ne correspond pas."
    );
  }

  if (
    transaction.providerReference &&
    verified.providerReference &&
    transaction.providerReference !==
      verified.providerReference
  ) {
    throw new PaymentVerificationError(
      "PROVIDER_REFERENCE_MISMATCH",
      "La référence du prestataire ne correspond pas."
    );
  }

  assertVerifiedStatus(verified.status);
}

// ==================================================
// 7. CONSTRUCTION DU RÉSULTAT
// ==================================================

function buildVerificationResult(
  transaction: {
    id: string;
    donationId: string;
    status: string;
    confirmedAt: Date | null;
  },
  alreadyProcessed: boolean
): PaymentVerificationResult {
  const status = isPaymentStatus(
    transaction.status
  )
    ? transaction.status
    : PAYMENT_STATUSES.PENDING;

  return {
    donationId:
      transaction.donationId,

    transactionId:
      transaction.id,

    status,

    verified: true,

    confirmed:
      status === PAYMENT_STATUSES.CONFIRMED,

    alreadyProcessed,

    confirmedAt:
      transaction.confirmedAt,
  };
}

// ==================================================
// 8. RÉCUPÉRATION DE LA TRANSACTION
// ==================================================

async function getPaymentTransaction(
  transactionId: string
): Promise<PaymentRecord> {
  const transaction =
    await prisma.paymentTransaction.findUnique({
      where: {
        id: transactionId,
      },
    });

  if (!transaction) {
    throw new PaymentVerificationError(
      "PAYMENT_NOT_FOUND",
      "Transaction introuvable."
    );
  }

  return transaction;
}

// ==================================================
// 9. CONTRÔLE DU PRESTATAIRE
// ==================================================

function getProviderAdapter(
  provider: string
): PaymentProviderAdapter {
  if (!isPaymentProvider(provider)) {
    throw new PaymentVerificationError(
      "UNKNOWN_PROVIDER",
      "Prestataire de paiement inconnu."
    );
  }

  return PROVIDER_ADAPTERS[provider];
}

// ==================================================
// 10. ASSOCIATION D'UNE RÉFÉRENCE EXTERNE
// ==================================================

/**
 * Utilisée lorsque le widget Kkiapay
 * fournit l'identifiant de paiement.
 *
 * IMPORTANT :
 *
 * Cette fonction ne confirme pas le don.
 *
 * La référence doit provenir d'un parcours
 * authentifié et être rapprochée de la
 * transaction interne attendue.
 *
 * Les routes publiques devront contrôler
 * l'autorisation d'accès.
 */
async function attachProviderTransactionId(
  transaction: PaymentRecord,
  externalId: string
): Promise<PaymentRecord> {
  if (
    transaction.providerTransactionId &&
    transaction.providerTransactionId !== externalId
  ) {
    throw new PaymentVerificationError(
      "REFERENCE_CONFLICT",
      "Une autre référence est déjà associée à cette transaction."
    );
  }

  if (
    transaction.providerTransactionId ===
    externalId
  ) {
    return transaction;
  }

  const updated =
    await prisma.paymentTransaction.updateMany({
      where: {
        id: transaction.id,
        providerTransactionId: null,
        status: {
          in: [
            PAYMENT_STATUSES.PENDING,
            PAYMENT_STATUSES.PROCESSING,
          ],
        },
      },

      data: {
        providerTransactionId:
          externalId,
      },
    });

  if (updated.count !== 1) {
    const current =
      await getPaymentTransaction(transaction.id);

    if (
      current.providerTransactionId ===
      externalId
    ) {
      return current;
    }

    throw new PaymentVerificationError(
      "REFERENCE_CONFLICT",
      "Impossible d'associer la référence du paiement."
    );
  }

  return getPaymentTransaction(
    transaction.id
  );
}

// ==================================================
// 11. ENREGISTREMENT ATOMIQUE
// ==================================================

async function persistVerifiedPayment(
  transaction: PaymentRecord,
  verified: ProviderPaymentVerification
): Promise<PaymentVerificationResult> {
  const now = new Date();

  const verifiedStatus =
    verified.status;

  return prisma.$transaction(
    async (tx) => {
      const current =
        await tx.paymentTransaction.findUnique({
          where: {
            id: transaction.id,
          },
          include: {
            donation: true,
          },
        });

      if (!current) {
        throw new PaymentVerificationError(
          "PAYMENT_NOT_FOUND",
          "Transaction introuvable."
        );
      }

      if (
        current.provider !==
          verified.provider ||
        current.amount !==
          verified.amount ||
        current.currency.toUpperCase() !==
          verified.currency.toUpperCase()
      ) {
        throw new PaymentVerificationError(
          "FINANCIAL_INTEGRITY_ERROR",
          "Les informations financières ont changé."
        );
      }

      if (current.donation.amount !== current.amount || current.donation.currency.toUpperCase() !== current.currency.toUpperCase()) {
        throw new PaymentVerificationError("FINANCIAL_INTEGRITY_ERROR", "Le don ne correspond pas à la transaction.");
      }

      if (
        current.status ===
        PAYMENT_STATUSES.CONFIRMED
      ) {
        return buildVerificationResult(
          current,
          true
        );
      }

      if (
        current.donation.status ===
        DONATION_STATUSES.CONFIRMED
      ) {
        throw new PaymentVerificationError(
          "DONATION_ALREADY_CONFIRMED",
          "Le don est déjà confirmé par une autre transaction."
        );
      }

      if (
        verifiedStatus ===
        PAYMENT_STATUSES.CONFIRMED
      ) {
        /**
         * Condition atomique :
         * une seule transaction peut
         * passer à CONFIRMED.
         */
        const updated =
          await tx.paymentTransaction.updateMany({
            where: {
              id: current.id,
              status: {
                not:
                  PAYMENT_STATUSES.CONFIRMED,
              },
            },

            data: {
              status:
                PAYMENT_STATUSES.CONFIRMED,

              confirmedAt: now,

              failureReason: null,

              providerReference:
                verified.providerReference ??
                current.providerReference,

              providerTransactionId:
                verified.providerTransactionId ??
                current.providerTransactionId,
            },
          });

        if (updated.count !== 1) {
          const latest =
            await tx.paymentTransaction.findUnique({
              where: {
                id: current.id,
              },
            });

          if (
            latest?.status ===
            PAYMENT_STATUSES.CONFIRMED
          ) {
            return buildVerificationResult(
              latest,
              true
            );
          }

          throw new PaymentVerificationError(
            "CONCURRENT_UPDATE",
            "La transaction a été modifiée simultanément.",
            true
          );
        }

        /**
         * Condition atomique :
         * le don passe à CONFIRMED
         * une seule fois.
         */
        const donationUpdate =
          await tx.donation.updateMany({
            where: {
              id: current.donationId,
              status: {
                not:
                  DONATION_STATUSES.CONFIRMED,
              },
            },

            data: {
              status:
                DONATION_STATUSES.CONFIRMED,

              confirmedAt: now,

              paymentRef:
                verified.providerTransactionId ??
                verified.providerReference ??
                current.id,
            },
          });

        if (
          donationUpdate.count !== 1
        ) {
          throw new PaymentVerificationError(
            "DONATION_CONFIRMATION_CONFLICT",
            "Impossible de confirmer le don une seconde fois."
          );
        }

        return {
          donationId:
            current.donationId,

          transactionId:
            current.id,

          status:
            PAYMENT_STATUSES.CONFIRMED,

          verified: true,

          confirmed: true,

          alreadyProcessed: false,

          confirmedAt: now,
        };
      }

      /**
       * Les statuts non confirmés
       * ne doivent jamais augmenter
       * les montants collectés.
       */

      const newStatus =
        verifiedStatus;

      await tx.paymentTransaction.updateMany({
        where: {
          id: current.id,
          status: {
            not:
              PAYMENT_STATUSES.CONFIRMED,
          },
        },

        data: {
          status: newStatus,

          providerReference:
            verified.providerReference ??
            current.providerReference,

          providerTransactionId:
            verified.providerTransactionId ??
            current.providerTransactionId,
        },
      });

      /**
       * On met à jour le don seulement
       * s'il n'est pas déjà confirmé.
       */
      await tx.donation.updateMany({
        where: {
          id: current.donationId,
          status: {
            not:
              DONATION_STATUSES.CONFIRMED,
          },
        },

        data: {
          status:
            getDonationStatus(newStatus),
        },
      });

      return {
        donationId:
          current.donationId,

        transactionId:
          current.id,

        status:
          newStatus,

        verified: true,

        confirmed: false,

        alreadyProcessed: false,

        confirmedAt: null,
      };
    }
  );
}

// ==================================================
// 12. FONCTION PRINCIPALE DE VÉRIFICATION
// ==================================================

export async function verifyPayment(
  options: VerifyPaymentOptions
): Promise<PaymentVerificationResult> {
  assertInternalId(options.transactionId);

  let transaction =
    await getPaymentTransaction(
      options.transactionId
    );

  if (
    options.expectedProvider &&
    transaction.provider !==
      options.expectedProvider
  ) {
    throw new PaymentVerificationError(
      "PROVIDER_MISMATCH",
      "Prestataire incorrect."
    );
  }

  const externalId =
    normalizeProviderReference(
      options.providerTransactionId
    );

  if (externalId) {
    transaction =
      await attachProviderTransactionId(
        transaction,
        externalId
      );
  }

  /**
   * Une transaction déjà confirmée
   * ne nécessite pas un nouvel appel
   * à l'API du prestataire.
   */
  if (
    transaction.status ===
    PAYMENT_STATUSES.CONFIRMED
  ) {
    return buildVerificationResult(
      transaction,
      true
    );
  }

  if (
    !transaction.providerTransactionId
  ) {
    throw new PaymentVerificationError(
      "MISSING_PROVIDER_TRANSACTION_ID",
      "La référence externe du paiement n'est pas encore disponible.",
      true
    );
  }

  const adapter =
    getProviderAdapter(
      transaction.provider
    );

  /**
   * Appel serveur à FedaPay ou Kkiapay.
   * Aucun statut transmis par le
   * navigateur n'est accepté.
   */
  const verified =
    await adapter.verifyPayment(
      toPaymentTransactionRecord(
        transaction
      )
    );

  assertFinancialIntegrity(
    transaction,
    verified
  );

  return persistVerifiedPayment(
    transaction,
    verified
  );
}

// ==================================================
// 13. VÉRIFICATION PAR IDENTIFIANT INTERNE
// ==================================================

export async function verifyPaymentById(
  transactionId: string
): Promise<PaymentVerificationResult> {
  return verifyPayment({
    transactionId,
  });
}

// ==================================================
// 14. VÉRIFICATION APRÈS WIDGET KKIAPAY
// ==================================================

/**
 * À appeler uniquement depuis une route
 * ayant validé le droit d'accès à la
 * transaction interne.
 *
 * Le transactionId Kkiapay retourné par
 * le widget n'est pas une preuve de succès.
 */
export async function verifyKkiapayWidgetPayment(
  internalTransactionId: string,
  kkiapayTransactionId: string
): Promise<PaymentVerificationResult> {
  return verifyPayment({
    transactionId:
      internalTransactionId,

    providerTransactionId:
      kkiapayTransactionId,

    expectedProvider:
      PAYMENT_PROVIDERS.KKIAPAY,
  });
}

// ==================================================
// 15. VÉRIFICATION FedaPay
// ==================================================

export async function verifyFedaPayTransaction(
  internalTransactionId: string
): Promise<PaymentVerificationResult> {
  return verifyPayment({
    transactionId:
      internalTransactionId,

    expectedProvider:
      PAYMENT_PROVIDERS.FEDAPAY,
  });
}

// ==================================================
// 16. LECTURE DU STATUT EN BASE
// ==================================================

/**
 * Cette fonction lit le statut enregistré.
 *
 * Elle ne lance pas une vérification
 * auprès du prestataire.
 *
 * Les routes publiques devront vérifier
 * les droits d'accès avant de retourner
 * les données.
 */
export async function getStoredPaymentStatus(
  transactionId: string
): Promise<{
  donationId: string;
  transactionId: string;
  status: PaymentStatus;
  confirmed: boolean;
  confirmedAt: Date | null;
}> {
  assertInternalId(transactionId);

  const transaction =
    await getPaymentTransaction(
      transactionId
    );

  const status =
    isPaymentStatus(transaction.status)
      ? transaction.status
      : PAYMENT_STATUSES.PENDING;

  return {
    donationId:
      transaction.donationId,

    transactionId:
      transaction.id,

    status,

    confirmed:
      status === PAYMENT_STATUSES.CONFIRMED,

    confirmedAt:
      transaction.confirmedAt,
  };
}

export default verifyPayment;
