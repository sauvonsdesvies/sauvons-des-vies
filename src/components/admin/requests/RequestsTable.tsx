
"use client";

import Link from "next/link";
import RequestStatusBadge from "./RequestStatusBadge";
import RequestProgress from "./RequestProgress";
import RequestActions from "./RequestActions";
import type { RequestItem } from "@/types/request";

type Props = {
  items: RequestItem[];
  onRefresh: () => Promise<void>;
};

const money = (value: number, currency: string) => new Intl.NumberFormat("fr-FR", { style: "currency", currency, currencyDisplay: "code", maximumFractionDigits: 0 }).format(value);

function date(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function RequestsTable({ items, onRefresh }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
        Aucune demande enregistrée pour ces filtres.
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[1020px] border-collapse text-left text-xs">
        <thead className="bg-slate-50 text-[#092d5b]">
          <tr>
            {[
              "#ID", "Photo", "Titre de la demande", "Catégorie",
              "Objectif", "Collecté", "Reste",
              "Progression", "Statut", "Date de lancement",
              "Date de fin", "Actions",
            ].map((heading) => (
              <th
                key={heading}
                scope="col"
                className="border-b border-slate-200 px-3 py-3 font-bold"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-3 py-3 font-semibold">{item.reference}</td>
              <td className="px-3 py-3">
                <div className="h-10 w-10 overflow-hidden rounded-lg bg-slate-100">
                  {item.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              </td>
              <td className="max-w-48 px-3 py-3">
                <Link
                  href={`/admin/demandes/${item.id}`}
                  className="font-semibold text-[#092d5b] hover:underline"
                >
                  {item.title}
                </Link>
              </td>
              <td className="px-3 py-3">{item.categoryName}</td>
              <td className="px-3 py-3 font-semibold">{money(item.targetAmount, item.currency)}</td>
              <td className="px-3 py-3">{money(item.collectedAmount, item.currency)}</td>
              <td className="px-3 py-3">{money(item.remainingAmount, item.currency)}</td>
              <td className="min-w-24 px-3 py-3">
                <RequestProgress percentage={item.percentage} />
              </td>
              <td className="px-3 py-3">
                <RequestStatusBadge status={item.status} />
              </td>
              <td className="px-3 py-3">{date(item.startDate)}</td>
              <td className="px-3 py-3">{date(item.endDate)}</td>
              <td className="px-3 py-3">
                <RequestActions item={item} onRefresh={onRefresh} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
