
/**
 * FONDATION SAUVONS DES VIES
 * ==========================================
 * src/lib/payments/kkiapay.ts
 *
 * Intégration serveur Kkiapay.
 *
 * - Préparation du widget officiel
 * - Utilisation du compte marchand réel
 * - Vérification serveur des transactions
 * - Contrôle strict du montant et de la devise
 * - Aucune confirmation sur simple retour navigateur
 * - Aucune écriture directe dans Prisma
 *
 * Le rapprochement final avec la base
 * et l'idempotence sont gérés séparément.
 * ==========================================
 */

import "server-only";

import {
  PAYMENT_METHODS,
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES,
  type PaymentMethod,
  type PaymentProviderAdapter,
  type PaymentStatus,
  type PaymentTransactionRecord,
  type ProviderPaymentRequest,
  type ProviderPaymentResult,
  type ProviderPaymentVerification,
} from "./types";

// ==========================================
// 1. TYPES INTERNES
// ==========================================

type UnknownRecord = Record<string, unknown>;

type KkiapayClient = {
  verify: (transactionId: string) => Promise<unknown>;
};

type KkiapayFactory = (
  configuration: {
    publickey: string;
    privatekey: string;
    secretkey: string;
    sandbox?: boolean;
  }
) => KkiapayClient;

type KkiapaySdkModule = {
  default?: KkiapayFactory;
  kkiapay?: KkiapayFactory;
};

type KkiapayVerifiedTransaction = {
  id: string;
  status: PaymentStatus;
  originalStatus: string;
  amount: number;
  currency: string;
  reference: string | null;
  partnerId: string | null;
};

// ==========================================
// 2. CONSTANTES
// ==========================================

const PROVIDER = PAYMENT_PROVIDERS.KKIAPAY;

const PAYMENT_CURRENCY = "XOF";

const PAYMENT_METHOD_MAPPING: Record<
  Exclude<PaymentMethod, "WAVE">,
  "momo" | "card"
> = {
  MOBILE_MONEY: "momo",
  CARD: "card",
};

// ==========================================
// 3. OUTILS
// ==========================================

function isRecord(
  value: unknown
): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function readString(
  value: unknown
): string | null {
  if (
    typeof value === "string" &&
    value.trim().length > 0
  ) {
    return value.trim();
  }

  return null;
}

function readIdentifier(
  value: unknown
): string | null {
  if (
    typeof value === "number" &&
    Number.isSafeInteger(value)
  ) {
    return String(value);
  }

  return readString(value);
}

function readAmount(
  value: unknown
): number | null {
  if (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    /^[1-9]\d*$/.test(value)
  ) {
    const amount = Number(value);

    return Number.isSafeInteger(amount)
      ? amount
      : null;
  }

  return null;
}

function readCurrency(
  value: unknown
): string | null {
  if (typeof value === "string") {
    const currency = value.trim().toUpperCase();

    return /^[A-Z]{3}$/.test(currency)
      ? currency
      : null;
  }

  if (isRecord(value)) {
    return readCurrency(
      value.iso ?? value.code
    );
  }

  return null;
}

function requiredEnvironmentVariable(
  name: string
): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `KKIAPAY_MISSING_CONFIGURATION_${name}`
    );
  }

  return value;
}

function normalizePhone(
  value: string | null | undefined
): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const phone = value.replace(
    /[\s().-]/g,
    ""
  );

  if (!/^\+?[1-9]\d{6,14}$/.test(phone)) {
    throw new Error(
      "KKIAPAY_INVALID_PHONE"
    );
  }

  return phone;
}

function normalizeEmail(
  value: string | null | undefined
): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const email = value.trim();

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new Error(
      "KKIAPAY_INVALID_EMAIL"
    );
  }

  return email;
}

// ==========================================
// 4. CONFIGURATION MARCHAND
// ==========================================

function getPublicKey(): string {
  const existingPublicKey = process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY?.trim();
  if (!process.env.KKIAPAY_PUBLIC_KEY?.trim() && existingPublicKey) return existingPublicKey;
  return requiredEnvironmentVariable(
    "KKIAPAY_PUBLIC_KEY"
  );
}

function getServerCredentials() {
  return {
    publickey: getPublicKey(),
    privatekey: requiredEnvironmentVariable(
      "KKIAPAY_PRIVATE_KEY"
    ),
    secretkey: requiredEnvironmentVariable(
      "KKIAPAY_SECRET_KEY"
    ),
    sandbox: isSandbox(),
  };
}

/** Both widget and server verification use the same merchant environment. */
function isSandbox(): boolean {
  const mode = process.env.KKIAPAY_SANDBOX?.trim().toLowerCase();
  if (mode && mode !== "true" && mode !== "false") throw new Error("KKIAPAY_INVALID_ENVIRONMENT");
  if (mode === "true" && process.env.NODE_ENV === "production") throw new Error("KKIAPAY_SANDBOX_REQUIRES_TEST_DEPLOYMENT");
  return mode === "true";
}

