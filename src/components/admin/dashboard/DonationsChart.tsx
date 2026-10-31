
import type { DashboardDonationPoint } from "@/types/admin-dashboard";

const formatMoney = (value: number) =>
  `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;

export default function DonationsChart({
  data,
}: {
  data: DashboardDonationPoint[];
}) {
  const width = 680;
  const height = 240;
  const left = 58;
  const right = 20;
  const top = 20;
  const bottom = 42;

  const maxAmount = Math.max(
    1,
    ...data.map((item) => item.amount),
  );

  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const points = data.map((item, index) => {
    const x =
      left +
      (data.length === 1
        ? plotWidth / 2
        : (index / (data.length - 1)) * plotWidth);

    const y =
      top + plotHeight * (1 - item.amount / maxAmount);

    return { x, y, item };
  });

  const line = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`,
    )
    .join(" ");

  const area =
    points.length > 0
      ? `${line} L ${points[points.length - 1].x} ${
          height - bottom
        } L ${points[0].x} ${height - bottom} Z`
      : "";

  const total = data.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-slate-900">
          Évolution des dons
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Montants confirmés sur la période sélectionnée
        </p>
        <p className="mt-3 text-xl font-bold text-slate-900">
          {formatMoney(total)}
        </p>
      </div>

      {data.length === 0 ? (
        <div className="flex min-h-52 items-center justify-center rounded-xl bg-slate-50 px-4 text-center text-sm text-slate-500">
          Aucun don confirmé pour cette période.
        </div>
      ) : (
        <>
          <div className="w-full min-w-0">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              role="img"
              aria-label="Graphique des montants des dons confirmés par date"
              className="block h-auto w-full max-w-full"
            >
              <defs>
                <linearGradient
                  id="donations-area-gradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#2563eb"
                    stopOpacity="0.2"
                  />
                  <stop
                    offset="100%"
                    stopColor="#2563eb"
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>

              {[0, 0.25, 0.5, 0.75, 1].map(
                (fraction) => {
                  const y =
                    top + plotHeight * (1 - fraction);

                  return (
                    <g key={fraction}>
                      <line
                        x1={left}
                        x2={width - right}
                        y1={y}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={left - 9}
                        y={y + 4}
                        textAnchor="end"
                        fontSize="10"
                        fill="#64748b"
                      >
                        {new Intl.NumberFormat("fr-FR", {
                          notation: "compact",
                          maximumFractionDigits: 1,
                        }).format(maxAmount * fraction)}
                      </text>
                    </g>
                  );
                },
              )}

              {area && (
                <path
                  d={area}
                  fill="url(#donations-area-gradient)"
                />
              )}

              {line && (
                <path
                  d={line}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}

              {points.map(({ x, y, item }) => (
                <circle
                  key={item.date}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#2563eb"
                  stroke="white"
                  strokeWidth="2"
                >
                  <title>
                    {`${item.date} : ${formatMoney(
                      item.amount,
                    )}`}
                  </title>
                </circle>
              ))}

              {points
                .filter(
                  (_, index) =>
                    index === 0 ||
                    index === points.length - 1 ||
                    index %
                      Math.max(
                        1,
                        Math.ceil(points.length / 5),
                      ) ===
                      0,
                )
                .map(({ x, item }) => (
                  <text
                    key={item.date}
                    x={x}
                    y={height - 15}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#64748b"
                  >
                    {item.date.slice(5)}
                  </text>
                ))}
            </svg>
          </div>
        </>
      )}
    </section>
  );
}
