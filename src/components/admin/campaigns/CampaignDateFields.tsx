
"use client";

import type { CampaignFormData } from "@/types/campaign";

type Props = {
  form: CampaignFormData;
  update: <K extends keyof CampaignFormData>(
    key: K,
    value: CampaignFormData[K]
  ) => void;
};

export default function CampaignDateFields({ form, update }: Props) {
  const inputClass =
    "mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

  return (
    <section>
      <h3 className="mb-4 text-base font-bold text-slate-900">
        Période de la collecte
      </h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="campaign-start"
            className="text-sm font-semibold text-slate-700"
          >
            Date de lancement
          </label>
          <input
            id="campaign-start"
            type="date"
            value={form.startDate}
            onChange={(event) => update("startDate", event.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="campaign-end"
            className="text-sm font-semibold text-slate-700"
          >
            Date de fin
          </label>
          <input
            id="campaign-end"
            type="date"
            min={form.startDate || undefined}
            value={form.endDate}
            onChange={(event) => update("endDate", event.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-500">
        La date de fin ne peut pas précéder la date de lancement.
      </p>
    </section>
  );
}