// ==========================================
// 5. MÉTHODES SUPPORTÉES
// ==========================================

function getWidgetPaymentMethod(
  method: PaymentMethod
): "momo" | "card" {
  if (
    method === PAYMENT_METHODS.MOBILE_MONEY ||
    method === PAYMENT_METHODS.CARD
  ) {
    return PAYMENT_METHOD_MAPPING[method];
  }

  /**
   * Wave n'est pas associé arbitrairement
   * à momo ou card.
   *
   * Son intégration dédiée nécessitera
   * une confirmation du mode d'appel
   * officiellement disponible.
   */
  throw new Error(
    "KKIAPAY_WAVE_METHOD_NOT_CONFIGURED"
  );
}

// ==========================================
// 6. CRÉATION / PRÉPARATION DU PAIEMENT
// ==========================================

export async function createKkiapayPayment(
  request: ProviderPaymentRequest
): Promise<ProviderPaymentResult> {
  isSandbox();

  if (
    !Number.isSafeInteger(request.amount) ||
    request.amount <= 0
  ) {
    throw new Error(
      "KKIAPAY_INVALID_AMOUNT"
    );
  }

  if (
    request.currency.toUpperCase() !==
    PAYMENT_CURRENCY
  ) {
    throw new Error(
      "KKIAPAY_UNSUPPORTED_CURRENCY"
    );
  }

  if (
    !request.transactionId ||
    !request.donationId ||
    !request.idempotencyKey
  ) {
    throw new Error(
      "KKIAPAY_MISSING_INTERNAL_REFERENCE"
    );
  }

  const paymentMethod = getWidgetPaymentMethod(
    request.paymentMethod
  );

  const email = normalizeEmail(
    request.donor.email
  );

  const phone = normalizePhone(
    request.donor.phone
  );

  if (
    paymentMethod === "momo" &&
    !phone
  ) {
    throw new Error(
      "KKIAPAY_PHONE_REQUIRED"
    );
  }

  const publicKey = getPublicKey();

  /**
   * Kkiapay initialise le paiement
   * dans son widget JavaScript.
   *
   * Aucun identifiant de transaction
   * Kkiapay n'existe encore ici.
   *
   * Le SDK retourne cet identifiant
   * après l'opération de paiement.
   */

  const widgetPayload: Record<
    string,
    unknown
  > = {
    amount: request.amount,
    key: publicKey,
    sandbox: isSandbox(),
    position: "center",
    paymentmethod: [paymentMethod],
    data: request.transactionId,
    partnerId: request.transactionId,
    excludeMomoFields: ["name"],
  };

  if (email) {
    widgetPayload.email = email;
  }

  if (phone) {
    widgetPayload.phone = phone;
  }

  if (request.donor.name?.trim()) {
    widgetPayload.name =
      request.donor.name.trim();
  }

  return {
    provider: PROVIDER,

    status: PAYMENT_STATUSES.PENDING,

    nextAction: {
      type: "SDK",
      provider: PROVIDER,
      publicToken: publicKey,
      payload: widgetPayload,
    },

    metadata: {
      paymentMethod: request.paymentMethod,
      internalTransactionId:
        request.transactionId,
      checkoutType: "KKIAPAY_WIDGET",
    },
  };
}

// ==========================================
// 7. CHARGEMENT DU SDK SERVEUR
// ==========================================

async function getKkiapayClient(): Promise<
  KkiapayClient
> {
  isSandbox();

  const credentials =
    getServerCredentials();

  /**
   * Le SDK officiel est chargé
   * uniquement sur le serveur.
   *
   * require est utilisé ici afin
   * d'éviter les problèmes de typage
   * des anciennes versions du SDK.
   */

  const sdk = await import("kkiapay-nodejs-sdk") as KkiapaySdkModule;

  let factory: KkiapayFactory | undefined;

  if (typeof sdk === "function") {
    factory = sdk;
  } else if (isRecord(sdk)) {
    if (typeof sdk.default === "function") {
      factory = sdk.default as KkiapayFactory;
    } else if (
      typeof sdk.kkiapay === "function"
    ) {
      factory = sdk.kkiapay as KkiapayFactory;
    }
  }

  if (!factory) {
    throw new Error(
      "KKIAPAY_INVALID_SERVER_SDK"
    );
  }

  const client = factory(credentials);

  if (
    !client ||
    typeof client.verify !== "function"
  ) {
    throw new Error(
      "KKIAPAY_VERIFY_UNAVAILABLE"
    );
  }

  return client;
}

// ==========================================
// 8. NORMALISATION DES STATUTS
// ==========================================

