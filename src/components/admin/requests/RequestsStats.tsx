import { CheckCheck, CircleCheck, Clock3, ClipboardList, Search } from "lucide-react";
import type { RequestStatistics } from "@/types/request";

const cards = [
  { key: "total", title: "Total des demandes", icon: ClipboardList, color: "text-blue-700", bg: "bg-blue-100" },
  { key: "pending", title: "En attente", icon: Clock3, color: "text-amber-700", bg: "bg-amber-100" },
  { key: "verifying", title: "En vérification", icon: Search, color: "text-sky-700", bg: "bg-sky-100" },
  { key: "published", title: "Publiées", icon: CircleCheck, color: "text-emerald-700", bg: "bg-emerald-100" },
  { key: "closed", title: "Clôturées", icon: CheckCheck, color: "text-slate-700", bg: "bg-slate-200" },
] as const;

export default function RequestsStats({ stats }: { stats: RequestStatistics }) {
  return (
    <section aria-label="Statistiques des demandes" className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.key} className="flex min-h-24 min-w-0 items-center gap-3 rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
            <span aria-hidden="true" className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-full " + card.bg + " " + card.color}>
              <Icon className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <p className={"break-words text-xl font-bold leading-tight " + card.color}>{stats[card.key].toLocaleString("fr-FR")}</p>
              <p className="mt-1 text-sm leading-5 text-slate-600">{card.title}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}

