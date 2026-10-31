
import type {
  DashboardCategoryPoint,
} from "@/types/admin-dashboard";

interface DonationsCategoryChartProps {
  data: DashboardCategoryPoint[];
}

const COLORS = [
  "#2563eb",
  "#0d9488",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
];

const formatAmount = (value: number): string => {
  return new Intl.NumberFormat("fr-FR").format(value);
};

export default function DonationsCategoryChart({
  data,
}: DonationsCategoryChartProps) {
  const validData = data.filter(
    (item) =>
      Number.isFinite(item.amount) &&
      item.amount > 0,
  );

  const total = validData.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  const segments = validData.map((item, index) => {
    const percentage =
      total > 0 ? (item.amount / total) * 100 : 0;

    const start = validData.slice(0, index).reduce(
      (sum, previous) => sum + (previous.amount / total) * 100,
      0,
    );

    return {
      ...item,
      percentage,
      start,
      end: start + percentage,
      color: COLORS[index % COLORS.length],
    };
  });

  const gradient = segments
    .map(
      (segment) =>
        `${segment.color} ${segment.start}% ${segment.end}%`,
    )
    .join(", ");

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900">
          Dons par catégorie
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Répartition des dons confirmés
        </p>
      </div>

      {total === 0 ? (
        <div className="mt-5 flex min-h-56 items-center justify-center rounded-xl bg-slate-50 p-5 text-center">
          <p className="text-sm text-slate-500">
            Aucun don confirmé pour cette période.
          </p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center gap-6">
          <div
            role="img"
            aria-label="Répartition des dons confirmés par catégorie"
            className="flex h-44 w-44 shrink-0 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(${gradient})`,
            }}
          >
            <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white text-center">
              <span className="text-xs text-slate-500">
                Total
              </span>

              <strong className="px-2 text-base font-bold text-slate-900">
                {new Intl.NumberFormat("fr-FR", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(total)}
              </strong>

              <span className="text-xs text-slate-500">
                FCFA
              </span>
            </div>
          </div>

          <div className="w-full space-y-4">
            {segments.map((segment) => (
              <div
                key={segment.categoryId}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{
                      backgroundColor: segment.color,
                    }}
                  />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-700">
                      {segment.categoryName}
                    </p>

                    <p className="text-xs text-slate-500">
                      {formatAmount(segment.amount)} FCFA
                    </p>
                  </div>
                </div>

                <span className="shrink-0 text-sm font-semibold text-slate-900">
                  {segment.percentage.toLocaleString(
                    "fr-FR",
                    {
                      maximumFractionDigits: 1,
                    },
                  )}
                  %
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
