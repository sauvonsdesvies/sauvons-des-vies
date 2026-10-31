
import Link from "next/link";
import { countryName } from "@/lib/countries";
import RequestStatusBadge from "./RequestStatusBadge";
import RequestProgress from "./RequestProgress";
import type { RequestItem } from "@/types/request";

export default function RequestDetail({ item }: { item: RequestItem }) {
  const money = (value: number) =>
    `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;

  return (
    <div className="w-full min-w-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin/demandes" className="text-sm text-blue-700">
            Retour aux demandes
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-[#092d5b]">
            Détail de la demande
          </h1>
          <p className="mt-1 text-sm text-slate-500">{item.reference}</p>
        </div>

        <Link
          href={`/admin/demandes/${item.id}/modifier`}
          className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white"
        >
          Modifier
        </Link>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {item.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl}
              alt=""
              className="aspect-video w-full object-cover"
            />
          )}

          <div className="space-y-5 p-5 sm:p-7">
            <RequestStatusBadge status={item.status} />
            {item.countryCode && <p className="text-sm text-slate-600">Pays : {countryName(item.countryCode)}</p>}
            {item.isUrgent && <p className="text-sm font-bold text-red-700">Collecte urgente</p>}

            <h2 className="text-2xl font-bold text-[#092d5b]">
              {item.title}
            </h2>

            <p className="text-sm font-semibold text-blue-700">
              {item.categoryName}
            </p>

            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {item.shortDescription}
            </p>

            <h3 className="text-lg font-bold">Description complète</h3>

            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {item.description}
            </p>
          </div>
        </article>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="mb-5 font-bold text-[#092d5b]">
            Suivi de la collecte
          </h3>

          <RequestProgress percentage={item.percentage} />

          <dl className="mt-6 space-y-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Objectif</dt>
              <dd className="font-bold">{money(item.targetAmount)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Collecté</dt>
              <dd className="font-bold text-emerald-700">
                {money(item.collectedAmount)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Restant</dt>
              <dd className="font-bold">{money(item.remainingAmount)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
