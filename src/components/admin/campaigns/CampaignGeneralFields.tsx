
"use client";
import Link from "next/link";

import type {
  CampaignCategoryOption,
  CampaignFormData,
} from "@/types/campaign";

type Props = {
  form: CampaignFormData;
  categories: CampaignCategoryOption[];
  loadingCategories: boolean;
  categoryError: string;
  update: <K extends keyof CampaignFormData>(
    key: K,
    value: CampaignFormData[K]
  ) => void;
};

const inputClass =
  "mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

export default function CampaignGeneralFields({
  form,
  categories,
  loadingCategories,
  categoryError,
  update,
}: Props) {
  return (
    <section className="space-y-5">
      <h3 className="text-base font-bold text-slate-900">
        Informations générales
      </h3>

      <div>
        <label htmlFor="campaign-title" className="text-sm font-semibold text-slate-700">
          Titre de la collecte *
        </label>
        <input
          id="campaign-title"
          type="text"
          maxLength={180}
          required
          value={form.title}
          onChange={(event) => update("title", event.target.value)}
          placeholder="Titre de la collecte"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="campaign-short" className="text-sm font-semibold text-slate-700">
          Description courte *
        </label>
        <textarea
          id="campaign-short"
          rows={3}
          maxLength={500}
          required
          value={form.shortDescription}
          onChange={(event) =>
            update("shortDescription", event.target.value)
          }
          placeholder="Résumé de la situation et de l'objectif"
          className={inputClass}
        />
        <p className="mt-1 text-right text-xs text-slate-500">
          {form.shortDescription.length}/500
        </p>
      </div>

      <div>
        <label htmlFor="campaign-description" className="text-sm font-semibold text-slate-700">
          Description complète *
        </label>
        <textarea
          id="campaign-description"
          rows={9}
          required
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
          placeholder="Présentez la situation, le besoin médical et l'utilisation prévue des dons."
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="campaign-category" className="text-sm font-semibold text-slate-700">
          Catégorie *
        </label>
        <select
          id="campaign-category"
          required
          value={form.categoryId}
          disabled={loadingCategories}
          onChange={(event) => update("categoryId", event.target.value)}
          className={inputClass}
        >
          <option value="">
            {loadingCategories
              ? "Chargement des catégories..."
              : "Sélectionner une catégorie"}
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        {categoryError && <p role="alert" className="mt-2 text-sm text-red-700">{categoryError}</p>}
        {!loadingCategories && !categoryError && categories.length === 0 && (
          <p className="mt-2 text-sm text-amber-700">
            Aucune catégorie enregistrée. Ajoutez votre première catégorie avant de publier une collecte.
          </p>
        )}
        <Link href="/admin/categories" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-medium text-blue-700 underline">
          Gérer les catégories (nouvel onglet)
        </Link>
      </div>

      <div>
        <label htmlFor="campaign-target" className="text-sm font-semibold text-slate-700">
          Objectif de collecte (FCFA) *
        </label>
        <input
          id="campaign-target"
          type="number"
          min="1"
          max="2147483647"
          step="1"
          required
          value={form.targetAmount}
          onChange={(event) => update("targetAmount", event.target.value)}
          placeholder="Montant à collecter"
          className={inputClass}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="campaign-opening-amount" className="text-sm font-semibold text-slate-700">Montant déjà récolté (FCFA)</label>
          <input id="campaign-opening-amount" type="number" min="0" max="2147483647" step="1" value={form.initialCollectedAmount} onChange={event => update("initialCollectedAmount", event.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="campaign-opening-donors" className="text-sm font-semibold text-slate-700">Nombre de participants</label>
          <input id="campaign-opening-donors" type="number" min="0" max="2147483647" step="1" value={form.initialDonorCount} onChange={event => update("initialDonorCount", event.target.value)} className={inputClass} />
        </div>
      </div>
      <p className="text-xs text-slate-500">La collecte continue à partir de ces chiffres. Chaque nouveau don confirmé augmente le total.</p>
    </section>
  );
}
