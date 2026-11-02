
/**
 * FONDATION SAUVONS DES VIES
 * ==========================================
 * src/lib/payments/types.ts
 *
 * Types partagés du système de paiement.
 *
 * Prestataires :
 * - FedaPay
 * - Kkiapay
 *
 * Moyens de paiement :
 * - Mobile Money
 * - Carte bancaire
 * - Wave
 *
 * IMPORTANT :
 * - Aucun secret API dans ce fichier.
 * - Aucun traitement de carte bancaire sensible.
 * - Aucun don confirmé sans vérification serveur.
 * - Les prestataires ne sont pas affichés aux donateurs.
 * - Compatible avec les modèles Prisma existants.
 * ==========================================
 */

// ==========================================
// 1. CONSTANTES
// ==========================================

export const PAYMENT_PROVIDERS = {
  FEDAPAY: "FEDAPAY",
  KKIAPAY: "KKIAPAY",
} as const;

export type PaymentProvider =
  (typeof PAYMENT_PROVIDERS)[keyof typeof PAYMENT_PROVIDERS];

export const PAYMENT_METHODS = {
  MOBILE_MONEY: "MOBILE_MONEY",
  CARD: "CARD",
  WAVE: "WAVE",
} as const;

export type PaymentMethod =
  (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

export const PAYMENT_STATUSES = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  CONFIRMED: "CONFIRMED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
} as const;

export type PaymentStatus =
  (typeof PAYMENT_STATUSES)[keyof typeof PAYMENT_STATUSES];

export const DONATION_STATUSES = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;

export type DonationStatus =
  (typeof DONATION_STATUSES)[keyof typeof DONATION_STATUSES];

export const PAYMENT_LANGUAGES = [
  "fr",
  "en",
  "de",
  "es",
] as const;

export type PaymentLanguage =
  (typeof PAYMENT_LANGUAGES)[number];

export const DEFAULT_PAYMENT_CURRENCY = "XOF" as const;

export const DEFAULT_PAYMENT_LANGUAGE: PaymentLanguage = "fr";

// ==========================================
// 2. TYPES UTILITAIRES
// ==========================================

export type PaymentCurrency = string;

export type PaymentIdentifier = string;

export type PaymentDate = string;

export type PaymentMetadataValue =
  | string
  | number
  | boolean
  | null;

export type PaymentMetadata = Record<
  string,
  PaymentMetadataValue
>;

export type PaymentErrorCode =
  | "INVALID_REQUEST"
  | "INVALID_AMOUNT"
  | "INVALID_CURRENCY"
  | "INVALID_PHONE"
  | "INVALID_EMAIL"
  | "INVALID_CAMPAIGN"
  | "CAMPAIGN_UNAVAILABLE"
  | "METHOD_UNAVAILABLE"
  | "PROVIDER_UNAVAILABLE"
  | "PAYMENT_NOT_FOUND"
  | "PAYMENT_EXPIRED"
  | "PAYMENT_CANCELLED"
  | "PAYMENT_FAILED"
  | "PAYMENT_PENDING"
  | "PAYMENT_ALREADY_CONFIRMED"
  | "DUPLICATE_REQUEST"
  | "VERIFICATION_FAILED"
  | "INVALID_WEBHOOK"
  | "INVALID_SIGNATURE"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "NETWORK_ERROR"
  | "PROVIDER_ERROR"
  | "DATABASE_ERROR"
  | "INTERNAL_ERROR";

export interface PaymentError {
  code: PaymentErrorCode;
  message: string;
  retryable: boolean;
}

// ==========================================
// 3. INFORMATIONS DU DONATEUR
// ==========================================

export interface PaymentDonor {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  isAnonymous?: boolean;
}

// ==========================================
// 4. CONFIGURATION DES MOYENS DE PAIEMENT
// ==========================================

/**
 * Représente une ligne du modèle Prisma
 * PaymentMethodConfig.
 *
 * Cette configuration ne constitue pas
 * une preuve de disponibilité en temps réel.
 */
export interface PaymentMethodConfiguration {
  id: string;
  provider: PaymentProvider;
  paymentMethod: PaymentMethod;
  isEnabled: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Option affichable au donateur.
 *
 * Ne contient volontairement aucun nom
 * de prestataire de paiement.
 */
export interface PublicPaymentMethod {
  id: PaymentMethod;
  label: string;
  description?: string;
  enabled: boolean;
  requiresPhone: boolean;
  requiresEmail: boolean;
}

/**
 * Réponse de l'API :
 * GET /api/payments/methods
 */
export interface AvailablePaymentMethodsResponse {
  success: boolean;
  methods: PublicPaymentMethod[];
  currency: PaymentCurrency;
  error?: PaymentError;
}

// ==========================================
// 5. DEMANDE DE CRÉATION D'UN PAIEMENT
// ==========================================

/**
 * Données reçues depuis le formulaire public.
 *
 * Le client ne choisit jamais directement
 * FEDAPAY ou KKIAPAY.
 *
 * Le prestataire est sélectionné par
 * le service serveur.
 *
 * Le montant et la devise doivent être
 * validés côté serveur.
 */
export interface CreatePaymentRequest {
  campaignId: string;
  amount: number;
  currency: PaymentCurrency;
  paymentMethod: PaymentMethod;

