"use client";

import { formatCfaAmount } from "@/lib/campaigns/currencies";

/**
 * FONDATION SAUVONS DES VIES
 * ==========================================================
 * src/components/public/donations/PaymentStatus.tsx
 *
 * Affichage du statut réel d'un don.
 *
 * - Consultation du statut enregistré sur le serveur
 * - Jeton privé transmis dans un en-tête HTTP
 * - Actualisation automatique limitée
 * - Gestion des erreurs réseau
 * - Arrêt automatique sur statut définitif
 * - Quatre langues : FR / EN / DE / ES
 * - Compatible PC et mobile
 *
 * IMPORTANT :
 * Le composant ne confirme jamais un paiement lui-même.
 * Seul le serveur peut enregistrer une confirmation.
 * ==========================================================
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Heart,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import {
  DEFAULT_PAYMENT_LANGUAGE,
  isPaymentLanguage,
  isPaymentStatus,
  type PaymentLanguage,
  type PaymentStatus,
} from "@/lib/payments/types";

// ==========================================================
// 1. TYPES
// ==========================================================

export interface PaymentStatusProps {
  dialogDismissed?: boolean;
  providerTransactionId?: string;
  verifyOnRefresh?: boolean;
  transactionId: string;

  /**
   * Jeton privé retourné lors de la création
   * du paiement. Ne jamais placer dans l'URL.
   */
  accessToken: string;

  language?: PaymentLanguage;

  className?: string;

  autoRefresh?: boolean;

  refreshIntervalMs?: number;

  maxAutoRefreshMs?: number;

  onConfirmed?: (
    donationId: string,
    transactionId: string
  ) => void;

  onFailed?: (
    donationId: string,
    transactionId: string
  ) => void;
}

type PaymentData = {
  donationId: string;
  transactionId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  paymentMethod: string;
  confirmedAt: string | null;
};

type PaymentApiResponse =
  | ({
      success: true;
    } & PaymentData)
  | {
      success: false;
      error: {
        code: string;
        message: string;
        retryable: boolean;
      };
    };

type Translation = {
  title: string;
  loading: string;
  pendingTitle: string;
  pendingDescription: string;
  processingTitle: string;
  processingDescription: string;
  confirmedTitle: string;
  confirmedDescription: string;
  failedTitle: string;
  failedDescription: string;
  cancelledTitle: string;
  cancelledDescription: string;
  expiredTitle: string;
  expiredDescription: string;
  errorTitle: string;
  errorDescription: string;
  retry: string;
  refresh: string;
  checking: string;
  donationAmount: string;
  reference: string;
  date: string;
  secure: string;
  awaitingUpdate: string;
  verificationPaused: string;
  unavailable: string;
};

// ==========================================================
// 2. CONFIGURATION
// ==========================================================

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ACCESS_TOKEN_REGEX =
  /^[a-f0-9]{64}$/i;

const DEFAULT_REFRESH_INTERVAL = 5000;

const DEFAULT_MAX_REFRESH_DURATION =
  5 * 60 * 1000;

const MAX_CONSECUTIVE_ERRORS = 5;

const FINAL_STATUSES = new Set<PaymentStatus>([
  "CONFIRMED",
  "FAILED",
  "CANCELLED",
  "EXPIRED",
]);

// ==========================================================
// 3. TRADUCTIONS
// ==========================================================

const TRANSLATIONS: Record<
  PaymentLanguage,
  Translation
