import { currencyUnit } from "@/lib/campaigns/currencies";

type Props = {
  collectedAmount: number;
  targetAmount: number;
  currency?: string;
};

export default function CampaignProgress({
  collectedAmount,
  targetAmount,
  currency = "XOF",
}: Props) {
  const collected = Math.max(0, collectedAmount);
  const target = Math.max(0, targetAmount);
  const remaining = Math.max(0, target - collected);

  const percentage =
    target > 0
      ? Math.min(100, Math.max(0, (collected / target) * 100))
      : 0;

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(amount);

  const unit = currencyUnit(currency);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Montant récolté</p>
          <p className="mt-1 text-xl font-extrabold text-blue-700">
            {formatAmount(collected)} {unit}
          </p>
        </div>

        <p className="text-sm font-bold text-slate-700">
          {percentage.toFixed(1)} %
        </p>
      </div>

      <div
        role="progressbar"
        aria-label="Progression de la collecte"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Number(percentage.toFixed(1))}
        className="h-3 overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className="h-full rounded-full bg-blue-700 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-slate-500">Objectif</p>
          <p className="mt-1 font-bold text-slate-900">
            {formatAmount(target)} {unit}
          </p>
        </div>

        <div className="text-right">
          <p className="text-slate-500">Montant restant</p>
          <p className="mt-1 font-bold text-slate-900">
            {formatAmount(remaining)} {unit}
          </p>
        </div>
      </div>
    </div>
  );
}
