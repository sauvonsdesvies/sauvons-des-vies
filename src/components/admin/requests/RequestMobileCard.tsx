import { formatCfaAmount } from "@/lib/campaigns/currencies";

import Link from "next/link";
import RequestStatusBadge from "./RequestStatusBadge";
import RequestProgress from "./RequestProgress";
import RequestActions from "./RequestActions";
import type { RequestItem } from "@/types/request";

type Props = {
  item: RequestItem;
  onRefresh: () => Promise<void>;
};

const money = (value: number, currency: string) => (formatCfaAmount(value, currency, "fr-FR") ?? new Intl.NumberFormat("fr-FR", { style: "currency", currency, currencyDisplay: "code", maximumFractionDigits: 0 }).format(value));

export default function RequestMobileCard({
  item,
  onRefresh,
}: Props) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex gap-3">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
          {item.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <RequestStatusBadge status={item.status} />

          <Link
            href={`/admin/demandes/${item.id}`}
            className="mt-2 block break-words text-sm font-bold leading-5 text-[#092d5b]"
          >
            {item.title}
          </Link>

          <p className="mt-1 text-sm text-blue-600">
            {item.categoryName}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="font-bold text-blue-700">
            {money(item.collectedAmount, item.currency)}
          </p>
          <p className="text-slate-500">Collectés</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-[#092d5b]">
            {money(item.targetAmount, item.currency)}
          </p>
          <p className="text-slate-500">Objectif</p>
        </div>
      </div>

      <div className="mt-3">
        <RequestProgress percentage={item.percentage} />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-xs text-slate-500">
          {item.reference}
        </span>
        <RequestActions item={item} onRefresh={onRefresh} />
      </div>
    </article>
  );
}
