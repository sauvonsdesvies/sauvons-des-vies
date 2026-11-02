
import DashboardDateFilter from "./DashboardDateFilter";
import type { DashboardPeriod } from "@/types/admin-dashboard";

export default function DashboardHeader({
  period,
  generatedAt,
}: {
  period: DashboardPeriod;
  generatedAt: string;
}) {
  const updatedAt = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Porto-Novo",
  }).format(new Date(generatedAt));

  return (
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Tableau de bord
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Indicateurs calculés à partir des opérations enregistrées.
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Données actualisées le {updatedAt}
        </p>
      </div>

      <DashboardDateFilter period={period} />
    </header>
  );
}
