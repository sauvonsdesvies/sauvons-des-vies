
"use client";

import { useEffect, useState } from "react";

type Language = "fr" | "en" | "de" | "es";

interface PhoneCountryInputProps {
  value: string;
  onChange: (value: string) => void;
  language?: Language;
  disabled?: boolean;
  required?: boolean;
  id?: string;
}

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

const LABELS = {
  fr: {
    phone: "Numéro de téléphone",
    country: "Indicatif téléphonique",
    placeholder: "Numéro de téléphone",
  },
  en: {
    phone: "Phone number",
    country: "Calling code",
    placeholder: "Phone number",
  },
  de: {
    phone: "Telefonnummer",
    country: "Ländervorwahl",
    placeholder: "Telefonnummer",
  },
  es: {
    phone: "Número de teléfono",
    country: "Prefijo telefónico",
    placeholder: "Número de teléfono",
  },
};

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function detectFromPhone(value: string): CountryCode | null {
  if (!value.startsWith("+")) return null;

  const sorted = [...COUNTRIES].sort(
    (a, b) => b.dial.length - a.dial.length
  );

  const match = sorted.find((country) =>
    value.startsWith(country.dial)
  );

  return match?.iso ?? null;
}

export default function PhoneCountryInput({
  value,
  onChange,
  language = "fr",
  disabled = false,
  required = true,
  id = "donor-phone",
}: PhoneCountryInputProps) {
  const [countryCode, setCountryCode] =
    useState<CountryCode>(
      () => detectFromPhone(value) ?? "BJ"
    );

  const [localNumber, setLocalNumber] = useState(() => {
    const detected = detectFromPhone(value);
    const country = COUNTRIES.find(
      (item) => item.iso === detected
    );

    if (country && value.startsWith(country.dial)) {
      return onlyDigits(value.slice(country.dial.length));
    }

    return onlyDigits(value);
  });

  const [countryChosen, setCountryChosen] = useState(false);

  const labels = LABELS[language] ?? LABELS.fr;

  const selected =
    COUNTRIES.find((item) => item.iso === countryCode) ??
    COUNTRIES[0];

  useEffect(() => {
    if (countryChosen || value.trim()) return;

    const controller = new AbortController();

    async function loadCountry() {
      try {
        const response = await fetch(
          "/api/public/visitor-country",
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (!response.ok) return;

        const result: unknown = await response.json();

        if (
          typeof result !== "object" ||
          result === null ||
          !("country" in result) ||
          typeof result.country !== "string"
        ) {
          return;
        }

        const match = COUNTRIES.find(
          (item) => item.iso === result.country
        );

        if (match) {
          setCountryCode(match.iso);
        }
      } catch {
        // Le pays par défaut reste disponible.
      }
    }

    void loadCountry();

    return () => controller.abort();
  }, [countryChosen, value]);

  function handleCountryChange(next: string) {
    const country = COUNTRIES.find(
      (item) => item.iso === next
    );

    if (!country) return;

    setCountryChosen(true);
    setCountryCode(country.iso);

    onChange(
      localNumber
        ? `${country.dial}${localNumber}`
        : ""
    );
  }

  function handlePhoneChange(next: string) {
    const digits = onlyDigits(next).slice(0, 15);

    setLocalNumber(digits);

    onChange(
      digits
        ? `${selected.dial}${digits}`
        : ""
    );
  }

  return (
    <div className="w-full space-y-2">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-slate-700"
      >
        {labels.phone}
      </label>

      <div className="flex w-full gap-2">
        <select
          aria-label={labels.country}
          value={countryCode}
          onChange={(event) =>
            handleCountryChange(event.target.value)
          }
          disabled={disabled}
          className="w-[126px] shrink-0 rounded-xl border border-slate-300 bg-white px-2 py-3 text-sm text-slate-900 outline-none focus:border-blue-600"
        >
          {COUNTRIES.map((country) => (
            <option
              key={country.iso}
              value={country.iso}
            >
              {country.iso} {country.dial}
            </option>
          ))}
        </select>

        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={localNumber}
          onChange={(event) =>
            handlePhoneChange(event.target.value)
          }
          disabled={disabled}
          required={required}
          placeholder={labels.placeholder}
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-blue-600"
        />
      </div>
    </div>
  );
}
