
"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  Heart,
  LoaderCircle,
} from "lucide-react";

import type {
  CreatePaymentResponse,
  PaymentLanguage,
  PaymentMethod,
  PublicPaymentMethod,
} from "@/lib/payments/types";

import PaymentMethods from "./PaymentMethods";
import PaymentStatus from "./PaymentStatus";
import { notifyCampaignUpdate } from "@/lib/campaigns/live-updates";
import { openFedaPayCheckout } from "./fedapay-checkout";

export interface PaymentFormProps {
  campaignId: string;
  language?: PaymentLanguage;
  className?: string;
  defaultAmount?: number;
  suggestedAmounts?: number[];
  onPaymentCreated?: (
    donationId: string,
    transactionId: string
  ) => void;
  onPaymentConfirmed?: (
    donationId: string,
    transactionId: string
  ) => void;
}

export const DONATION_AMOUNTS = [
  1000, 2500, 5000, 10000, 25000, 50000,
];

type Checkout = {
  verifyOnRefresh?: boolean;
  donationId: string;
  transactionId: string;
  accessToken: string;
  providerTransactionId?: string;
};

const COUNTRIES = [
  { iso: "BJ", dial: "+229", name: "Bénin" },
  { iso: "TG", dial: "+228", name: "Togo" },
  { iso: "CI", dial: "+225", name: "Côte d'Ivoire" },
  { iso: "SN", dial: "+221", name: "Sénégal" },
  { iso: "BF", dial: "+226", name: "Burkina Faso" },
  { iso: "ML", dial: "+223", name: "Mali" },
  { iso: "NE", dial: "+227", name: "Niger" },
  { iso: "GH", dial: "+233", name: "Ghana" },
  { iso: "NG", dial: "+234", name: "Nigeria" },
  { iso: "CM", dial: "+237", name: "Cameroun" },
  { iso: "GA", dial: "+241", name: "Gabon" },
  { iso: "CG", dial: "+242", name: "Congo" },
  { iso: "CD", dial: "+243", name: "RD Congo" },
  { iso: "FR", dial: "+33", name: "France" },
  { iso: "DE", dial: "+49", name: "Allemagne" },
  { iso: "AT", dial: "+43", name: "Autriche" },
  { iso: "IT", dial: "+39", name: "Italie" },
  { iso: "ES", dial: "+34", name: "Espagne" },
  { iso: "BE", dial: "+32", name: "Belgique" },
  { iso: "CH", dial: "+41", name: "Suisse" },
  { iso: "GB", dial: "+44", name: "Royaume-Uni" },
  { iso: "US", dial: "+1", name: "États-Unis" },
  { iso: "CA", dial: "+1", name: "Canada" },
] as const;

type CountryCode = (typeof COUNTRIES)[number]["iso"];

