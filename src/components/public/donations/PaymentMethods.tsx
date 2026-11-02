"use client";

import { currencyUnit } from "@/lib/campaigns/currencies";

/**
 * FONDATION SAUVONS DES VIES
 * ======================================================
 * src/components/public/donations/PaymentMethods.tsx
 *
 * Sélection publique des moyens de paiement.
 *
 * - Mobile Money
 * - Carte bancaire
 * - Wave (uniquement si activé)
 *
 * Disponibilité chargée depuis l'API serveur.
 * Aucun prestataire exposé au donateur.
 * Aucune clé API dans le composant.
 *
 * Compatible Next.js / React / TypeScript.
 * ======================================================
 */

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import {
  Check,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import {
  DEFAULT_PAYMENT_CURRENCY,
  DEFAULT_PAYMENT_LANGUAGE,
  PAYMENT_METHODS,
  isPaymentLanguage,
  isPaymentMethod,
  type PaymentLanguage,
  type PaymentMethod,
  type PublicPaymentMethod,
} from "@/lib/payments/types";
import PaymentBrand from "./PaymentBrand";

// ======================================================
// 1. PROPRIÉTÉS
// ======================================================

export interface PaymentMethodsProps {
  heading?: string;
  value: PaymentMethod | null;

  onChange: (
    method: PaymentMethod | null
  ) => void;

  language?: PaymentLanguage;

  disabled?: boolean;

  className?: string;

  onLoadingChange?: (
    loading: boolean
  ) => void;

  onAvailabilityChange?: (
    methods: PublicPaymentMethod[]
  ) => void;
}

// ======================================================
// 2. TRADUCTIONS
// ======================================================

type Translation = {
  title: string;
  subtitle: string;
  mobileMoney: string;
  mobileMoneyDescription: string;
  card: string;
  cardDescription: string;
  wave: string;
  waveDescription: string;
  secure: string;
  loading: string;
  unavailable: string;
  error: string;
  retry: string;
  selected: string;
  currency: string;
};

const TRANSLATIONS: Record<
  PaymentLanguage,
  Translation
> = {
  fr: {
    title: "Moyen de paiement",
    subtitle:
      "Choisissez comment effectuer votre don.",
    mobileMoney: "Mobile Money",
    mobileMoneyDescription:
      "Payez avec votre portefeuille mobile.",
    card: "Carte bancaire",
    cardDescription:
      "Payez avec votre carte bancaire.",
    wave: "Wave",
    waveDescription:
      "Effectuez votre don avec Wave.",
    secure: "Paiement sécurisé",
    loading:
      "Chargement des moyens de paiement...",
    unavailable:
      "Aucun moyen de paiement n'est disponible actuellement.",
    error:
      "Impossible de charger les moyens de paiement.",
    retry: "Réessayer",
    selected: "Sélectionné",
    currency: "Devise",
  },

  en: {
    title: "Payment method",
    subtitle:
      "Choose how you would like to donate.",
    mobileMoney: "Mobile Money",
    mobileMoneyDescription:
      "Pay using your mobile wallet.",
    card: "Bank card",
    cardDescription:
      "Pay securely using your bank card.",
    wave: "Wave",
    waveDescription:
      "Make your donation with Wave.",
    secure: "Secure payment",
    loading:
      "Loading payment methods...",
    unavailable:
      "No payment methods are currently available.",
    error:
      "Unable to load payment methods.",
    retry: "Try again",
    selected: "Selected",
    currency: "Currency",
  },

  de: {
    title: "Zahlungsmethode",
    subtitle:
      "Wählen Sie aus, wie Sie spenden möchten.",
    mobileMoney: "Mobile Money",
    mobileMoneyDescription:
      "Bezahlen Sie mit Ihrer mobilen Geldbörse.",
    card: "Bankkarte",
    cardDescription:
      "Bezahlen Sie sicher mit Ihrer Bankkarte.",
    wave: "Wave",
    waveDescription:
      "Spenden Sie mit Wave.",
    secure: "Sichere Zahlung",
    loading:
      "Zahlungsmethoden werden geladen...",
    unavailable:
      "Derzeit sind keine Zahlungsmethoden verfügbar.",
    error:
      "Zahlungsmethoden konnten nicht geladen werden.",
    retry: "Erneut versuchen",
    selected: "Ausgewählt",
    currency: "Währung",
  },

  es: {
    title: "Método de pago",
    subtitle:
      "Elija cómo desea realizar su donación.",
    mobileMoney: "Mobile Money",
    mobileMoneyDescription:
      "Pague con su billetera móvil.",
    card: "Tarjeta bancaria",
    cardDescription:
      "Pague de forma segura con su tarjeta.",
    wave: "Wave",
    waveDescription:
      "Realice su donación con Wave.",
    secure: "Pago seguro",
    loading:
      "Cargando métodos de pago...",
    unavailable:
      "No hay métodos de pago disponibles actualmente.",
    error:
      "No se pudieron cargar los métodos de pago.",
    retry: "Reintentar",
    selected: "Seleccionado",
    currency: "Moneda",
  },
};

// ======================================================
// 3. ICÔNES
// ======================================================

// ======================================================
// 4. LIBELLÉS
// ======================================================

function getMethodLabel(
  method: PaymentMethod,
  t: Translation
): string {
  switch (method) {
    case PAYMENT_METHODS.MOBILE_MONEY:
      return t.mobileMoney;

    case PAYMENT_METHODS.CARD:
      return t.card;

    case PAYMENT_METHODS.WAVE:
      return t.wave;
  }
}

function getMethodDescription(
  method: PaymentMethod,
  t: Translation
): string {
  switch (method) {
    case PAYMENT_METHODS.MOBILE_MONEY:
      return t.mobileMoneyDescription;

    case PAYMENT_METHODS.CARD:
      return t.cardDescription;

    case PAYMENT_METHODS.WAVE:
      return t.waveDescription;
  }
}

// ======================================================
// 5. CONTRÔLE DES DONNÉES API
// ======================================================

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function parseAvailableMethods(
  payload: unknown
): {
  methods: PublicPaymentMethod[];
  currency: string;
} {
  if (!isRecord(payload)) {
    throw new Error("INVALID_RESPONSE");
  }

  if (
    payload.success !== true ||
    !Array.isArray(payload.methods) ||
    typeof payload.currency !== "string"
  ) {
    throw new Error("INVALID_RESPONSE");
  }

  const currency = payload.currency
    .trim()
    .toUpperCase();

  if (
    currency !== DEFAULT_PAYMENT_CURRENCY
  ) {
    throw new Error("UNSUPPORTED_CURRENCY");
  }

  const methods: PublicPaymentMethod[] = [];
  const seen = new Set<PaymentMethod>();

  for (const item of payload.methods) {
    if (!isRecord(item)) {
      throw new Error("INVALID_PAYMENT_METHOD");
    }

    if (!isPaymentMethod(item.id)) {
      throw new Error("INVALID_PAYMENT_METHOD");
    }

    if (
      typeof item.enabled !== "boolean" ||
      typeof item.requiresPhone !== "boolean" ||
      typeof item.requiresEmail !== "boolean"
    ) {
      throw new Error("INVALID_PAYMENT_METHOD");
    }

    if (
      typeof item.label !== "string" ||
      (item.description !== undefined &&
        typeof item.description !== "string")
    ) {
      throw new Error("INVALID_PAYMENT_METHOD");
    }

    if (!item.enabled || seen.has(item.id)) {
      continue;
    }

    seen.add(item.id);

    methods.push({
      id: item.id,
      label: item.label,
      description: item.description as
        | string
        | undefined,
      enabled: true,
      requiresPhone: item.requiresPhone,
      requiresEmail: item.requiresEmail,
    });
  }

  return {
    methods,
    currency,
  };
}

// ======================================================
// 6. COMPOSANT PRINCIPAL
// ======================================================

export default function PaymentMethods({
  heading,
  value,
  onChange,
  language = DEFAULT_PAYMENT_LANGUAGE,
  disabled = false,
  className = "",
  onLoadingChange,
  onAvailabilityChange,
}: PaymentMethodsProps) {
  const groupId = useId();

  const currentLanguage =
    isPaymentLanguage(language)
      ? language
      : DEFAULT_PAYMENT_LANGUAGE;

  const t = TRANSLATIONS[currentLanguage];

  const [methods, setMethods] = useState<
    PublicPaymentMethod[]
  >([]);

  const [currency, setCurrency] = useState<string>(
  DEFAULT_PAYMENT_CURRENCY
);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(false);

  const [reloadKey, setReloadKey] =
    useState(0);

  const requestController = useRef<
    AbortController | null
  >(null);

  const onChangeRef = useRef(onChange);
  const onLoadingChangeRef =
    useRef(onLoadingChange);
  const onAvailabilityChangeRef =
    useRef(onAvailabilityChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onLoadingChangeRef.current =
      onLoadingChange;
  }, [onLoadingChange]);

  useEffect(() => {
    onAvailabilityChangeRef.current =
      onAvailabilityChange;
  }, [onAvailabilityChange]);

  // ----------------------------------------------------
  // A. Chargement des moyens de paiement
  // ----------------------------------------------------

  useEffect(() => {
    const controller = new AbortController();

    requestController.current = controller;


    onLoadingChangeRef.current?.(true);

    let active = true;

    async function loadMethods() {
      try {
        const response = await fetch(
          `/api/payments/methods?lang=${encodeURIComponent(
            currentLanguage
          )}`,
          {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            `PAYMENT_METHODS_HTTP_${response.status}`
          );
        }

        const payload: unknown =
          await response.json();

        const parsed =
          parseAvailableMethods(payload);

        if (!active) {
          return;
        }

        setMethods(parsed.methods);
        setCurrency(parsed.currency);

        onAvailabilityChangeRef.current?.(
          parsed.methods
        );
      } catch {
        if (
          !active ||
          controller.signal.aborted
        ) {
          return;
        }

        setMethods([]);
        setError(true);

        onAvailabilityChangeRef.current?.(
          []
        );
      } finally {
        if (active) {
          setLoading(false);
          onLoadingChangeRef.current?.(
            false
          );
        }
      }
    }

    const startTimer = setTimeout(() => {
      setLoading(true);
      setError(false);
      setMethods([]);
      void loadMethods();
    }, 0);

    return () => {
      active = false;
      clearTimeout(startTimer);
      controller.abort();

      if (
        requestController.current ===
        controller
      ) {
        requestController.current = null;
      }
    };
  }, [currentLanguage, reloadKey]);

  // ----------------------------------------------------
  // B. Désélection si méthode indisponible
  // ----------------------------------------------------

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!value) {
      return;
    }

    const stillAvailable = methods.some(
      (method) => method.id === value
    );

    if (!stillAvailable) {
      onChangeRef.current(null);
    }
  }, [loading, methods, value]);

  // ----------------------------------------------------
  // C. Sélection
  // ----------------------------------------------------

  const handleSelect = useCallback(
    (method: PaymentMethod) => {
      if (disabled || loading || error) {
        return;
      }

      const available = methods.some(
        (item) => item.id === method
      );

      if (!available) {
        return;
      }

      onChange(method);
    },
    [
      disabled,
      loading,
      error,
      methods,
      onChange,
    ]
  );

  // ----------------------------------------------------
  // D. Rechargement
  // ----------------------------------------------------

  const handleRetry = useCallback(() => {
    if (disabled) {
      return;
    }

    setReloadKey((current) => current + 1);
  }, [disabled]);

  // ====================================================
  // 7. RENDU
  // ====================================================

  return (
    <section
      className={[
        "w-full",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-labelledby={`${groupId}-title`}
    >
      {/* En-tête */}

      <div className="mb-3">
        <h3
          id={`${groupId}-title`}
          className="text-base font-bold text-[#092B50]"
        >
          {heading || t.title}
        </h3>

      </div>

      {/* Chargement */}

      {loading && (
        <div
          role="status"
          aria-live="polite"
          className="flex min-h-28 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6"
        >
          <LoaderCircle
            className="h-5 w-5 animate-spin text-slate-600"
            aria-hidden="true"
          />

          <span className="text-sm text-slate-600">
            {t.loading}
          </span>
        </div>
      )}

      {/* Erreur */}

      {!loading && error && (
        <div
          role="alert"
          className="rounded-xl border border-slate-200 bg-slate-50 p-5"
        >
          <p className="text-sm text-slate-700">
            {t.error}
          </p>

          <button
            type="button"
            onClick={handleRetry}
            disabled={disabled}
            className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className="h-4 w-4"
              aria-hidden="true"
            />

            {t.retry}
          </button>
        </div>
      )}

      {/* Aucune méthode */}

      {!loading &&
        !error &&
        methods.length === 0 && (
          <div
            role="status"
            className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-6 text-center"
          >
            <p className="text-sm text-slate-600">
              {t.unavailable}
            </p>
          </div>
        )}

      {/* Méthodes disponibles */}

      {!loading &&
        !error &&
        methods.length > 0 && (
          <div
            role="radiogroup"
            aria-labelledby={`${groupId}-title`}
            aria-disabled={disabled}
            className="grid grid-cols-2 gap-3"
          >
            {methods.map((method) => {
              const selected =
                value === method.id;

              return (
                <label
                  key={method.id}
                  className={[
                    "relative flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 bg-white px-2 py-4 text-center transition-colors",
                    "focus-within:ring-2 focus-within:ring-slate-400 focus-within:ring-offset-2",
                    selected
                      ? "border-[#E71E3D] bg-rose-50/30"
                      : "border-slate-200 hover:border-slate-300",
                    disabled
                      ? "cursor-not-allowed opacity-60"
                      : "",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name={`${groupId}-payment-method`}
                    value={method.id}
                    checked={selected}
                    disabled={disabled}
                    onChange={() =>
                      handleSelect(method.id)
                    }
                    className="sr-only"
                    aria-label={getMethodLabel(
                      method.id,
                      t
                    )}
                  />

                  <span
                    className={[
                      "flex items-center justify-center",
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    <PaymentBrand
                      method={method.id}
                    />
                  </span>

                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-900">
                      {getMethodLabel(
                        method.id,
                        t
                      )}
                    </span>

                    <span className="sr-only">
                      {getMethodDescription(
                        method.id,
                        t
                      )}
                    </span>
                  </span>

                  <span
                    className={[
                      "absolute right-2 top-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                      selected
                        ? "border-[#E71E3D] bg-[#E71E3D] text-white"
                        : "border-slate-300 bg-white",
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    {selected && (
                      <Check
                        size={13}
                        strokeWidth={3}
                      />
                    )}
                  </span>

                  {selected && (
                    <span className="sr-only">
                      {t.selected}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        )}

      {/* Informations de sécurité */}

      {!loading &&
        !error &&
        methods.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div className="inline-flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck
                className="h-4 w-4"
                aria-hidden="true"
              />

              <span>{t.secure}</span>
            </div>

            <span className="text-xs font-medium text-slate-500">
              {t.currency} : {currencyUnit(currency)}
            </span>
          </div>
        )}
    </section>
  );
}

export {
  PaymentMethods,
};
