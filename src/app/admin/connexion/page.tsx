
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle, LogIn, Mail, LockKeyhole } from "lucide-react";
import AuthLayout from "@/components/admin/AuthLayout";

export default function AdminConnexionPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError("Veuillez renseigner votre adresse email et votre mot de passe.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/auth/connexion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      const result: {
        success?: boolean;
        message?: string;
      } = await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.message ||
            "Connexion impossible. Vérifiez vos informations."
        );
        return;
      }

      setPassword("");
      router.replace("/admin/verification");
    } catch {
      setError(
        "Une erreur de connexion est survenue. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Connexion administrateur"
      description="Connectez-vous pour accéder à l'espace de gestion sécurisé de la fondation."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
          >
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="admin-email"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Adresse email
          </label>

          <div className="relative">
            <Mail
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            />

            <input
              id="admin-email"
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Votre adresse email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              disabled={loading}
              className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="admin-password"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Mot de passe
          </label>

          <div className="relative">
            <LockKeyhole
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            />

            <input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Votre mot de passe"
              autoComplete="current-password"
              required
              disabled={loading}
              className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              aria-label={
                showPassword
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
              aria-pressed={showPassword}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-700 disabled:opacity-50"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3">
          <p className="flex items-start gap-2 text-xs leading-5 text-blue-800">
            <LockKeyhole
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            Après validation de vos identifiants, un code de sécurité à
            six chiffres sera envoyé à votre adresse email.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex min-h-13 w-full items-center justify-center gap-3 rounded-xl bg-[#0868DB] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-[#0757BA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <>
              <LoaderCircle className="h-5 w-5 animate-spin" />
              Vérification en cours...
            </>
          ) : (
            <>
              <LogIn className="h-5 w-5" />
              Se connecter
            </>
          )}
        </button>

        <p className="text-center text-xs leading-5 text-slate-400">
          Accès strictement réservé à l&apos;administrateur autorisé.
        </p>
      </form>
    </AuthLayout>
  );
}
