
import AdminStatCard from "./AdminStatCard";
import type {
  DashboardStats,
  DashboardStat,
  DashboardStatKey,
  DashboardTrend,
} from "@/types/admin-dashboard";

const definitions: {
  key: DashboardStatKey;
  label: string;
  unit: DashboardStat["unit"];
}[] = [
  {
    key: "totalDonations",
    label: "Montant récolté",
    unit: "XOF",
  },
  {
    key: "monthlyDonations",
    label: "Dons du mois en cours",
    unit: "XOF",
  },
  {
    key: "activeCampaigns",
    label: "Campagnes actives",
    unit: "count",
  },
  {
    key: "beneficiariesHelped",
    label: "Bénéficiaires aidés",
    unit: "count",
  },
  {
    key: "confirmedDonations",
    label: "Participants",
    unit: "count",
  },
  {
    key: "hospitalPayments",
    label: "Versements aux hôpitaux",
    unit: "XOF",
  },
  {
    key: "pendingRequests",
    label: "Demandes en attente",
    unit: "count",
  },
  {
    key: "completedCampaigns",
    label: "Campagnes terminées",
    unit: "count",
  },
];

export default function AdminStatsGrid({
  stats,
  trends = {},
}: {
  stats: DashboardStats;
  trends?: Partial<Record<DashboardStatKey, DashboardTrend>>;
}) {
  return (
    <section aria-label="Statistiques principales">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {definitions.map((definition) => (
          <AdminStatCard
            key={definition.key}
            stat={{
              ...definition,
              value: stats[definition.key],
              trend: trends[definition.key] ?? null,
            }}
          />
        ))}
      </div>
    </section>
  );
}
