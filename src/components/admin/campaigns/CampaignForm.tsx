
"use client";

import { useEffect, useState } from "react";
import { COUNTRIES } from "@/lib/countries";
import CampaignGeneralFields from "./CampaignGeneralFields";
import CampaignDateFields from "./CampaignDateFields";
import CampaignPhotoUpload from "./CampaignPhotoUpload";
import CampaignStatusField from "./CampaignStatusField";
import CampaignPublicPreview from "./CampaignPublicPreview";
import CampaignFormActions from "./CampaignFormActions";
import type {
  CampaignCategoryOption,
  CampaignFormData,
  CampaignPhotoInput,
} from "@/types/campaign";

const initialForm: CampaignFormData = {
  countryCode: "",
  isUrgent: false,
  title: "",
  shortDescription: "",
  description: "",
  categoryId: "",
  targetAmount: "",
  startDate: "",
  endDate: "",
  status: "DRAFT",
  photos: [],
};

export default function CampaignForm() {
  const [form, setForm] = useState<CampaignFormData>(initialForm);
  const [categories, setCategories] = useState<CampaignCategoryOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [createdSlug, setCreatedSlug] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        const response = await fetch("/api/admin/campaigns", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Impossible de charger les catégories.");
        }

        if (active) {
          setCategories(result.categories ?? []);
          setCategoryError("");
        }
      } catch (err) {
        if (active) {
          setCategoryError(
            err instanceof Error ? err.message : "Erreur de chargement."
          );
        }
      } finally {
        if (active) setLoadingCategories(false);
      }
    }

    void loadCategories();
    const refreshCategories = () => { void loadCategories(); };
    window.addEventListener("focus", refreshCategories);

    return () => {
      active = false;
      window.removeEventListener("focus", refreshCategories);
    };
  }, []);

  function update<K extends keyof CampaignFormData>(
    key: K,
    value: CampaignFormData[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
    setSuccess("");
  }

  function updatePhotos(photos: CampaignPhotoInput[]) {
    update("photos", photos);
  }

  async function save(status: "DRAFT" | "PUBLISHED") {
    if (saving) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          ...form,
          status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Enregistrement impossible.");
      }

      setCreatedSlug(result.campaign.slug);
      setSuccess(
        status === "PUBLISHED"
          ? "La collecte a été publiée avec succès."
          : "Le brouillon a été enregistré avec succès."
      );

      setForm((current) => ({ ...current, status }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Une erreur est survenue."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-6 border-b border-slate-100 pb-5">
          <h2 className="text-lg font-bold text-slate-900">
            Informations de la collecte
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Les champs marqués d&apos;un astérisque sont obligatoires.
          </p>
        </div>

        <div className="space-y-7">
          <CampaignGeneralFields
            form={form}
            categories={categories}
            loadingCategories={loadingCategories}
            categoryError={categoryError}
            update={update}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">Pays du bénéficiaire <span className="text-red-600">*</span>
              <select required value={form.countryCode} onChange={(event) => update("countryCode", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3">
                <option value="">Sélectionner un pays</option>
                {COUNTRIES.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-800">
              <input type="checkbox" checked={form.isUrgent} onChange={(event) => update("isUrgent", event.target.checked)} className="h-4 w-4" /> Collecte urgente
            </label>
          </div>
          <p className="text-sm text-slate-500">Indiquez le pays réel du bénéficiaire et réservez la mention urgente aux besoins immédiats. Ne publiez aucun document médical confidentiel.</p>
          <CampaignDateFields form={form} update={update} />

          <CampaignPhotoUpload
            photos={form.photos}
            onChange={updatePhotos}
            disabled={saving}
          />

          <CampaignStatusField
            value={form.status}
            onChange={(value) => update("status", value)}
          />
        </div>

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {success && (
          <div
            role="status"
            className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            <p>{success}</p>
            {createdSlug && form.status === "PUBLISHED" && (
              <a
                href={`/campagnes/${encodeURIComponent(createdSlug)}`}
                className="mt-2 inline-block font-semibold underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Voir la collecte publiée
              </a>
            )}
          </div>
        )}

        <CampaignFormActions
          saving={saving}
          disabled={loadingCategories || categories.length === 0}
          onDraft={() => void save("DRAFT")}
          onPublish={() => void save("PUBLISHED")}
          onPreview={() => setPreviewOpen(true)}
        />
      </section>

      <aside className="min-w-0 xl:sticky xl:top-20">
        <CampaignPublicPreview form={form} categories={categories} />
      </aside>

      {previewOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Prévisualisation de la collecte"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-slate-50 p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-900">
                Prévisualisation
              </h2>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Fermer
              </button>
            </div>

            <CampaignPublicPreview form={form} categories={categories} />
          </div>
        </div>
      )}
    </div>
  );
}
