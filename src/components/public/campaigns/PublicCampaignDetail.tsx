import { countryName } from "@/lib/countries";

import CampaignProgress from "@/components/admin/campaigns/CampaignProgress";
import type { PublicCampaignData } from "@/types/campaign";

type Props = {
  campaign: PublicCampaignData;
};

function formatDate(value: string | null) {
  if (!value) return null;

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default function PublicCampaignDetail({ campaign }: Props) {
  const startDate = formatDate(campaign.startDate);
  const endDate = formatDate(campaign.endDate);

  return (
    <main className="min-h-screen bg-slate-50">
      
      <div className="mx-auto max-w-none px-4 py-8 sm:px-6 lg:py-12">
        <div className="mb-6">
          <p className="text-sm font-semibold text-blue-700">
            Fondation Sauvons des Vies
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Collecte de dons / {campaign.category.name}
          </p>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_370px]">
          <article className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {campaign.imageUrl && (
              <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={campaign.imageUrl}
                  alt={`Photo principale : ${campaign.title}`}
                  className="h-full w-full object-contain"
                />
              </div>
            )}

            <div className="space-y-6 p-5 sm:p-8">
              <div>
                <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {campaign.category.name}
                </span>

                <div className="my-3 flex flex-wrap items-center gap-2 text-sm">
          {campaign.countryCode && <span className="rounded-full bg-slate-100 px-3 py-1">{countryName(campaign.countryCode)}</span>}
          {campaign.isUrgent && <span className="rounded-full bg-red-50 px-3 py-1 font-bold text-red-700">Urgent</span>}
        </div>
        <h1 className="mt-4 break-words text-2xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
                  {campaign.title}
                </h1>

                <p className="mt-4 whitespace-pre-line break-words text-base leading-7 text-slate-600">
                  {campaign.shortDescription}
                </p>
              </div>

              {(startDate || endDate) && (
                <div className="flex flex-wrap gap-4 border-y border-slate-100 py-4 text-sm text-slate-600">
                  {startDate && (
                    <span>
                      <strong className="text-slate-800">
                        Début :
                      </strong>{" "}
                      {startDate}
                    </span>
                  )}

                  {endDate && (
                    <span>
                      <strong className="text-slate-800">
                        Fin :
                      </strong>{" "}
                      {endDate}
                    </span>
                  )}
                </div>
              )}

              <section>
                <h2 className="mb-4 text-xl font-bold text-slate-900">
                  Présentation de la collecte
                </h2>

                <div className="whitespace-pre-wrap break-words text-sm leading-8 text-slate-700 sm:text-base">
                  {campaign.description}
                </div>
              </section>

              {campaign.photos.length > 1 && (
                <section>
                  <h2 className="mb-4 text-xl font-bold text-slate-900">
                    Photos de la collecte
                  </h2>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {campaign.photos.map((photo, index) => (
                      <div
                        key={photo.id}
                        className="aspect-square overflow-hidden rounded-xl bg-slate-100"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.imageUrl}
                          alt={`Photo ${index + 1} de la collecte`}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </article>

          <aside id="soutenir" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:sticky lg:top-6">
            <h2 className="mb-6 text-lg font-bold text-slate-900">
              Soutenir cette collecte
            </h2>

            <CampaignProgress
              collectedAmount={campaign.progress.collectedAmount}
              targetAmount={campaign.progress.targetAmount}
              currency={campaign.currency}
            />

            <p className="mt-5 text-center text-sm text-slate-600">
              {campaign.progress.confirmedDonationsCount} don(s) confirmé(s)
            </p>

            <div className="mt-6 rounded-xl bg-slate-100 p-4 text-sm leading-6 text-slate-600">
              Le paiement en ligne sera accessible après l&apos;intégration
              et la vérification du système de dons sécurisé.
            </div>

            <p className="mt-4 text-center text-xs leading-5 text-slate-500">
              Les montants affichés proviennent uniquement des dons
              confirmés enregistrés par la fondation.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
