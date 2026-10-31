import {
  Megaphone,
  UsersRound,
  FileCheck2,
} from "lucide-react";

type Props = {
  activeCampaigns: number;
  beneficiariesHelped: number;
  verifiedFiles: number;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}

export default function BeneficiairesStats({
  activeCampaigns,
  beneficiariesHelped,
  verifiedFiles,
}: Props) {
  const statistics = [
    {
      title: "Campagnes actives",
      value: activeCampaigns,
      description: "En cours",
      icon: Megaphone,
    },
    {
      title: "Bénéficiaires aidés",
      value: beneficiariesHelped,
      description: "Des vies changées",
      icon: UsersRound,
    },
    {
      title: "Dossiers vérifiés",
      value: verifiedFiles,
      description: "Dossiers contrôlés",
      icon: FileCheck2,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {statistics.map((statistic) => {
        const Icon = statistic.icon;

        return (
          <div
            key={statistic.title}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
              <Icon size={26} strokeWidth={2.2} />
            </div>

            <div className="min-w-0">
              <p className="text-2xl font-extrabold text-[#082b55]">
                {formatNumber(statistic.value)}
              </p>

              <p className="text-sm font-semibold text-slate-700">
                {statistic.title}
              </p>

              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                {statistic.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}