  donor: { email?: string | null; phone: string };

  language?: PaymentLanguage;

  /**
   * Identifiant facultatif de requête
   * pour éviter les créations multiples.
   *
   * Le serveur doit contrôler sa portée
   * et son utilisation.
   */
  idempotencyKey?: string;

}

// ==========================================
// 6. INITIALISATION CÔTÉ PRESTATAIRE
// ==========================================

/**
 * Requête interne envoyée à un adaptateur
 * FedaPay ou Kkiapay.
 *
 * Ce type ne doit pas être utilisé comme
 * corps de requête public.
 */
export interface ProviderPaymentRequest {
  onTransactionCreated?: (id: string, reference: string | null) => Promise<void>;
  returnUrl?: string;
  donationId: string;
  transactionId: string;

  campaignId: string;

  amount: number;
  currency: PaymentCurrency;

  paymentMethod: PaymentMethod;

  donor: PaymentDonor;

  language: PaymentLanguage;

  idempotencyKey: string;

  description: string;
}

/**
 * Les prestataires peuvent proposer des
 * parcours différents selon le moyen
 * de paiement et le compte marchand.
 *
 * Aucune intégration embarquée n'est
 * supposée disponible par défaut.
 */
export type PaymentNextAction =
  | {
      type: "NONE";
    }
  | {
      type: "REDIRECT";
      url: string;
    }
  | {
      type: "SDK";
      provider: PaymentProvider;
      publicToken: string;
      payload: Record<string, unknown>;
    }
  | {
      type: "WAIT_FOR_CONFIRMATION";
      message?: string;
    };

/**
 * Résultat de l'initialisation auprès
 * du prestataire.
 *
 * providerReference ou providerTransactionId
 * doivent être enregistrés pour permettre
 * le rapprochement des confirmations.
 */
export interface ProviderPaymentResult {
  provider: PaymentProvider;

  providerReference?: string;
  providerTransactionId?: string;

  status: PaymentStatus;

  nextAction: PaymentNextAction;

  expiresAt?: Date | null;

  /**
   * Métadonnées techniques filtrées.
   * Ne jamais inclure de secrets.
   */
  metadata?: PaymentMetadata;
}

// ==========================================
// 7. RÉPONSE DE CRÉATION DU PAIEMENT
// ==========================================

/**
 * Réponse publique :
 * POST /api/payments/create
 *
 * Le prestataire est volontairement absent
 * du résultat public, sauf dans une action
 * SDK lorsqu'il est nécessaire au lancement
 * technique du paiement.
 */
export interface CreatePaymentSuccessResponse {
  accessToken: string;
  success: true;

  donationId: string;
  transactionId: string;

  status: PaymentStatus;

  amount: number;
  currency: PaymentCurrency;

  paymentMethod: PaymentMethod;

  nextAction: PaymentNextAction;
}

export interface CreatePaymentFailureResponse {
  success: false;
  error: PaymentError;
}

export type CreatePaymentResponse =
  | CreatePaymentSuccessResponse
  | CreatePaymentFailureResponse;

// ==========================================
// 8. VÉRIFICATION DU STATUT
// ==========================================

/**
 * Résultat obtenu depuis l'API officielle
 * du prestataire, côté serveur.
 *
 * La vérification doit contrôler :
 * - la référence de transaction ;
 * - le montant ;
 * - la devise ;
 * - le prestataire ;
 * - le statut réel du paiement.
 */
export interface ProviderPaymentVerification {
  provider: PaymentProvider;

  providerReference?: string;
  providerTransactionId?: string;

  status: PaymentStatus;

  amount: number;
  currency: PaymentCurrency;

  confirmedAt?: Date | null;

  metadata?: PaymentMetadata;
}

/**
 * Résultat de la vérification locale
 * et du rapprochement avec Prisma.
 */
export interface PaymentVerificationResult {
  donationId: string;
  transactionId: string;

  status: PaymentStatus;

  verified: boolean;

  /**
   * Vrai uniquement si le paiement a été
   * confirmé et enregistré correctement.
   */
  confirmed: boolean;

  /**
   * Indique si la confirmation avait déjà
   * été traitée auparavant.
   */
  alreadyProcessed: boolean;

  confirmedAt?: Date | null;
}

// ==========================================
// 9. STATUT PUBLIC DU PAIEMENT
// ==========================================

/**
 * Réponse :
 * GET /api/payments/status
 *
 * Ne contient pas de données privées
 * du donateur ni de secrets du prestataire.
 *
 * La route devra contrôler l'autorisation
 * d'accès à la transaction.
 */
export interface PaymentStatusSuccessResponse {
  success: true;

  donationId: string;
  transactionId: string;

