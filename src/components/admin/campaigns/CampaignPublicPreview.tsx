
"use client";
import { countryName } from "@/lib/countries";

import CampaignProgress from "./CampaignProgress";
import type {
  CampaignCategoryOption,
  CampaignFormData,
} from "@/types/campaign";

type Props = {
  form: CampaignFormData;
  categories: CampaignCategoryOption[];
};

export default function CampaignPublicPreview({
  form,
  categories,
}: Props) {
  const category = categories.find(
    (item) => item.id === form.categoryId
  );

  const targetAmount = Number(form.targetAmount) || 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-bold text-slate-900">
          Aperçu public
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Prévisualisation avant publication
        </p>
      </div>

      <div className="aspect-[16/10] overflow-hidden bg-slate-100">
        {form.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.photos[0].imageUrl}
            alt="Photo principale de la collecte"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Aucune photo sélectionnée
          </div>
        )}
      </div>

      <div className="space-y-4 p-5">
        {category && (
          <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {category.name}
          </span>
        )}

        <div className="my-3 flex flex-wrap items-center gap-2 text-sm">
          {form.countryCode && <span className="rounded-full bg-slate-100 px-3 py-1">{countryName(form.countryCode)}</span>}
          {form.isUrgent && <span className="rounded-full bg-red-50 px-3 py-1 font-bold text-red-700">Urgent</span>}
        </div>
        <h3 className="break-words text-xl font-bold leading-snug text-slate-900">
          {form.title.trim() || "Titre de la collecte"}
        </h3>

        <p className="whitespace-pre-line break-words text-sm leading-6 text-slate-600">
          {form.shortDescription.trim() ||
            "La description courte apparaîtra ici."}
        </p>

        <CampaignProgress
          collectedAmount={Number(form.initialCollectedAmount) || 0}
          targetAmount={targetAmount}
          currency="XOF"
        />
        <p className="text-sm text-slate-600">{new Intl.NumberFormat("fr-FR").format(Number(form.initialDonorCount) || 0)} participants déjà enregistrés</p>

        <div className="rounded-xl bg-blue-700 px-4 py-3 text-center text-sm font-bold text-white">
          Faire un don
        </div>

        <p className="text-center text-xs text-slate-500">
          Aperçu uniquement — aucun paiement n&apos;est effectué.
          Les dons confirmés sur le site s’ajouteront au montant déjà récolté.
        </p>
      </div>
    </section>
  );
}
