"use client";

import { currencyUnit } from "@/lib/campaigns/currencies";

import { useState } from "react";
import { notifyCampaignUpdate } from "@/lib/campaigns/live-updates";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { COUNTRIES } from "@/lib/countries";
import type { RequestItem } from "@/types/request";

export default function RequestForm({ item }: { item: RequestItem }) {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState(item.countryCode ?? "");
  const [isUrgent, setIsUrgent] = useState(item.isUrgent);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [shortDescription, setShortDescription] = useState(
    item.shortDescription
  );
  const [targetAmount, setTargetAmount] = useState(
    String(item.targetAmount)
  );
  const [saving, setSaving] = useState(false);
  const [initialCollectedAmount, setInitialCollectedAmount] = useState(String(item.initialCollectedAmount));
  const [initialDonorCount, setInitialDonorCount] = useState(String(item.initialDonorCount));
  const [error, setError] = useState("");

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/requests/${encodeURIComponent(item.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            countryCode, isUrgent,
            title,
            description,
            shortDescription,
            targetAmount: Number(targetAmount),
            initialCollectedAmount: Number(initialCollectedAmount),
            initialDonorCount: Number(initialDonorCount),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Modification impossible.");
      }

      router.push(`/admin/demandes/${item.id}`);
      notifyCampaignUpdate();
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Erreur d'enregistrement."
      );
    } finally {
      setSaving(false);
    }
  }

  const fieldClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600";

  return (
    <div className="w-full min-w-0">
      <div className="mb-6">
        <Link href={`/admin/demandes/${item.id}`} className="text-sm text-blue-700">
          Retour à la demande
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-[#092d5b]">
          Modifier la demande
        </h1>
      </div>

      <form
        onSubmit={(event) => void save(event)}
        className="w-full min-w-0 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"
      >
        <label className="block text-sm font-semibold">Pays du bénéficiaire
          <select value={countryCode} onChange={(event) => setCountryCode(event.target.value)} className={fieldClass}>
            <option value="">Non renseigné</option>
            {COUNTRIES.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-3 text-sm font-semibold text-red-700"><input type="checkbox" checked={isUrgent} onChange={(event) => setIsUrgent(event.target.checked)} /> Collecte urgente</label>
        <div>
          <label htmlFor="request-title" className="text-sm font-semibold">
            Titre
          </label>
          <input
            id="request-title"
            required
            minLength={5}
            maxLength={180}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="request-short" className="text-sm font-semibold">
            Description courte
          </label>
          <textarea
            id="request-short"
            required
            rows={3}
            maxLength={500}
            value={shortDescription}
            onChange={(event) => setShortDescription(event.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="request-description" className="text-sm font-semibold">
            Description complète
          </label>
          <textarea
            id="request-description"
            required
            rows={8}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="request-target" className="text-sm font-semibold">
            Objectif ({currencyUnit(item.currency)})
          </label>
          <input
            id="request-target"
            type="number"
            min={1}
            max={2147483647}
            required
            value={targetAmount}
            onChange={(event) => setTargetAmount(event.target.value)}
            className={fieldClass}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">Montant déjà récolté (FCFA)
            <input type="number" min={0} max={2147483647} step={1} value={initialCollectedAmount} onChange={event => setInitialCollectedAmount(event.target.value)} className={fieldClass} />
          </label>
          <label className="text-sm font-semibold">Nombre de participants
            <input type="number" min={0} max={2147483647} step={1} value={initialDonorCount} onChange={event => setInitialDonorCount(event.target.value)} className={fieldClass} />
          </label>
        </div>
        <p className="text-sm text-slate-500">La collecte continue à partir de ces chiffres. Chaque nouveau don confirmé augmente le total.</p>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
      </form>
    </div>
  );
}
