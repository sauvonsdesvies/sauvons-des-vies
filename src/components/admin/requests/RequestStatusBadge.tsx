
import type { RequestStatus } from "@/types/request";

const styles: Record<RequestStatus, { label: string; className: string }> = {
  PENDING: {
    label: "En attente",
    className: "bg-amber-100 text-amber-800",
  },
  VERIFYING: {
    label: "En vérification",
    className: "bg-sky-100 text-sky-800",
  },
  PUBLISHED: {
    label: "Publiée",
    className: "bg-emerald-100 text-emerald-800",
  },
  CLOSED: {
    label: "Clôturée",
    className: "bg-slate-200 text-slate-700",
  },
  DRAFT: {
    label: "Brouillon",
    className: "bg-slate-100 text-slate-700",
  },
  SUSPENDED: {
    label: "Suspendue",
    className: "bg-orange-100 text-orange-800",
  },
  REJECTED: {
    label: "Rejetée",
    className: "bg-red-100 text-red-800",
  },
};

export default function RequestStatusBadge({
  status,
}: {
  status: RequestStatus;
}) {
  const item = styles[status];

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.className}`}
    >
      {item.label}
    </span>
  );
}