> = {
  fr: {
    title: "Statut de votre don",
    loading:
      "Vérification…",
    pendingTitle: "Paiement en attente",
    pendingDescription:
      "Finalisez votre paiement pour confirmer le don.",
    processingTitle:
      "Vérification en cours",
    processingDescription:
      "Confirmation du paiement en cours.",
    confirmedTitle:
      "Don confirmé",
    confirmedDescription:
      "Merci pour votre soutien !",
    failedTitle: "Paiement échoué",
    failedDescription:
      "Le paiement n’a pas abouti.",
    cancelledTitle:
      "Paiement annulé",
    cancelledDescription:
      "Le paiement a été annulé.",
    expiredTitle:
      "Paiement expiré",
    expiredDescription:
      "Le délai de paiement est dépassé.",
    errorTitle:
      "Statut indisponible",
    errorDescription:
      "Réessayez dans un instant.",
    retry: "Réessayer",
    refresh: "Actualiser",
    checking: "Vérification...",
    donationAmount: "Montant du don",
    reference: "Référence",
    date: "Date de confirmation",
    secure: "Vérification sécurisée",
    awaitingUpdate:
      "Cette page se met à jour automatiquement.",
    verificationPaused:
      "Actualisez pour vérifier votre paiement.",
    unavailable:
      "Les informations de paiement sont invalides.",
  },

  en: {
    title: "Your donation status",
    loading:
      "Checking…",
    pendingTitle: "Payment pending",
    pendingDescription:
      "Complete payment to confirm your donation.",
    processingTitle:
      "Verification in progress",
    processingDescription:
      "Confirming your payment.",
    confirmedTitle:
      "Donation confirmed",
    confirmedDescription:
      "Thank you for your support!",
    failedTitle: "Payment failed",
    failedDescription:
      "Payment was unsuccessful.",
    cancelledTitle:
      "Payment cancelled",
    cancelledDescription:
      "Payment was cancelled.",
    expiredTitle:
      "Payment expired",
    expiredDescription:
      "The payment time limit has passed.",
    errorTitle:
      "Status unavailable",
    errorDescription:
      "Try again shortly.",
    retry: "Try again",
    refresh: "Refresh",
    checking: "Checking...",
    donationAmount: "Donation amount",
    reference: "Reference",
    date: "Confirmation date",
    secure: "Secure verification",
    awaitingUpdate:
      "This page updates automatically.",
    verificationPaused:
      "Refresh to check your payment.",
    unavailable:
      "Invalid payment information.",
  },

  de: {
    title: "Status Ihrer Spende",
    loading:
      "Wird geprüft…",
    pendingTitle:
      "Zahlung ausstehend",
    pendingDescription:
      "Zahlung abschließen, um die Spende zu bestätigen.",
    processingTitle:
      "Überprüfung läuft",
    processingDescription:
      "Ihre Zahlung wird bestätigt.",
    confirmedTitle:
      "Spende bestätigt",
    confirmedDescription:
      "Vielen Dank für Ihre Unterstützung!",
    failedTitle:
      "Zahlung fehlgeschlagen",
    failedDescription:
      "Die Zahlung war nicht erfolgreich.",
    cancelledTitle:
      "Zahlung abgebrochen",
    cancelledDescription:
      "Die Zahlung wurde abgebrochen.",
    expiredTitle:
      "Zahlung abgelaufen",
    expiredDescription:
      "Die Zahlungsfrist ist abgelaufen.",
    errorTitle:
      "Status nicht verfügbar",
    errorDescription:
      "Bitte gleich erneut versuchen.",
    retry: "Erneut versuchen",
    refresh: "Aktualisieren",
    checking: "Wird geprüft...",
    donationAmount:
      "Spendenbetrag",
    reference: "Referenz",
    date: "Bestätigungsdatum",
    secure: "Sichere Überprüfung",
    awaitingUpdate:
      "Diese Seite wird automatisch aktualisiert.",
    verificationPaused:
      "Aktualisieren, um die Zahlung zu prüfen.",
    unavailable:
      "Ungültige Zahlungsinformationen.",
  },

  es: {
    title: "Estado de su donación",
    loading:
      "Verificando…",
    pendingTitle:
      "Pago pendiente",
    pendingDescription:
      "Complete el pago para confirmar su donación.",
    processingTitle:
      "Verificación en curso",
    processingDescription:
      "Confirmando su pago.",
    confirmedTitle:
      "Donación confirmada",
    confirmedDescription:
      "¡Gracias por su apoyo!",
    failedTitle:
      "Pago fallido",
    failedDescription:
      "El pago no se completó.",
    cancelledTitle:
      "Pago cancelado",
    cancelledDescription:
      "El pago fue cancelado.",
    expiredTitle:
      "Pago caducado",
    expiredDescription:
      "El plazo de pago ha terminado.",
    errorTitle:
      "Estado no disponible",
    errorDescription:
      "Reintente en un momento.",
    retry: "Reintentar",
    refresh: "Actualizar",
    checking: "Verificando...",
    donationAmount:
      "Importe de la donación",
    reference: "Referencia",
    date: "Fecha de confirmación",
    secure: "Verificación segura",
    awaitingUpdate:
      "Esta página se actualiza automáticamente.",
    verificationPaused:
      "Actualice para verificar su pago.",
    unavailable:
      "Información de pago no válida.",
  },
};

