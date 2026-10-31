
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  DASHBOARD_PERIOD_OPTIONS,
  type DashboardPeriod,
} from "@/types/admin-dashboard";

export default function DashboardDateFilter({
  period,
}: {
  period: DashboardPeriod;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function changePeriod(value: string) {
    const params = new URLSearchParams(
      searchParams.toString(),
    );

    params.set("periode", value);
    router.push(`/admin?${params.toString()}`);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label
        htmlFor="dashboard-period"
        className="text-sm font-medium text-slate-600"
      >
        Période
      </label>

      <select
        id="dashboard-period"
        value={period}
        onChange={(event) =>
          changePeriod(event.target.value)
        }
        className="max-w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
      >
        {DASHBOARD_PERIOD_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