function normalizeKkiapayStatus(
  value: unknown
): PaymentStatus {
  const status = readString(value)?.toUpperCase();

  switch (status) {
    case "SUCCESS":
    case "SUCCESSFUL":
    case "SUCCEEDED":
    case "COMPLETED":
    case "APPROVED":
      return PAYMENT_STATUSES.CONFIRMED;

    case "FAILED":
    case "FAILURE":
    case "DECLINED":
    case "ERROR":
      return PAYMENT_STATUSES.FAILED;

    case "CANCELLED":
    case "CANCELED":
      return PAYMENT_STATUSES.CANCELLED;

    case "EXPIRED":
      return PAYMENT_STATUSES.EXPIRED;

    case "PROCESSING":
    case "IN_PROGRESS":
      return PAYMENT_STATUSES.PROCESSING;

    default:
      // Aucun statut inconnu ne
      // confirme un paiement.
      return PAYMENT_STATUSES.PENDING;
  }
}

// ==========================================
// 9. LECTURE DE LA RÉPONSE KKIAPAY
// ==========================================

function parseVerifiedTransaction(
  response: unknown
): KkiapayVerifiedTransaction {
  if (!isRecord(response)) {
    throw new Error(
      "KKIAPAY_INVALID_VERIFY_RESPONSE"
    );
  }

  const transaction = isRecord(
    response.transaction
  )
    ? response.transaction
    : response;

  const id =
    readIdentifier(
      transaction.transactionId
    ) ??
    readIdentifier(transaction.id);

  const originalStatus =
    readString(transaction.status);

  const amount = readAmount(
    transaction.amount
  );

  /**
   * La devise est vérifiée explicitement.
   * Nous n'inventons pas une devise
   * lorsque le SDK ne la fournit pas.
   */
  const currency = readCurrency(
    transaction.currency
  );

  if (
    !id ||
    !originalStatus ||
    amount === null ||
    !currency
  ) {
    throw new Error(
      "KKIAPAY_INCOMPLETE_VERIFY_RESPONSE"
    );
  }

  return {
    id,
    status: normalizeKkiapayStatus(
      originalStatus
    ),
    originalStatus,
    partnerId: readIdentifier(transaction.partnerId) ?? (isRecord(transaction.stateData) ? readIdentifier(transaction.stateData.partnerId) : null),
    amount,
    currency,
    reference:
      readIdentifier(
        transaction.reference
      ) ?? null,
  };
}

// ==========================================
// 10. VÉRIFICATION SERVEUR
// ==========================================

export async function verifyKkiapayPayment(
  transaction: PaymentTransactionRecord
): Promise<ProviderPaymentVerification> {
  if (
    transaction.provider !== PROVIDER
  ) {
    throw new Error(
      "KKIAPAY_PROVIDER_MISMATCH"
    );
  }

  if (
    !transaction.providerTransactionId
  ) {
    throw new Error(
      "KKIAPAY_TRANSACTION_ID_REQUIRED"
    );
  }

  if (
    !Number.isSafeInteger(
      transaction.amount
    ) ||
    transaction.amount <= 0
  ) {
    throw new Error(
      "KKIAPAY_INVALID_EXPECTED_AMOUNT"
    );
  }

  const client =
    await getKkiapayClient();

  const response = await client.verify(
    transaction.providerTransactionId
  );

  const verified =
    parseVerifiedTransaction(response);

  if (
    verified.id !==
    transaction.providerTransactionId
  ) {
    throw new Error(
      "KKIAPAY_TRANSACTION_ID_MISMATCH"
    );
  }

  if (
    verified.amount !==
    transaction.amount
  ) {
    throw new Error(
      "KKIAPAY_AMOUNT_MISMATCH"
    );
  }

  if (
    verified.currency !==
    transaction.currency.toUpperCase()
  ) {
    throw new Error(
      "KKIAPAY_CURRENCY_MISMATCH"
    );
  }

  if (
    transaction.providerReference &&
    verified.reference &&
    transaction.providerReference !==
      verified.reference
  ) {
    throw new Error(
      "KKIAPAY_REFERENCE_MISMATCH"
    );
  }

  if (verified.partnerId !== transaction.id) {
    throw new Error("KKIAPAY_INTERNAL_TRANSACTION_MISMATCH");
  }

  return {
    provider: PROVIDER,

    providerReference:
      verified.reference ?? undefined,

    providerTransactionId:
      verified.id,

    status: verified.status,

    amount: verified.amount,

    currency: verified.currency,

    confirmedAt: null,

    metadata: {
      providerStatus:
        verified.originalStatus,
      verificationSource:
        "KKIAPAY_SERVER_SDK",
    },
  };
}

// ==========================================
// 11. ADAPTATEUR COMMUN
// ==========================================

export const kkiapayAdapter:
  PaymentProviderAdapter = {
    provider: PROVIDER,

    createPayment:
      createKkiapayPayment,

    verifyPayment:
      verifyKkiapayPayment,
  };

export default kkiapayAdapter;