  status: PaymentStatus;

  amount: number;
  currency: PaymentCurrency;

  paymentMethod: PaymentMethod;

  confirmedAt: PaymentDate | null;
}

export interface PaymentStatusFailureResponse {
  success: false;
  error: PaymentError;
}

export type PaymentStatusResponse =
  | PaymentStatusSuccessResponse
  | PaymentStatusFailureResponse;

// ==========================================
// 10. NOTIFICATIONS WEBHOOK
// ==========================================

/**
 * Événement normalisé après validation
 * de l'authenticité de la notification.
 *
 * Une notification brute ne doit jamais
 * être considérée comme fiable sans
 * vérification adaptée au prestataire.
 */
export interface VerifiedPaymentWebhook {
  provider: PaymentProvider;

  eventId?: string;
  eventType: string;

  providerReference?: string;
  providerTransactionId?: string;

  receivedAt: Date;

  /**
   * Identifiant interne uniquement si
   * le rapprochement est fiable.
   */
  transactionId?: string;
}

/**
 * Résultat du traitement d'une notification.
 */
export interface PaymentWebhookProcessingResult {
  accepted: boolean;

  processed: boolean;

  alreadyProcessed: boolean;

  transactionId?: string;

  error?: PaymentError;
}

// ==========================================
// 11. ENREGISTREMENTS PRISMA
// ==========================================

/**
 * Représentation commune des champs utiles
 * du modèle Prisma Donation.
 *
 * Le schéma conserve des statuts String.
 * Les valeurs doivent être contrôlées
 * dans les services.
 */
export interface DonationPaymentRecord {
  id: string;
  campaignId: string;

  amount: number;
  currency: string;

  donorName: string | null;
  donorEmail: string | null;
  donorPhone: string | null;

  status: string;

  paymentRef: string | null;

  createdAt: Date;
  confirmedAt: Date | null;
}

/**
 * Représentation des champs du modèle
 * Prisma PaymentTransaction.
 */
export interface PaymentTransactionRecord {
  id: string;
  donationId: string;

  provider: string;

  providerReference: string | null;
  providerTransactionId: string | null;

  paymentMethod: string | null;

  amount: number;
  currency: string;

  status: string;

  failureReason: string | null;

  idempotencyKey: string | null;

  expiresAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
  confirmedAt: Date | null;
}

// ==========================================
// 12. CONTRAT DES ADAPTATEURS
// ==========================================

/**
 * Contrat commun que les fichiers
 * fedapay.ts et kkiapay.ts devront
 * implémenter.
 *
 * Cela permet à service.ts de choisir
 * automatiquement le prestataire sans
 * modifier le formulaire public.
 */
export interface PaymentProviderAdapter {
  readonly provider: PaymentProvider;

  createPayment(
    request: ProviderPaymentRequest
  ): Promise<ProviderPaymentResult>;

  verifyPayment(
    transaction: PaymentTransactionRecord
  ): Promise<ProviderPaymentVerification>;
}

// ==========================================
// 13. FONCTIONS DE VALIDATION DES TYPES
// ==========================================

export function isPaymentProvider(
  value: unknown
): value is PaymentProvider {
  return (
    typeof value === "string" &&
    Object.values(PAYMENT_PROVIDERS).some(
      (provider) => provider === value
    )
  );
}

export function isPaymentMethod(
  value: unknown
): value is PaymentMethod {
  return (
    typeof value === "string" &&
    Object.values(PAYMENT_METHODS).some(
      (method) => method === value
    )
  );
}

export function isPaymentStatus(
  value: unknown
): value is PaymentStatus {
  return (
    typeof value === "string" &&
    Object.values(PAYMENT_STATUSES).some(
      (status) => status === value
    )
  );
}

export function isPaymentLanguage(
  value: unknown
): value is PaymentLanguage {
  return (
    typeof value === "string" &&
    PAYMENT_LANGUAGES.some(
      (language) => language === value
    )
  );
}

// ==========================================
// 14. FONCTIONS DE STATUT
// ==========================================

export function isConfirmedPayment(
  status: PaymentStatus
): boolean {
  return status === PAYMENT_STATUSES.CONFIRMED;
}

export function isPendingPayment(
  status: PaymentStatus
): boolean {
  return (
    status === PAYMENT_STATUSES.PENDING ||
    status === PAYMENT_STATUSES.PROCESSING
  );
}

export function isTerminalPaymentStatus(
  status: PaymentStatus
): boolean {
  return (
    status === PAYMENT_STATUSES.CONFIRMED ||
    status === PAYMENT_STATUSES.FAILED ||
    status === PAYMENT_STATUSES.CANCELLED ||
    status === PAYMENT_STATUSES.EXPIRED
  );
}

// ==========================================
// 15. ERREURS STANDARDISÉES
// ==========================================

export function createPaymentError(
  code: PaymentErrorCode,
  message: string,
  retryable = false
): PaymentError {
  return {
    code,
    message,
    retryable,
  };
}