// ==========================================================
// 4. VALIDATION DES RÉPONSES API
// ==========================================================

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function parsePaymentResponse(
  payload: unknown
): PaymentApiResponse {
  if (!isRecord(payload)) {
    throw new Error("INVALID_RESPONSE");
  }

  if (payload.success === false) {
    if (
      !isRecord(payload.error) ||
      typeof payload.error.code !== "string" ||
      typeof payload.error.message !== "string"
    ) {
      throw new Error("INVALID_RESPONSE");
    }

    return {
      success: false,
      error: {
        code: payload.error.code,
        message: payload.error.message,
        retryable:
          payload.error.retryable === true,
      },
    };
  }

  if (payload.success !== true) {
    throw new Error("INVALID_RESPONSE");
  }

  if (
    typeof payload.donationId !== "string" ||
    !UUID_REGEX.test(payload.donationId) ||
    typeof payload.transactionId !== "string" ||
    !UUID_REGEX.test(payload.transactionId) ||
    !isPaymentStatus(payload.status) ||
    typeof payload.amount !== "number" ||
    !Number.isSafeInteger(payload.amount) ||
    payload.amount <= 0 ||
    typeof payload.currency !== "string" ||
    typeof payload.paymentMethod !== "string" ||
    !(
      payload.confirmedAt === null ||
      (
        typeof payload.confirmedAt === "string" &&
        Number.isFinite(
          Date.parse(payload.confirmedAt)
        )
      )
    )
  ) {
    throw new Error("INVALID_RESPONSE");
  }

  return {
    success: true,
    donationId: payload.donationId,
    transactionId: payload.transactionId,
    status: payload.status,
    amount: payload.amount,
    currency: payload.currency,
    paymentMethod: payload.paymentMethod,
    confirmedAt: payload.confirmedAt,
  };
}

// ==========================================================
// 5. AFFICHAGE DES MONTANTS ET DATES
// ==========================================================

function getLocale(
  language: PaymentLanguage
): string {
  switch (language) {
    case "en":
      return "en-US";

    case "de":
      return "de-DE";

    case "es":
      return "es-ES";

    default:
      return "fr-FR";
  }
}

