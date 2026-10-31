
import type { DashboardDonation } from "@/types/admin-dashboard";
import Link from "next/link";

const labels: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmé",
  FAILED: "Échoué",
  REFUNDED: "Remboursé",
  CANCELLED: "Annulé",
};

export default function RecentDonations({
  donations,
}: {
  donations: DashboardDonation[];
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold text-slate-900">
          Dons récents
        </h2>
      </div>

      {donations.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-slate-500">
          Aucun don enregistré.
        </p>
      ) : (
        <div className="divide-y divide-slate-100">
          {donations.map((donation) => (
            <article
              key={donation.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">
                  {donation.donorName?.trim() ||
                    "Donateur anonyme"}
                </p>
                <p className="mt-1 break-words text-xs text-slate-500">
                  <Link href={`/admin/demandes/${donation.campaignId}`} className="hover:text-blue-700 hover:underline">{donation.campaignTitle}</Link>
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {new Intl.DateTimeFormat("fr-FR", {
                    dateStyle: "medium",
                    timeZone: "Africa/Porto-Novo",
                  }).format(new Date(donation.createdAt))}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">
                  {new Intl.NumberFormat("fr-FR").format(
                    donation.amount,
                  )}{" "}
                  FCFA
                </p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-1 text-xs ${
                    donation.status === "CONFIRMED"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {labels[donation.status] ??
                    donation.status}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
