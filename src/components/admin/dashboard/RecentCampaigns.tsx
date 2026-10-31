
import type { DashboardCampaign } from "@/types/admin-dashboard";
import Link from "next/link";

const money = (amount: number) =>
  `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    DRAFT: "Brouillon",
    ACTIVE: "Active",
    PUBLISHED: "Publiée",
    VERIFYING: "En vérification",
    CLOSED: "Clôturée",
    SUSPENDED: "Suspendue",
    COMPLETED: "Terminée",
    PAUSED: "Suspendue",
    CANCELLED: "Annulée",
  };

  return labels[status] ?? status;
}

export default function RecentCampaigns({
  campaigns,
}: {
  campaigns: DashboardCampaign[];
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold text-slate-900">
          Campagnes récentes
        </h2>
        <Link href="/admin/demandes" className="shrink-0 text-xs font-semibold text-blue-600 hover:underline">Voir toutes</Link>
      </div>

      {campaigns.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-slate-500">
          Aucune campagne enregistrée.
        </p>
      ) : (
        <div className="divide-y divide-slate-100">
          {campaigns.map((campaign) => (
            <article
              key={campaign.id}
              className="space-y-3 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                {campaign.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={campaign.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-sm font-semibold text-slate-900">
                    <Link href={`/admin/demandes/${campaign.id}`} className="hover:text-blue-700 hover:underline">{campaign.title}</Link>
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {money(campaign.collectedAmount)}
                    {" collectés sur "}
                    {money(campaign.targetAmount)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                  {statusLabel(campaign.status)}
                </span>
              </div>

              <div
                className="h-2 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-label={`Progression de ${campaign.title}`}
                aria-valuenow={Math.round(
                  campaign.progressPercentage,
                )}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{
                    width: `${
                      campaign.progressPercentage
                    }%`,
                  }}
                />
              </div>

              <p className="text-right text-xs text-slate-500">
                {campaign.progressPercentage.toLocaleString(
                  "fr-FR",
                  { maximumFractionDigits: 1 },
                )}
                % de l&apos;objectif
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
