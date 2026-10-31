
"use client";

import type { CampaignStatus } from "@/types/campaign";

type Props = {
  value: CampaignStatus;
  onChange: (value: CampaignStatus) => void;
};

export default function CampaignStatusField({
  value,
  onChange,
}: Props) {
  return (
    <section>
      <h3 className="mb-4 text-base font-bold text-slate-900">
        Statut de la collecte
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <label
          className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${
            value === "DRAFT"
              ? "border-blue-600 bg-blue-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <input
            type="radio"
            name="campaign-status"
            checked={value === "DRAFT"}
            onChange={() => onChange("DRAFT")}
            className="mt-1 accent-blue-700"
          />
          <span>
            <span className="block text-sm font-bold text-slate-900">
              Brouillon
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-600">
              Enregistrer sans afficher la collecte au public.
            </span>
          </span>
        </label>

        <label
          className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${
            value === "PUBLISHED"
              ? "border-blue-600 bg-blue-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <input
            type="radio"
            name="campaign-status"
            checked={value === "PUBLISHED"}
            onChange={() => onChange("PUBLISHED")}
            className="mt-1 accent-blue-700"
          />
          <span>
            <span className="block text-sm font-bold text-slate-900">
              Publication
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-600">
              Rendre la collecte accessible aux visiteurs.
            </span>
          </span>
        </label>
      </div>
    </section>
  );
}
