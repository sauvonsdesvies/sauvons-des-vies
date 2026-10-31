"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Save,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import BeneficiairesStats from "./BeneficiairesStats";

import type {
  PublicStatistics,
} from "@/lib/statistics/service";

type Props = {
  initialStatistics: PublicStatistics;
};

type StatisticsForm = {
  activeCampaigns: string;
  beneficiariesHelped: string;
  verifiedFiles: string;
};

export default function BeneficiairesPage({
  initialStatistics,
}: Props) {
  const router = useRouter();

  const [statistics, setStatistics] =
    useState<PublicStatistics>(initialStatistics);

  const [form, setForm] = useState<StatisticsForm>({
    activeCampaigns: String(initialStatistics.activeCampaigns),
    beneficiariesHelped: String(initialStatistics.beneficiariesHelped),
    verifiedFiles: String(initialStatistics.verifiedFiles),
  });

  const [saving, setSaving] = useState(false);
  const saveLock = useRef(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function updateField(
    field: keyof StatisticsForm,
    value: string
  ) {
    if (value !== "" && !/^\d+$/.test(value)) {
      return;
    }

    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
    setError("");
    setMessage("");
  }

  async function saveStatistics() {
    if (saveLock.current) return;
    setError("");
    setMessage("");

    if (
      form.activeCampaigns === "" ||
      form.beneficiariesHelped === "" ||
      form.verifiedFiles === ""
    ) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    const values = {
      activeCampaigns: Number(form.activeCampaigns),
      beneficiariesHelped: Number(form.beneficiariesHelped),
      verifiedFiles: Number(form.verifiedFiles),
    };

    if (
      Object.values(values).some(
        (value) =>
          !Number.isSafeInteger(value) ||
          value < 0
      )
    ) {
      setError("Veuillez saisir des nombres entiers valides.");
      return;
    }

    saveLock.current = true;
    setSaving(true);

    try {
      const response = await fetch(
        "/api/admin/beneficiaires",
        {
          method: "PUT",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Impossible d'enregistrer les statistiques."
        );
      }

      setStatistics(result.statistics);
      setForm({
        activeCampaigns: String(result.statistics.activeCampaigns),
        beneficiariesHelped: String(result.statistics.beneficiariesHelped),
        verifiedFiles: String(result.statistics.verifiedFiles),
      });
      setMessage("Statistiques enregistrées avec succès.");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Une erreur est survenue."
      );
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }

  function resetForm() {
    setForm({
      activeCampaigns: String(statistics.activeCampaigns),
      beneficiariesHelped: String(statistics.beneficiariesHelped),
      verifiedFiles: String(statistics.verifiedFiles),
    });

    setError("");
    setMessage("");
  }

  const fields = [
    {
      key: "activeCampaigns" as const,
      label: "Campagnes actives",
      description:
        "Nombre de campagnes actuellement en cours.",
    },
    {
      key: "beneficiariesHelped" as const,
      label: "Bénéficiaires aidés",
      description:
        "Nombre total de personnes effectivement aidées.",
    },
    {
      key: "verifiedFiles" as const,
      label: "Dossiers vérifiés",
      description:
        "Nombre de dossiers dont la vérification est terminée.",
    },
  ];

  return (
    <div className="w-full min-w-0 space-y-4 [overflow-wrap:anywhere]">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Administration / Bénéficiaires
        </p>

        <h1 className="text-2xl font-extrabold text-[#082b55] sm:text-3xl">
          Statistiques de la fondation
        </h1>

        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Gérez les chiffres officiels affichés sur le site
          public de la Fondation Sauvons des Vies.
        </p>
      </div>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 size={19} className="text-blue-700" />

          <h2 className="text-base font-bold text-[#082b55]">
            Aperçu des statistiques
          </h2>
        </div>

        <BeneficiairesStats
          activeCampaigns={statistics.activeCampaigns}
          beneficiariesHelped={statistics.beneficiariesHelped}
          verifiedFiles={statistics.verifiedFiles}
        />
        {statistics.updatedAt && <p className="mt-2 text-xs text-slate-500">Dernier enregistrement : {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(statistics.updatedAt))}</p>}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5">
          <div className="flex items-center gap-2">
            <ShieldCheck
              size={20}
              className="text-blue-700"
            />

            <h2 className="text-lg font-bold text-[#082b55]">
              Mettre à jour les chiffres
            </h2>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Saisissez uniquement les chiffres vérifiés de
            la fondation.
          </p>
        </div>

        <form onSubmit={(event) => { event.preventDefault(); void saveStatistics(); }} className="space-y-4 p-4 sm:p-5">
          <div className="grid gap-5 md:grid-cols-3">
            {fields.map((field) => (
              <div key={field.key}>
                <label
                  htmlFor={field.key}
                  className="block text-sm font-semibold text-slate-700"
                >
                  {field.label}
                </label>

                <p className="mt-1 min-h-10 text-xs leading-5 text-slate-500">
                  {field.description}
                </p>

                <input
                  id={field.key}
                  type="text"
                  required
                  disabled={saving}
                  inputMode="numeric"
                  autoComplete="off"
                  value={form[field.key]}
                  onChange={(event) =>
                    updateField(
                      field.key,
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-lg font-bold text-[#082b55] outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            ))}
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          {message && (
            <p
              role="status"
              className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700"
            >
              {message}
            </p>
          )}

          <div className="flex flex-col justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
            <button
              type="button"
              disabled={saving}
              onClick={resetForm}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={16} />
              Annuler les modifications
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              <Save size={17} />

              {saving
                ? "Enregistrement..."
                : "Enregistrer les chiffres"}
            </button>
          </div>
        </form>
      </section>

      <p className="text-xs leading-5 text-slate-500">
        Les modifications enregistrées sont disponibles
        dans les statistiques publiques de la plateforme.
        Les montants financiers ne sont pas affichés ici.
      </p>
    </div>
  );
}
