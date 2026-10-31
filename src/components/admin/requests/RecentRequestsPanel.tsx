
import Link from "next/link";
import RequestStatusBadge from "./RequestStatusBadge";
import RequestProgress from "./RequestProgress";
import type { RequestItem } from "@/types/request";

export default function RecentRequestsPanel({
  items,
}: {
  items: RequestItem[];
}) {
  const money = (amount: number) =>
    new Intl.NumberFormat("fr-FR").format(amount);

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-[#092d5b]">
          Demandes récentes
        </h2>
        <Link
          href="/admin/demandes"
          className="text-xs font-semibold text-blue-600"
        >
          Voir tout
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center text-xs text-slate-500">
          Aucune demande récente.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-lg border border-slate-200 p-3"
            >
              <div className="flex gap-2">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {item.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/admin/demandes/${item.id}`}
                    className="line-clamp-3 text-xs font-bold text-[#092d5b]"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-1 text-xs text-blue-600">
                    {item.categoryName}
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <RequestProgress percentage={item.percentage} />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-1 text-[10px]">
                <div>
                  <p className="text-slate-500">Objectif</p>
                  <p className="font-bold">{money(item.targetAmount)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Collecté</p>
                  <p className="font-bold text-emerald-700">
                    {money(item.collectedAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Reste</p>
                  <p className="font-bold">{money(item.remainingAmount)}</p>
                </div>
              </div>

              <div className="mt-3">
                <RequestStatusBadge status={item.status} />
              </div>
            </article>
          ))}
        </div>
      )}
    </aside>
  );
}