const TEXT = {
  fr: {
    title: "Faire un don",
    amount: "1. Montant",
    other: "Autre montant (FCFA)",
    contact: "2. Vos coordonnées",
    email: "Adresse e-mail",
    phone: "Numéro de téléphone",
    country: "Indicatif téléphonique",
    phonePlaceholder: "Votre numéro",
    method: "3. Paiement",
    pay: "Continuer vers le paiement",
    wait: "Préparation du paiement…",
    secure:
      "Votre don sera confirmé après vérification sécurisée du paiement.",
    error:
      "Paiement indisponible. Réessayez avec les mêmes informations.",
    invalid:
      "Vérifiez le montant, l’e-mail et le téléphone.",
    subtotal: "Montant du don",
    total: "Total",
    duplicate:
      "Paiement déjà lancé. Vérifiez son statut avant de réessayer.",
    unavailable:
      "Ce moyen de paiement est indisponible.",
    campaign:
      "Cette collecte est indisponible.",
  },
  en: {
    title: "Make a donation",
    amount: "1. Amount",
    other: "Other amount (FCFA)",
    contact: "2. Contact details",
    email: "Email address",
    phone: "Phone number",
    country: "Calling code",
    phonePlaceholder: "Your number",
    method: "3. Payment",
    pay: "Continue to payment",
    wait: "Preparing payment…",
    secure:
      "Your donation is confirmed only after secure payment verification.",
    error:
      "Payment unavailable. Retry with the same details.",
    invalid:
      "Check the amount, email and phone.",
    subtotal: "Donation amount",
    total: "Total",
    duplicate:
      "Payment already started. Check its status before retrying.",
    unavailable:
      "This payment method is unavailable.",
    campaign:
      "This fundraiser is unavailable.",
  },
  de: {
    title: "Spenden",
    amount: "1. Betrag",
    other: "Anderer Betrag (FCFA)",
    contact: "2. Kontaktdaten",
    email: "E-Mail-Adresse",
    phone: "Telefonnummer",
    country: "Ländervorwahl",
    phonePlaceholder: "Ihre Nummer",
    method: "3. Zahlung",
    pay: "Weiter zur Zahlung",
    wait: "Zahlung wird vorbereitet…",
    secure:
      "Ihre Spende wird erst nach sicherer Zahlungsprüfung bestätigt.",
    error:
      "Zahlung nicht verfügbar. Mit denselben Angaben erneut versuchen.",
    invalid:
      "Betrag, E-Mail und Telefonnummer prüfen.",
    subtotal: "Spendenbetrag",
    total: "Gesamt",
    duplicate:
      "Zahlung bereits gestartet. Vor erneutem Versuch Status prüfen.",
    unavailable:
      "Diese Zahlungsmethode ist nicht verfügbar.",
    campaign:
      "Diese Spendenaktion ist nicht verfügbar.",
  },
  es: {
    title: "Hacer una donación",
    amount: "1. Importe",
    other: "Otro importe (FCFA)",
    contact: "2. Datos de contacto",
    email: "Correo electrónico",
    phone: "Número de teléfono",
    country: "Prefijo telefónico",
    phonePlaceholder: "Su número",
    method: "3. Pago",
    pay: "Continuar al pago",
    wait: "Preparando el pago…",
    secure:
      "Su donación se confirma tras verificar el pago de forma segura.",
    error:
      "Pago no disponible. Reintente con los mismos datos.",
    invalid:
      "Revise el importe, correo y teléfono.",
    subtotal: "Importe de la donación",
    total: "Total",
    duplicate:
      "Pago ya iniciado. Consulte su estado antes de reintentar.",
    unavailable:
      "Este método de pago no está disponible.",
    campaign:
      "Esta recaudación no está disponible.",
  },
};

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function getCountry(code: CountryCode) {
  return (
    COUNTRIES.find((item) => item.iso === code) ??
    COUNTRIES[0]
  );
}

function normalizeLocalNumber(
  value: string,
  dial: string
): string {
  let digits = digitsOnly(value);

  const dialDigits = digitsOnly(dial);

  if (value.trim().startsWith("+") &&
      digits.startsWith(dialDigits)) {
    digits = digits.slice(dialDigits.length);
  }

  return digits.slice(0, 15);
}

function makeInternationalPhone(
  dial: string,
  localNumber: string
): string {
  const digits = digitsOnly(localNumber);

  if (!digits) return "";

  // Retire le préfixe national initial lorsqu'il est
  // utilisé comme préfixe de numérotation internationale.
  // Ne retire pas le 0 pour le Bénin (+22901...).
  const national =
    dial === "+229"
      ? digits
      : digits;

  return `${dial}${national}`;
}

function getInitialPhone(value: string): {
  country: CountryCode;
  local: string;
} {
  const match = [...COUNTRIES]
    .sort((a, b) => b.dial.length - a.dial.length)
    .find((item) => value.startsWith(item.dial));

  if (!match) {
    return {
      country: "BJ",
      local: digitsOnly(value),
    };
  }

  return {
    country: match.iso,
    local: digitsOnly(value.slice(match.dial.length)),
  };
}