function formatMoney(
  amount: number,
  currency: string,
  language: PaymentLanguage
): string {
  const cfa = formatCfaAmount(amount, currency, getLocale(language));
  if (cfa !== null) return cfa;
  try {
    return new Intl.NumberFormat(
      getLocale(language),
      {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }
    ).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

function formatDate(
  value: string,
  language: PaymentLanguage
): string {
  return new Intl.DateTimeFormat(
    getLocale(language),
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(new Date(value));
}

// ==========================================================
// 6. INFORMATIONS VISUELLES
// ==========================================================

function getStatusPresentation(
  status: PaymentStatus,
  t: Translation
) {
  switch (status) {
    case "CONFIRMED":
      return {
        title: t.confirmedTitle,
        description:
          t.confirmedDescription,
        icon: CheckCircle2,
        iconClass:
          "text-emerald-600",
        backgroundClass:
          "bg-emerald-50",
        borderClass:
          "border-emerald-200",
      };

    case "FAILED":
      return {
        title: t.failedTitle,
        description:
          t.failedDescription,
        icon: XCircle,
        iconClass: "text-red-600",
        backgroundClass: "bg-red-50",
        borderClass: "border-red-200",
      };

    case "CANCELLED":
      return {
        title: t.cancelledTitle,
        description:
          t.cancelledDescription,
        icon: XCircle,
        iconClass: "text-slate-600",
        backgroundClass:
          "bg-slate-50",
        borderClass:
          "border-slate-200",
      };

    case "EXPIRED":
      return {
        title: t.expiredTitle,
        description:
          t.expiredDescription,
        icon: Clock3,
        iconClass:
          "text-amber-600",
        backgroundClass:
          "bg-amber-50",
        borderClass:
          "border-amber-200",
      };

    case "PROCESSING":
      return {
        title:
          t.processingTitle,
        description:
          t.processingDescription,
        icon: LoaderCircle,
        iconClass:
          "text-blue-600",
        backgroundClass:
          "bg-blue-50",
        borderClass:
          "border-blue-200",
      };

    case "PENDING":
    default:
      return {
        title: t.pendingTitle,
        description:
          t.pendingDescription,
        icon: Clock3,
        iconClass:
          "text-amber-600",
        backgroundClass:
          "bg-amber-50",
        borderClass:
          "border-amber-200",
      };
  }
}

// ==========================================================
// 7. COMPOSANT PRINCIPAL
// ==========================================================

function PaymentStatusSession({
  dialogDismissed = false,
  providerTransactionId,
  verifyOnRefresh = false,
  transactionId,
  accessToken,
  language = DEFAULT_PAYMENT_LANGUAGE,
  className = "",
  autoRefresh = true,
  refreshIntervalMs = DEFAULT_REFRESH_INTERVAL,
  maxAutoRefreshMs = DEFAULT_MAX_REFRESH_DURATION,
  onConfirmed,
  onFailed,
}: PaymentStatusProps) {
  const currentLanguage =
    isPaymentLanguage(language)
      ? language
      : DEFAULT_PAYMENT_LANGUAGE;

  const t = TRANSLATIONS[currentLanguage];

  const validIdentifiers =
    UUID_REGEX.test(transactionId) &&
    ACCESS_TOKEN_REGEX.test(accessToken);

  const [payment, setPayment] =
    useState<PaymentData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [paused, setPaused] =
    useState(false);

  const [requestKey, setRequestKey] =
    useState(0);

  const requestInProgressRef =
    useRef(false);

  const consecutiveErrorsRef =
    useRef(0);

  const confirmedNotifiedRef =
    useRef(false);

  const failedNotifiedRef =
    useRef(false);

  const callbacksRef = useRef({
    onConfirmed,
    onFailed,
  });

  useEffect(() => {
    callbacksRef.current = {
      onConfirmed,
      onFailed,
    };
  }, [onConfirmed, onFailed]);

  // --------------------------------------------------------
  // A. Réinitialisation lors d'un changement de paiement
  // --------------------------------------------------------



  // --------------------------------------------------------
  // B. Lecture serveur du statut
  // --------------------------------------------------------

  const fetchStatus = useCallback(
    async (
      signal?: AbortSignal
    ): Promise<PaymentData | null> => {
      if (!validIdentifiers) {
        throw new Error(
          "INVALID_IDENTIFIERS"
        );
      }

      const response = await fetch(
        `/api/payments/status?transactionId=${encodeURIComponent(
          transactionId
        )}`,
        {
          method: providerTransactionId || verifyOnRefresh ? "POST" : "GET",
          body: providerTransactionId || verifyOnRefresh ? JSON.stringify({ transactionId, providerTransactionId }) : undefined,
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "x-payment-access-token":
              accessToken,
          },
          signal,
        }
      );

      const raw: unknown =
        await response.json();

      const parsed =
        parsePaymentResponse(raw);

      if (!response.ok || !parsed.success) {
        if (!parsed.success) {
          throw new Error(
            parsed.error.code
          );
        }

        throw new Error(
          "PAYMENT_STATUS_HTTP_ERROR"
        );
      }

      if (
        parsed.transactionId !==
        transactionId
      ) {
        throw new Error(
          "TRANSACTION_MISMATCH"
        );
      }

      return {
        donationId:
          parsed.donationId,
        transactionId:
          parsed.transactionId,
        status:
          parsed.status,
        amount:
          parsed.amount,
        currency:
          parsed.currency,
        paymentMethod:
          parsed.paymentMethod,
        confirmedAt:
          parsed.confirmedAt,
      };
    },
    [
      transactionId,
      accessToken,
      validIdentifiers,
      providerTransactionId,
      verifyOnRefresh,
    ]
  );

  // --------------------------------------------------------
  // C. Actualisation automatique
  // --------------------------------------------------------

  useEffect(() => {
    if (!validIdentifiers) {
      return;
    }

    const controller =
      new AbortController();

    let active = true;
    let timer:
      | ReturnType<typeof setTimeout>
      | null = null;

    const startedAt = Date.now();

    const interval = Math.max(
      2000,
      Math.min(
        30000,
        refreshIntervalMs
      )
    );

    const maximumDuration = Math.max(
      0,
      maxAutoRefreshMs
    );

    async function checkStatus(
      isFirst: boolean
    ) {
      if (
        !active ||
        requestInProgressRef.current
      ) {
        return;
      }

      requestInProgressRef.current = true;

      if (isFirst) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const result =
          await fetchStatus(
            controller.signal
          );

        if (!active || !result) {
          return;
        }

        consecutiveErrorsRef.current = 0;

        setPayment(result);
        setError(null);

        // Confirmation officielle enregistrée
        if (
          result.status === "CONFIRMED" &&
          !confirmedNotifiedRef.current
        ) {
          confirmedNotifiedRef.current = true;

          callbacksRef.current.onConfirmed?.(
            result.donationId,
            result.transactionId
          );
        }

        // Paiement échoué ou annulé
        if (
          (
            result.status === "FAILED" ||
            result.status === "CANCELLED" ||
            result.status === "EXPIRED"
          ) &&
          !failedNotifiedRef.current
        ) {
          failedNotifiedRef.current = true;

          callbacksRef.current.onFailed?.(
            result.donationId,
            result.transactionId
          );
        }

        if (
          FINAL_STATUSES.has(
            result.status
          )
        ) {
          setPaused(false);
          return;
        }

        if (
          autoRefresh &&
          Date.now() - startedAt <
            maximumDuration
        ) {
          timer = setTimeout(
            () => {
              void checkStatus(false);
            },
            interval
          );
        } else {
          setPaused(true);
        }
      } catch (caughtError) {
        if (
          !active ||
          controller.signal.aborted
        ) {
          return;
        }

        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "UNKNOWN_ERROR";

        console.error(
          "[PaymentStatus] Status check failed:",
          message
        );

        consecutiveErrorsRef.current += 1;

        setError(
          t.errorDescription
        );

        if (
          autoRefresh &&
          consecutiveErrorsRef.current <
            MAX_CONSECUTIVE_ERRORS &&
          Date.now() - startedAt <
            maximumDuration
        ) {
          timer = setTimeout(
            () => {
              void checkStatus(false);
            },
            interval
          );
        } else {
          setPaused(true);
        }
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
          requestInProgressRef.current = false;
        }
      }
    }

    const startTimer = setTimeout(() => { void checkStatus(true); }, 0);

    return () => {
      active = false;
      clearTimeout(startTimer);
      requestInProgressRef.current = false;

      controller.abort();

      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [
    transactionId,
    accessToken,
    validIdentifiers,
    autoRefresh,
    refreshIntervalMs,
    maxAutoRefreshMs,
    requestKey,
    fetchStatus,
    t.errorDescription,
    t.unavailable,
  ]);

  // --------------------------------------------------------
  // D. Actualisation manuelle
  // --------------------------------------------------------

  const handleRefresh = useCallback(() => {
    if (refreshing || loading) {
      return;
    }

    setPaused(false);
    setError(null);
    setRequestKey(
      (previous) => previous + 1
    );
  }, [refreshing, loading]);

  // ========================================================
  // 8. AFFICHAGE
  // ========================================================

  const serverPresentation = payment
    ? getStatusPresentation(
        payment.status,
        t
      )
    : null;

  const closedText = {
    fr: { title: "Fenêtre de paiement fermée", description: "Paiement non confirmé. Vous pouvez le reprendre." },
    en: { title: "Payment window closed", description: "Payment unconfirmed. You can resume it." },
    de: { title: "Zahlungsfenster geschlossen", description: "Zahlung nicht bestätigt. Sie können fortfahren." },
    es: { title: "Ventana de pago cerrada", description: "Pago sin confirmar. Puede reanudarlo." },
  }[currentLanguage];
  // A dismissed dialog is not a financial cancellation. The verified server
  // status always wins once processing or a final state has been reported.
  const presentation = serverPresentation && dialogDismissed && payment?.status === "PENDING"
    ? { ...serverPresentation, ...closedText, icon: XCircle,
        iconClass: "text-slate-500", backgroundClass: "bg-slate-50", borderClass: "border-slate-200" }
    : serverPresentation;

  const StatusIcon =
    presentation?.icon;

  const isFinal =
    payment
      ? FINAL_STATUSES.has(
          payment.status
        )
      : false;

  return (
    <section
      className={[
        "w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={t.title}
    >
      {/* En-tête */}

      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <Heart
            className="h-5 w-5"
            aria-hidden="true"
          />
        </div>

        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
          {t.title}
        </h2>
      </div>

      {/* Chargement initial */}

      {validIdentifiers && loading && !payment && (
        <div
          role="status"
          className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl bg-slate-50 p-6"
        >
          <LoaderCircle
            className="h-8 w-8 animate-spin text-emerald-600"
            aria-hidden="true"
          />

          <p className="text-sm text-slate-600">
            {t.loading}
          </p>
        </div>
      )}

      {/* Statut du paiement */}

      {payment &&
        presentation &&
        StatusIcon && (
          <div
            role="status"
            aria-live="polite"
            className={[
              "rounded-xl border p-5 text-center sm:p-7",
              presentation.backgroundClass,
              presentation.borderClass,
            ].join(" ")}
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
              <StatusIcon
                className={[
                  "h-9 w-9",
                  presentation.iconClass,
                  payment.status ===
                  "PROCESSING"
                    ? "animate-spin"
                    : "",
                ].join(" ")}
                aria-hidden="true"
              />
            </div>

            <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
              {presentation.title}
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {presentation.description}
            </p>
          </div>
        )}

      {/* Détails de la transaction */}

      {payment && (
        <dl className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 px-4">
          <div className="flex items-center justify-between gap-4 py-4">
            <dt className="text-sm text-slate-500">
              {t.donationAmount}
            </dt>

            <dd className="text-right text-base font-bold text-slate-900">
              {formatMoney(
                payment.amount,
                payment.currency,
                currentLanguage
              )}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-4 py-4">
            <dt className="text-sm text-slate-500">
              {t.reference}
            </dt>

            <dd className="break-all text-right font-mono text-xs text-slate-700">
              {payment.transactionId}
            </dd>
          </div>

          {payment.status ===
            "CONFIRMED" &&
            payment.confirmedAt && (
              <div className="flex items-center justify-between gap-4 py-4">
                <dt className="text-sm text-slate-500">
                  {t.date}
                </dt>

                <dd className="text-right text-sm font-medium text-slate-900">
                  {formatDate(
                    payment.confirmedAt,
                    currentLanguage
                  )}
                </dd>
              </div>
            )}
        </dl>
      )}

      {/* Erreur de consultation */}

      {(error || !validIdentifiers) && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
        >
          <AlertCircle
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
            aria-hidden="true"
          />

          <div>
            <p className="text-sm font-semibold text-slate-900">
              {t.errorTitle}
            </p>

            <p className="mt-1 text-sm text-slate-600">
              {error || t.unavailable}
            </p>
          </div>
        </div>
      )}

      {/* Informations d'actualisation */}

      {payment &&
        !isFinal &&
        !error && (
          <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
            {refreshing ? (
              <LoaderCircle
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Clock3
                className="h-4 w-4"
                aria-hidden="true"
              />
            )}

            <span>
              {paused
                ? t.verificationPaused
                : t.awaitingUpdate}
            </span>
          </div>
        )}

      {/* Bouton de vérification manuelle */}

      {validIdentifiers &&
        !isFinal &&
        !loading && (
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing ? (
              <>
                <LoaderCircle
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />

                {t.checking}
              </>
            ) : (
              <>
                <RefreshCw
                  className="h-4 w-4"
                  aria-hidden="true"
                />

                {error
                  ? t.retry
                  : t.refresh}
              </>
            )}
          </button>
        )}

      {/* Sécurité */}

      <div className="mt-6 flex items-center justify-center gap-2 border-t border-slate-100 pt-5 text-xs text-slate-500">
        <ShieldCheck
          className="h-4 w-4"
          aria-hidden="true"
        />

        <span>{t.secure}</span>
      </div>
    </section>
  );
}

export default function PaymentStatus(props: PaymentStatusProps) {
  return <PaymentStatusSession key={`${props.transactionId}:${props.accessToken}`} {...props} />;
}
export { PaymentStatus };
