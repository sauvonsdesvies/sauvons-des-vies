import { ArrowDown, ArrowUp, Banknote, BriefcaseMedical, CalendarCheck2, ClipboardList, HandCoins, Heart, HeartHandshake, UsersRound, type LucideIcon } from "lucide-react";
import type { DashboardStat } from "@/types/admin-dashboard";

const appearance: Record<DashboardStat["key"], { icon: LucideIcon; background: string }> = {
  totalDonations: { icon: HandCoins, background: "bg-blue-500" },
  monthlyDonations: { icon: BriefcaseMedical, background: "bg-green-500" },
  activeCampaigns: { icon: Heart, background: "bg-rose-500" },
  beneficiariesHelped: { icon: UsersRound, background: "bg-blue-500" },
  confirmedDonations: { icon: HeartHandshake, background: "bg-amber-500" },
  hospitalPayments: { icon: Banknote, background: "bg-pink-500" },
  pendingRequests: { icon: ClipboardList, background: "bg-violet-500" },
  completedCampaigns: { icon: CalendarCheck2, background: "bg-slate-400" },
};

export default function AdminStatCard({ stat }: { stat: DashboardStat }) {
  const { icon: Icon, background } = appearance[stat.key];
  const TrendIcon = stat.trend?.direction === "down" ? ArrowDown : ArrowUp;
  return (
    <article className="flex min-h-26 min-w-0 items-center gap-3 rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
      <span aria-hidden="true" className={"flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white " + background}>
        <Icon className="h-6 w-6" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-5 text-slate-600">{stat.label}</p>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-1 text-xl font-bold leading-tight tracking-tight text-[#061B49]">
          <span className="min-w-0 break-words">{new Intl.NumberFormat("fr-FR").format(stat.value)}</span>
          {stat.unit === "XOF" && <span className="text-xs font-bold tracking-normal">FCFA</span>}
        </p>
        {stat.trend?.percentage != null && (
          <p className={"mt-2 flex flex-wrap items-center gap-1 text-xs " + (stat.trend.direction === "down" ? "text-red-600" : stat.trend.direction === "up" ? "text-emerald-600" : "text-slate-500")}>
            {stat.trend.direction !== "stable" && <TrendIcon aria-hidden="true" className="h-3.5 w-3.5" />}
            <span>{stat.trend.direction === "up" ? "+" : stat.trend.direction === "down" ? "−" : ""}{Math.abs(stat.trend.percentage).toLocaleString("fr-FR")}%</span>
            <span>sur la période</span>
          </p>
        )}
      </div>
    </article>
  );
}