export default function PaymentForm({
  campaignId,
  language = "fr",
  className = "",
  defaultAmount = 5000,
  suggestedAmounts = DONATION_AMOUNTS,
  onPaymentCreated,
  onPaymentConfirmed,
}: PaymentFormProps) {
  const t = TEXT[language] ?? TEXT.fr;

  const [amount, setAmount] = useState(
    String(defaultAmount)
  );
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] =
    useState<CountryCode>("BJ");
  const [countryManuallySelected, setCountryManuallySelected] =
    useState(false);

  const [method, setMethod] =
    useState<PaymentMethod | null>(null);
  const [methods, setMethods] =
    useState<PublicPaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] =
    useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const [checkout, setCheckout] =
    useState<Checkout | null>(null);
  const [widget, setWidget] =
    useState<import("kkiapay").IData | null>(null);
  const [fedaWidget, setFedaWidget] = useState<{ open: () => void } | null>(null);
  const [fedaPayload, setFedaPayload] = useState<Record<string, unknown> | null>(null);
  const [dialogDismissed, setDialogDismissed] = useState(false);

  const lock = useRef(false);
  const intent = useRef({
    fingerprint: "",
    key: "",
  });
  const active = useRef(true);
  const cleanupWidget = useRef<(() => void) | null>(null);
  const countryTouched = useRef(false);

  const selectedCountry = getCountry(countryCode);

  useEffect(() => {
    active.current = true;

    return () => {
      active.current = false;
      cleanupWidget.current?.();
    };
  }, []);

  // Géolocalisation indicative via les en-têtes
  // de l'hébergeur. Aucun envoi d'IP à un tiers.
  useEffect(() => {
    if (
      countryManuallySelected ||
      countryTouched.current ||
      phone.trim()
    ) {
      return;
    }

    const controller = new AbortController();

    async function detectCountry() {
      try {
        const response = await fetch(
          "/api/public/visitor-country",
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (!response.ok) return;

        const data: unknown = await response.json();

        if (
          typeof data !== "object" ||
          data === null ||
          !("country" in data) ||
          typeof data.country !== "string"
        ) {
          return;
        }

        const country = COUNTRIES.find(
          (item) => item.iso === data.country
        );

        if (
          country &&
          !countryTouched.current &&
          active.current
        ) {
          setCountryCode(country.iso);
        }
      } catch {
        // Le Bénin reste le choix par défaut.
      }
    }

    void detectCountry();

    return () => controller.abort();
  }, [countryManuallySelected, phone]);

  function changeCountry(value: string) {
    const country = COUNTRIES.find(
      (item) => item.iso === value
    );

    if (!country) return;

    countryTouched.current = true;
    setCountryManuallySelected(true);
    setCountryCode(country.iso);
    setError(null);
  }

  function changePhone(value: string) {
    countryTouched.current = true;

    if (value.trim().startsWith("+")) {
      const parsed = getInitialPhone(value);

      if (
        COUNTRIES.some((item) =>
          value.startsWith(item.dial)
        )
      ) {
        setCountryCode(parsed.country);
        setPhone(parsed.local);
        setError(null);
        return;
      }
    }

    setPhone(
      normalizeLocalNumber(
        value,
        selectedCountry.dial
      )
    );
    setError(null);
  }

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (lock.current || checkout) return;

    const value = Number(amount);
    const normalizedEmail =
      email.trim().toLowerCase();
    const normalizedPhone =
      makeInternationalPhone(
        selectedCountry.dial,
        phone
      );

    const validMethod = methods.some(
      (item) =>
        item.id === method &&
        item.enabled
    );

    if (
      !Number.isSafeInteger(value) ||
      value < 100 ||
      value > 10000000 ||
      normalizedEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail
      ) ||
      !/^\+[1-9]\d{6,14}$/.test(
        normalizedPhone
      ) ||
      !validMethod
    ) {
      setError(t.invalid);
      return;
    }

    lock.current = true;
    setBusy(true);
    setError(null);

    const body = {
      campaignId,
      amount: value,
      currency: "XOF",
      paymentMethod: method,
      donor: {
        email: normalizedEmail,
        phone: normalizedPhone,
      },
      language,
    };

    const fingerprint = JSON.stringify(body);

    // Une nouvelle clé uniquement si les données changent.
    if (
      intent.current.fingerprint !== fingerprint
    ) {
      intent.current = {
        fingerprint,
        key: crypto.randomUUID(),
      };
    }

    try {
      const response = await fetch(
        "/api/payments/create",
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...body,
            idempotencyKey: intent.current.key,
          }),
        }
      );

      const result =
        (await response.json()) as CreatePaymentResponse;

      if (!response.ok || !result.success) {
        const code = !result.success
          ? result.error?.code
          : "INTERNAL_ERROR";

        setError(
          code === "DUPLICATE_REQUEST"
            ? t.duplicate
            : code === "CAMPAIGN_UNAVAILABLE"
              ? t.campaign
              : code === "METHOD_UNAVAILABLE" ||
                  code === "PROVIDER_UNAVAILABLE"
                ? t.unavailable
                : t.error
        );
        return;
      }

      if (
        !/^[a-f0-9]{64}$/i.test(
          result.accessToken
        )
      ) {
        throw new Error(
          "PAYMENT_ACCESS_TOKEN_UNAVAILABLE"
        );
      }

      const pending: Checkout = {
        verifyOnRefresh: result.nextAction.type === "WAIT_FOR_CONFIRMATION" ||
          (result.nextAction.type === "SDK" && result.nextAction.provider === "FEDAPAY"),
        donationId: result.donationId,
        transactionId: result.transactionId,
        accessToken: result.accessToken,
      };

      // Le jeton reste dans cette session navigateur.
      try {
        sessionStorage.setItem(
          `payment:${result.transactionId}`,
          JSON.stringify(pending)
        );
      } catch {
        // Le navigateur peut bloquer sessionStorage.
      }

      setCheckout(pending);

      onPaymentCreated?.(
        result.donationId,
        result.transactionId
      );

      if (
        result.nextAction.type === "REDIRECT"
      ) {
        const url = new URL(
          result.nextAction.url
        );

        const hostname =
          url.hostname.toLowerCase();

        if (
          url.protocol !== "https:" ||
          url.username ||
          url.password ||
          !(
            hostname === "fedapay.com" ||
            hostname.endsWith(".fedapay.com")
          )
        ) {
          throw new Error(
            "INVALID_PAYMENT_REDIRECT"
          );
        }

        window.location.assign(
          url.toString()
        );
      } else if (result.nextAction.type === "SDK" && result.nextAction.provider === "FEDAPAY") {
        setFedaPayload(result.nextAction.payload);
        const instance = await openFedaPayCheckout(result.nextAction.payload, (dismissed) => {
          if (!active.current) return;
          setDialogDismissed(dismissed);
          // Closing the official dialog is only a reason to verify, never proof of payment.
          setCheckout({ ...pending, verifyOnRefresh: true });
        });
        if (active.current) setFedaWidget(instance);
      } else if (
        result.nextAction.type === "SDK" &&
        result.nextAction.provider === "KKIAPAY"
      ) {
        const sdk = await import("kkiapay");
        const payload =
          result.nextAction.payload;

        if (
          typeof payload.key !== "string" ||
          payload.amount !== value
        ) {
          throw new Error(
            "INVALID_KKIAPAY_WIDGET"
          );
        }

        sdk.removeKkiapayListener(
          "success"
        );
        sdk.removeKkiapayListener(
          "failed"
        );

        const verifyWidgetReturn = async (event: { transactionId?: string } | undefined) => {
          const externalId = event?.transactionId;
          if (
            !active.current ||
            !externalId
          ) {
            return;
          }

          const returned = {
            ...pending,
            providerTransactionId:
              externalId,
          };
          // An external payment now exists: do not open a second payment widget.
          setWidget(null);
          setCheckout(returned);
          try { sessionStorage.setItem(`payment:${pending.transactionId}`, JSON.stringify(returned)); } catch { /* Optional storage. */ }

          try {
            // Le serveur vérifie auprès du prestataire.
            // Le retour du widget n'est pas une preuve.
            await fetch(
              "/api/payments/status",
              {
                method: "POST",
                credentials: "same-origin",
                headers: {
                  "Content-Type":
                    "application/json",
                  "x-payment-access-token":
                    pending.accessToken,
                },
                body: JSON.stringify({
                  transactionId:
                    pending.transactionId,
                  providerTransactionId:
                    externalId,
                }),
              }
            );
          } catch {
            // Le webhook reste indépendant.
          }
        };

        sdk.addSuccessListener(
          verifyWidgetReturn
        );
        sdk.addFailedListener(
          verifyWidgetReturn
        );
        cleanupWidget.current = () => {
          sdk.removeKkiapayListener("success");
          sdk.removeKkiapayListener("failed");
        };

        const options = {
          ...payload,
          amount: value,
          key: payload.key,
        };

        setWidget(options);
        sdk.openKkiapayWidget(
          options
        );
      }
    } catch {
      setError(t.error);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  const input =
    "min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-[#092B50] focus:border-[#00A9BF] focus:outline-none focus:ring-2 focus:ring-cyan-100";

  const numericAmount = Number(amount);

  const displayAmount =
    new Intl.NumberFormat(language).format(
      Number.isFinite(numericAmount)
        ? numericAmount
        : 0
    );

  return (
    <section
      className={`w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-4 font-sans text-[#092B50] shadow-sm sm:p-6 ${className}`}
    >
      <h2 className="sr-only">
        <Heart className="h-5 w-5 text-[#E71E3D]" />
        {t.title}
      </h2>

      {!checkout && (
        <form
          onSubmit={submit}
          className="grid gap-4 lg:grid-cols-2 lg:gap-6"
        >
          <div className="min-w-0 space-y-5">
            <fieldset
              disabled={busy}
              className="space-y-3"
            >
              <legend className="mb-2 font-bold">
                {t.amount}
              </legend>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {suggestedAmounts.map(
                  (suggested) => (
                    <button
                      key={suggested}
                      type="button"
                      aria-pressed={
                        Number(amount) ===
                        suggested
                      }
                      onClick={() =>
                        setAmount(
                          String(suggested)
                        )
                      }
                      className={`min-h-12 rounded-xl border px-2 text-sm font-bold ${
                        Number(amount) ===
                        suggested
                          ? "border-[#00A9BF] bg-cyan-50 text-[#00869B]"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {new Intl.NumberFormat(
                        language
                      ).format(suggested)}{" "}
                      FCFA
                    </button>
                  )
                )}
              </div>

              <label
                className="block text-sm font-semibold"
                htmlFor={`amount-${campaignId}`}
              >
                {t.other}
              </label>

              <input
                id={`amount-${campaignId}`}
                type="number"
                inputMode="numeric"
                required
                min={100}
                max={10000000}
                step={1}
                value={amount}
                onChange={(event) =>
                  setAmount(
                    event.target.value
                  )
                }
                className={input}
              />
            </fieldset>

            <fieldset
              disabled={busy}
              className="space-y-3 border-t border-slate-100 pt-5"
            >
              <legend className="mb-2 font-bold">
                {t.contact}
              </legend>

              <label
                className="block text-sm font-semibold"
                htmlFor={`email-${campaignId}`}
              >
                {t.email} *
              </label>

              <input
                id={`email-${campaignId}`}
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                className={input}
              />

              <label
                className="block text-sm font-semibold"
                htmlFor={`phone-${campaignId}`}
              >
                {t.phone} *
              </label>

              <div className="flex min-w-0 gap-2">
                <select
                  aria-label={t.country}
                  value={countryCode}
                  onChange={(event) =>
                    changeCountry(
                      event.target.value
                    )
                  }
                  disabled={busy}
                  className="min-h-12 w-[125px] shrink-0 rounded-xl border border-slate-300 bg-white px-2 text-sm text-[#092B50] focus:border-[#00A9BF] focus:outline-none focus:ring-2 focus:ring-cyan-100"
                >
                  {COUNTRIES.map(
                    (country) => (
                      <option
                        key={country.iso}
                        value={country.iso}
                      >
                        {country.iso}{" "}
                        {country.dial}
                      </option>
                    )
                  )}
                </select>

                <input
                  id={`phone-${campaignId}`}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  required
                  maxLength={20}
                  placeholder={
                    t.phonePlaceholder
                  }
                  value={phone}
                  onChange={(event) =>
                    changePhone(
                      event.target.value
                    )
                  }
                  className={`${input} min-w-0 flex-1`}
                />
              </div>
            </fieldset>
          </div>

          <div className="min-w-0 rounded-2xl border border-[#DDEAF1] bg-[#F8FBFD] p-4 sm:p-5">
            <PaymentMethods
              key={language}
              heading={t.method}
              language={language}
              value={method}
              onChange={setMethod}
              disabled={busy}
              onLoadingChange={
                setLoadingMethods
              }
              onAvailabilityChange={
                setMethods
              }
            />

            <dl className="my-4 overflow-hidden rounded-xl border border-slate-200 bg-white text-sm">
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <dt className="font-bold">
                  {t.total}
                </dt>
                <dd className="text-lg font-extrabold text-[#092B50]">
                  {displayAmount} FCFA
                </dd>
              </div>
            </dl>

            <button
              disabled={
                busy ||
                loadingMethods ||
                !method
              }
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#E71E3D] px-4 py-3 font-bold text-white hover:bg-[#C91834] disabled:opacity-50"
              type="submit"
            >
              {busy ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : (
                <Heart className="h-5 w-5" />
              )}
              {busy ? t.wait : t.pay}
            </button>
          </div>
        </form>
      )}

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}

      {checkout && (
        <PaymentStatus
          key={checkout.transactionId}
          {...checkout}
          dialogDismissed={dialogDismissed}
          language={language}
          onConfirmed={(
            donationId,
            transactionId
          ) => {
            setWidget(null);
            setFedaWidget(null);
            setFedaPayload(null);
            notifyCampaignUpdate();
            onPaymentConfirmed?.(
              donationId,
              transactionId
            );
          }}
          onFailed={() => {
            setWidget(null);
            setFedaWidget(null);
            setFedaPayload(null);
          }}
        />
      )}

      {widget && (
        <button
          type="button"
          className="mt-3 min-h-12 w-full rounded-xl bg-[#E71E3D] px-4 py-3 font-bold text-white"
          onClick={async () => {
            try {
              const sdk = await import(
                "kkiapay"
              );
              sdk.openKkiapayWidget(
                widget
              );
            } catch {
              setError(t.error);
            }
          }}
        >
          {t.pay}
        </button>
      )}

      {fedaPayload && (
        <button type="button" disabled={busy}
          className="mt-3 min-h-12 w-full rounded-xl bg-[#E71E3D] px-4 py-3 font-bold text-white disabled:opacity-50"
          onClick={async () => {
            setError(null);
            setBusy(true);
            setDialogDismissed(false);
            try {
              if (fedaWidget) fedaWidget.open();
              else setFedaWidget(await openFedaPayCheckout(fedaPayload, (dismissed) => {
                if (active.current && checkout) {
                  setDialogDismissed(dismissed);
                  setCheckout({ ...checkout, verifyOnRefresh: true });
                }
              }));
            } catch { setError(t.error); }
            finally { setBusy(false); }
          }}>
          {busy ? t.wait : t.pay}
        </button>
      )}

    </section>
  );
}
