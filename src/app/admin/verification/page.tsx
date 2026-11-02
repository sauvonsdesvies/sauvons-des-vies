
"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  LoaderCircle,
  MailCheck,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import AuthLayout from "@/components/admin/AuthLayout";

type VerificationResponse = {
  success?: boolean;
  message?: string;
};

const CODE_LENGTH = 6;

export default function VerificationPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isCodeValid = /^\d{6}$/.test(code);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleCodeChange(value: string) {
    // Accepte uniquement les chiffres.
    // Fonctionne aussi avec un code collé.
    const cleaned = value
      .replace(/\D/g, "")
      .slice(0, CODE_LENGTH);

    setCode(cleaned);

    if (error) {
      setError("");
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading || success) {
      return;
    }

    setError("");

    if (!isCodeValid) {
      setError(
        "Veuillez saisir les six chiffres du code reçu par email."
      );
      inputRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/admin/auth/verification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          cache: "no-store",
          body: JSON.stringify({ code }),
        }
      );

      let result: VerificationResponse = {};

      try {
        result = (await response.json()) as VerificationResponse;
      } catch {
        setError(
          "Réponse du serveur invalide. Veuillez réessayer."
        );
        return;
      }

      if (!response.ok || !result.success) {
        if (response.status === 429) {
          setError(
            result.message ||
              "Trop de tentatives. Veuillez patienter avant de réessayer."
          );
        } else if (response.status === 401) {
          setError(
            result.message ||
              "Code invalide ou expiré. Recommencez la connexion."
          );
        } else if (response.status === 403) {
          setError(
            result.message ||
              "Vérification non autorisée. Recommencez la connexion."
          );
        } else {
          setError(
            result.message ||
              "Impossible de vérifier le code. Réessayez."
          );
        }

        return;
      }

      // La validation du code a réussi.
      setSuccess(true);
      setCode("");

      // Redirection vers l'administration.
      router.replace("/admin");
      router.refresh();
    } catch {
      setError(
        "Erreur de connexion au serveur. Vérifiez votre connexion et réessayez."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleReturnToLogin() {
    if (loading || success) {
      return;
    }

    router.replace("/admin/connexion");
  }

  return (
    <AuthLayout
      title="Vérification de sécurité"
      description="Saisissez le code à six chiffres envoyé à l'adresse email de l'administrateur."
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-6"
        noValidate
      >
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <MailCheck
              className="h-8 w-8"
              aria-hidden="true"
            />
          </div>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <AlertCircle
              className="mt-0.5 h-5 w-5 shrink-0"
              aria-hidden="true"
            />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700"
          >
            Code vérifié avec succès.
            Redirection vers votre espace administrateur...
          </div>
        )}

        <div>
          <label
            htmlFor="verification-code"
            className="mb-3 block text-center text-sm font-semibold text-slate-700"
          >
            Code de vérification
          </label>

          <input
            ref={inputRef}
            id="verification-code"
            name="verification-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={CODE_LENGTH}
            value={code}
            onChange={(event) =>
              handleCodeChange(event.target.value)
            }
            placeholder="000000"
            required
            disabled={loading || success}
            aria-invalid={Boolean(error)}
            aria-describedby="verification-help"
            className="h-16 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-center font-mono text-3xl font-bold tracking-[0.25em] text-[#09234D] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <p
            id="verification-help"
            className="mt-3 text-center text-sm text-slate-500"
          >
            Ce code est valable pendant 5 minutes.
          </p>

          <p
            className="mt-2 text-center text-sm text-slate-500"
            aria-live="polite"
          >
            {code.length} / {CODE_LENGTH} chiffres saisis
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || success || !isCodeValid}
          className="flex min-h-13 w-full items-center justify-center gap-3 rounded-xl bg-[#0868DB] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0757BA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <LoaderCircle
                className="h-5 w-5 animate-spin"
                aria-hidden="true"
              />
              Vérification...
            </>
          ) : success ? (
            <>
              <ShieldCheck
                className="h-5 w-5"
                aria-hidden="true"
              />
              Accès autorisé
            </>
          ) : (
            <>
              <ShieldCheck
                className="h-5 w-5"
                aria-hidden="true"
              />
              Vérifier et accéder
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleReturnToLogin}
          disabled={loading || success}
          className="flex w-full items-center justify-center gap-2 py-2 text-sm font-medium text-slate-500 transition hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft
            className="h-4 w-4"
            aria-hidden="true"
          />
          Retour à la connexion
        </button>
      </form>
    </AuthLayout>
  );
}
