
export default function RequestProgress({
  percentage,
}: {
  percentage: number;
}) {
  const value = Number.isFinite(percentage)
    ? Math.min(100, Math.max(0, percentage))
    : 0;

  return (
    <div className="flex items-center gap-2">
      <div
        role="progressbar"
        aria-label="Progression de la collecte"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value)}
        className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200"
      >
        <div
          className={`h-full rounded-full ${
            value >= 80 ? "bg-emerald-500" : "bg-blue-500"
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs font-semibold text-slate-600">
        {Math.round(value)}%
      </span>
    </div>
  );
}
