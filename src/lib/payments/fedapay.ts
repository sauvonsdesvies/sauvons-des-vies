
/**
 * FONDATION SAUVONS DES VIES
 * src/lib/payments/fedapay.ts
 *
 * Adaptateur FedaPay serveur.
 * Aucune écriture directe dans Prisma.
 * Aucune confirmation de don sans vérification distante.
 */

import "server-only";

import {
  PAYMENT_METHODS,
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES,
  type PaymentProviderAdapter,
  type ProviderPaymentRequest,
  type ProviderPaymentResult,
  type ProviderPaymentVerification,
  type PaymentStatus,
  type PaymentTransactionRecord,
} from "./types";

type UnknownRecord = Record<string, unknown>;

const FEDAPAY_PROVIDER = PAYMENT_PROVIDERS.FEDAPAY;
const REQUEST_TIMEOUT_MS = 15000;

interface FedaPayTransaction {
  id: string;
  reference: string | null;
  status: string;
  amount: number;
  currency: string | null;
  currencyId: string | null;
}

interface FedaPayToken {
  token: string | null;
  url: string;
}

function isRecord(value: unknown): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

function getIdentifier(value: unknown): string | null {
  if (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  ) {
    return String(value);
  }

  return getString(value);
}

function getPositiveInteger(value: unknown): number | null {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  )
    ? value
    : null;
}

function normalizeCurrency(value: unknown): string | null {
  if (typeof value === "string") {
    const code = value.trim().toUpperCase();
    return /^[A-Z]{3}$/.test(code) ? code : null;
  }

  if (isRecord(value)) {
    return normalizeCurrency(value.iso ?? value.code);
  }

  return null;
}

function getApiUrl(): string {
  const mode =
    process.env.FEDAPAY_ENVIRONMENT?.trim().toLowerCase() ??
    "live";

  if (mode === "sandbox") {
    return "https://sandbox-api.fedapay.com/v1";
  }

  if (mode === "live") {
    return "https://api.fedapay.com/v1";
  }

  throw new Error("FEDAPAY_INVALID_ENVIRONMENT");
}

function getFedaPaySecretKey(): string {
  const key = process.env.FEDAPAY_SECRET_KEY?.trim();

  if (!key) {
    throw new Error("FEDAPAY_SECRET_KEY_NOT_CONFIGURED");
  }

  return key;
}

function validateCallbackUrl(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("FEDAPAY_INVALID_CALLBACK_URL");
  }

  if (
    (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))) ||
    url.username ||
    url.password
  ) {
    throw new Error("FEDAPAY_INVALID_CALLBACK_URL");
  }

  return url.toString();
}

function getCallbackUrl(): string | undefined {
  const configured = process.env.FEDAPAY_CALLBACK_URL?.trim();

  return configured
    ? validateCallbackUrl(configured)
    : undefined;
}

/**
 * Journal limité à des diagnostics non personnels.
 * Ne jamais enregistrer la requête brute ni les secrets.
 */
function logProviderError(
  status: number,
  payload: unknown
): void {
  const record = isRecord(payload) ? payload : null;

  const fields =
    record && isRecord(record.errors)
      ? Object.keys(record.errors)
          .filter((field) => /^[a-zA-Z0-9_.-]+$/.test(field))
          .slice(0, 20)
      : [];

  const providerCode =
    record &&
    (typeof record.code === "string" ||
      typeof record.code === "number")
      ? String(record.code).slice(0, 80)
      : null;

  console.error("[payments/fedapay] Request rejected", {
    status,
    providerCode,
    invalidFields: fields,
  });
}

