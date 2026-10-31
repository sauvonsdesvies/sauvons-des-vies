
import type {
  DashboardAidRequest,
} from "@/types/admin-dashboard";
import Link from "next/link";

interface RecentRequestsProps {
  requests: DashboardAidRequest[];
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  VERIFYING: "En vérification",
  PUBLISHED: "Publiée",
  CLOSED: "Clôturée",
  SUSPENDED: "Suspendue",
  PENDING: "En attente",
  IN_REVIEW: "En vérification",
  APPROVED: "Approuvée",
  REJECTED: "Refusée",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};

function getStatusClasses(status: string): string {
  switch (status) {
    case "APPROVED":
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700";

    case "PENDING":
      return "bg-amber-50 text-amber-700";

    case "IN_REVIEW":
      return "bg-blue-50 text-blue-700";

    case "REJECTED":
    case "CANCELLED":
      return "bg-rose-50 text-rose-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date indisponible";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeZone: "Africa/Porto-Novo",
  }).format(date);
}

export default function RecentRequests({
  requests,
}: RecentRequestsProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-slate-900">
          Dernières demandes d&apos;aide
        </h2>
        <Link href="/admin/demandes" className="shrink-0 text-xs font-semibold text-blue-600 hover:underline">Voir toutes</Link>

        <p className="mt-1 text-sm text-slate-500">
          Dossiers récemment enregistrés
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="flex min-h-48 items-center justify-center px-5 py-10">
          <p className="text-center text-sm text-slate-500">
            Aucune demande d&apos;aide enregistrée.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {requests.map((request) => (
            <article
              key={request.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
            >
              <div className="min-w-0 flex-1">
                <h3 className="break-words text-sm font-semibold text-slate-900">
                  <Link href={`/admin/demandes/${request.id}`} className="hover:text-blue-700 hover:underline">{request.title}</Link>
                </h3>

                <p className="mt-1 break-all text-xs text-slate-500">
                  Référence : {request.reference}
                </p>

                <time
                  dateTime={request.createdAt}
                  className="mt-2 block text-xs text-slate-400"
                >
                  {formatDate(request.createdAt)}
                </time>
              </div>

              <div className="flex shrink-0 items-center">
                <span
                  className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                    request.status,
                  )}`}
                >
                  {STATUS_LABELS[request.status] ??
                    request.status}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