async function fedaPayRequest(
  method: "GET" | "POST",
  path: string,
  body?: UnknownRecord
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS
  );

  try {
    const response = await fetch(`${getApiUrl()}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${getFedaPaySecretKey()}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorPayload: unknown = null;

      try {
        errorPayload = await response.json();
      } catch {
        // Une réponse non JSON ne doit pas masquer
        // le code HTTP d'origine.
      }

      logProviderError(response.status, errorPayload);

      if (response.status === 401 || response.status === 403) {
        throw new Error("FEDAPAY_AUTHENTICATION_FAILED");
      }

      if (response.status === 429) {
        throw new Error("FEDAPAY_RATE_LIMITED");
      }

      if (response.status >= 500) {
        throw new Error("FEDAPAY_SERVICE_UNAVAILABLE");
      }

      throw new Error(
        `FEDAPAY_REQUEST_FAILED_${response.status}`
      );
    }

    const result: unknown = await response.json();

    if (!isRecord(result)) {
      throw new Error("FEDAPAY_INVALID_API_RESPONSE");
    }

    if (result.success === false) {
      logProviderError(response.status, result);
      throw new Error("FEDAPAY_API_REJECTED_REQUEST");
    }

    return result;
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {
      throw new Error("FEDAPAY_REQUEST_TIMEOUT");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeFedaPayStatus(
  value: unknown
): PaymentStatus {
  const status = getString(value)?.toLowerCase();

  switch (status) {
    case "approved":
    case "transferred":
      return PAYMENT_STATUSES.CONFIRMED;

    case "declined":
    case "failed":
      return PAYMENT_STATUSES.FAILED;

    case "canceled":
    case "cancelled":
      return PAYMENT_STATUSES.CANCELLED;

    case "expired":
      return PAYMENT_STATUSES.EXPIRED;

    case "processing":
      return PAYMENT_STATUSES.PROCESSING;

    case "pending":
    case "created":
    default:
      return PAYMENT_STATUSES.PENDING;
  }
}

function parseFedaPayTransaction(
  payload: unknown
): FedaPayTransaction {
  if (!isRecord(payload)) {
    throw new Error("FEDAPAY_INVALID_TRANSACTION_RESPONSE");
  }

  const raw = isRecord(payload["v1/transaction"])
    ? payload["v1/transaction"]
    : isRecord(payload.transaction)
      ? payload.transaction
      : payload;

  const id = getIdentifier(raw.id);
  const status = getString(raw.status);
  const amount = getPositiveInteger(raw.amount);

  if (!id || !status || amount === null) {
    throw new Error("FEDAPAY_INCOMPLETE_TRANSACTION");
  }

  return {
    id,
    reference: getIdentifier(raw.reference),
    status,
    amount,
    currency: normalizeCurrency(raw.currency),
    currencyId: getIdentifier(raw.currency_id),
  };
}

function validateCheckoutUrl(value: unknown): string {
  const raw = getString(value);

  if (!raw) {
    throw new Error("FEDAPAY_MISSING_CHECKOUT_URL");
  }

  let url: URL;

  try {
    url = new URL(raw);
  } catch {
    throw new Error("FEDAPAY_INVALID_CHECKOUT_URL");
  }

  const host = url.hostname.toLowerCase();

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    !(
      host === "fedapay.com" ||
      host.endsWith(".fedapay.com")
    )
  ) {
    throw new Error("FEDAPAY_UNTRUSTED_CHECKOUT_URL");
  }

  return url.toString();
}

function parseFedaPayToken(payload: unknown): FedaPayToken {
  if (!isRecord(payload)) {
    throw new Error("FEDAPAY_INVALID_TOKEN_RESPONSE");
  }

  const nested = isRecord(payload["v1/token"])
    ? payload["v1/token"]
    : isRecord(payload.token)
      ? payload.token
      : payload;

  const url =
    getString(nested.url) ??
    getString(payload.url);

  const token =
    getString(nested.token) ??
    (typeof payload.token === "string"
      ? getString(payload.token)
      : null);

  return {
    token,
    url: validateCheckoutUrl(url),
  };
}

async function createFedaPayTransaction(
  request: ProviderPaymentRequest
): Promise<FedaPayTransaction> {
  if (
    !Number.isSafeInteger(request.amount) ||
    request.amount <= 0
  ) {
    throw new Error("FEDAPAY_INVALID_AMOUNT");
  }

  const currency = normalizeCurrency(request.currency);

  if (currency !== "XOF") {
    throw new Error("FEDAPAY_INVALID_CURRENCY");
  }

  const email = request.donor.email?.trim();

  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new Error("FEDAPAY_INVALID_CUSTOMER_EMAIL");
  }

  /**
   * Le formulaire public ne demande que
   * l'e-mail et le téléphone.
   *
   * FedaPay documente customer.email pour
   * les clients existants.
   *
   * Pour un nouveau client, le prestataire
   * peut exiger d'autres informations.
   * Ne jamais inventer un prénom ou un nom.
   */
  const body: UnknownRecord = {
    description: request.description,
    amount: request.amount,
    currency: { iso: currency },
    customer: { email },
    custom_metadata: {
      transactionId: request.transactionId,
      donationId: request.donationId,
    },
  };

  const callbackUrl =
    request.returnUrl?.trim() || getCallbackUrl();

  if (callbackUrl) {
    body.callback_url = validateCallbackUrl(callbackUrl);
  }

  const response = await fedaPayRequest(
    "POST",
    "/transactions",
    body
  );

  const transaction = parseFedaPayTransaction(response);

  if (transaction.amount !== request.amount) {
    throw new Error("FEDAPAY_CREATED_AMOUNT_MISMATCH");
  }

  if (
    transaction.currency &&
    transaction.currency !== currency
  ) {
    throw new Error("FEDAPAY_CREATED_CURRENCY_MISMATCH");
  }

  return transaction;
}

async function generateFedaPayCheckout(
  transactionId: string
): Promise<FedaPayToken> {
  if (!/^\d+$/.test(transactionId)) {
    throw new Error("FEDAPAY_INVALID_TRANSACTION_ID");
  }

  const response = await fedaPayRequest(
    "POST",
    `/transactions/${transactionId}/token`
  );

  return parseFedaPayToken(response);
}

async function checkoutAction(transactionId: string, language = "fr"): Promise<ProviderPaymentResult["nextAction"]> {
  const publicKey = process.env.FEDAPAY_PUBLIC_KEY?.trim() || process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY?.trim();
  const environment = process.env.FEDAPAY_ENVIRONMENT?.trim().toLowerCase() || "live";
  // Checkout.js accepts the ID of a transaction already created by our server.
  // Never let the browser create an unrelated transaction or choose its amount.
  if (publicKey && /^pk_(sandbox|live)_/.test(publicKey)) {
    if (!publicKey.startsWith(`pk_${environment}_`)) throw new Error("FEDAPAY_PUBLIC_KEY_ENVIRONMENT_MISMATCH");
    const id = Number(transactionId);
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error("FEDAPAY_INVALID_TRANSACTION_ID");
    return {
      type: "SDK", provider: FEDAPAY_PROVIDER, publicToken: publicKey,
      payload: { public_key: publicKey, environment, locale: language, transaction: { id } },
    };
  }
  const checkout = await generateFedaPayCheckout(transactionId);
  return { type: "REDIRECT", url: checkout.url };
}

export async function createFedaPayPayment(
  request: ProviderPaymentRequest
): Promise<ProviderPaymentResult> {
  if (
    request.paymentMethod !== PAYMENT_METHODS.MOBILE_MONEY &&
    request.paymentMethod !== PAYMENT_METHODS.CARD &&
    request.paymentMethod !== PAYMENT_METHODS.WAVE
  ) {
    throw new Error("FEDAPAY_UNSUPPORTED_PAYMENT_METHOD");
  }

  const transaction =
    await createFedaPayTransaction(request);

  await request.onTransactionCreated?.(transaction.id, transaction.reference);

  const nextAction = await checkoutAction(transaction.id, request.language);

  return {
    provider: FEDAPAY_PROVIDER,
    providerReference: transaction.reference ?? undefined,
    providerTransactionId: transaction.id,
    status: PAYMENT_STATUSES.PENDING,
    nextAction,
    metadata: {
      paymentMethod: request.paymentMethod,
      providerStatus: transaction.status,
    },
  };
}

/** Obtain a new checkout link for the existing remote transaction, never create another. */
export async function resumeFedaPayPayment(transaction: PaymentTransactionRecord, language = "fr"): Promise<ProviderPaymentResult> {
  const verified = await verifyFedaPayPayment(transaction);
  if (verified.status !== PAYMENT_STATUSES.PENDING && verified.status !== PAYMENT_STATUSES.PROCESSING) {
    return { provider: FEDAPAY_PROVIDER, status: verified.status, nextAction: { type: "WAIT_FOR_CONFIRMATION" } };
  }
  const nextAction = await checkoutAction(transaction.providerTransactionId!, language);
  return { provider: FEDAPAY_PROVIDER, status: verified.status, providerTransactionId: transaction.providerTransactionId!, providerReference: transaction.providerReference ?? undefined, nextAction };
}

export function validateFedaPayReturnUrl(returnUrl?: string) {
  const value = returnUrl?.trim() || getCallbackUrl();
  if (value) validateCallbackUrl(value);
}

async function retrieveFedaPayTransaction(
  transactionId: string
): Promise<FedaPayTransaction> {
  if (!/^\d+$/.test(transactionId)) {
    throw new Error("FEDAPAY_INVALID_TRANSACTION_ID");
  }

  const response = await fedaPayRequest(
    "GET",
    `/transactions/${transactionId}`
  );

  const transaction = parseFedaPayTransaction(response);

  if (
    !transaction.currency &&
    transaction.currencyId &&
    /^\d+$/.test(transaction.currencyId)
  ) {
    const result = await fedaPayRequest(
      "GET",
      `/currencies/${transaction.currencyId}`
    );

    const raw =
      isRecord(result) && isRecord(result["v1/currency"])
        ? result["v1/currency"]
        : isRecord(result) && isRecord(result.currency)
          ? result.currency
          : result;

    if (
      !isRecord(raw) ||
      getIdentifier(raw.id) !== transaction.currencyId
    ) {
      throw new Error("FEDAPAY_CURRENCY_REFERENCE_MISMATCH");
    }

    transaction.currency = normalizeCurrency(raw);
  }

  return transaction;
}

export async function verifyFedaPayPayment(
  transaction: PaymentTransactionRecord
): Promise<ProviderPaymentVerification> {
  if (transaction.provider !== FEDAPAY_PROVIDER) {
    throw new Error("FEDAPAY_PROVIDER_MISMATCH");
  }

  if (!transaction.providerTransactionId) {
    throw new Error("FEDAPAY_MISSING_TRANSACTION_ID");
  }

  const remote = await retrieveFedaPayTransaction(
    transaction.providerTransactionId
  );

  if (remote.id !== transaction.providerTransactionId) {
    throw new Error("FEDAPAY_TRANSACTION_ID_MISMATCH");
  }

  if (
    transaction.providerReference &&
    remote.reference &&
    transaction.providerReference !== remote.reference
  ) {
    throw new Error("FEDAPAY_REFERENCE_MISMATCH");
  }

  if (remote.amount !== transaction.amount) {
    throw new Error("FEDAPAY_AMOUNT_MISMATCH");
  }

  if (
    !remote.currency ||
    remote.currency !== transaction.currency.toUpperCase()
  ) {
    throw new Error("FEDAPAY_CURRENCY_MISMATCH");
  }

  const status = normalizeFedaPayStatus(remote.status);

  return {
    provider: FEDAPAY_PROVIDER,
    providerReference: remote.reference ?? undefined,
    providerTransactionId: remote.id,
    status,
    amount: remote.amount,
    currency: remote.currency,
    confirmedAt: null,
    metadata: {
      providerStatus: remote.status,
      currencyVerified: true,
    },
  };
}

export const fedaPayAdapter: PaymentProviderAdapter = {
  provider: FEDAPAY_PROVIDER,
  createPayment: createFedaPayPayment,
  verifyPayment: verifyFedaPayPayment,
};

export default fedaPayAdapter;
