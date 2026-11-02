
"use client";

import type { RequestItem, RequestStatus } from "@/types/request";

type Props = {
  categories: { id: string; name: string }[];
  category: string;
  status: RequestStatus | "";
  period: string;
  items: RequestItem[];
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: RequestStatus | "") => void;
  onPeriodChange: (value: string) => void;
};

export default function RequestsFilters({
  categories,
  category,
  status,
  period,
  items,
  onCategoryChange,
  onStatusChange,
  onPeriodChange,
}: Props) {
  function exportCurrentPage() {
    const header = [
      "Référence", "Titre", "Catégorie", "Objectif",
      "Collecté", "Devise", "Statut", "Date de lancement", "Date de fin",
    ];

    const rows = items.map((item) => [
      item.reference,
      item.title,
      item.categoryName,
      String(item.targetAmount),
      String(item.collectedAmount),
      item.currency, item.status,
      item.startDate ?? "",
      item.endDate ?? "",
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "demandes-de-don.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const selectClass =
    "min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-600";

  return (
    <div className="mb-3 space-y-3">
      <div className="hidden flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 lg:flex">
        <select
          aria-label="Filtrer par catégorie"
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
          className={selectClass}
        >
          <option value="">Toutes les catégories</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>

        <select
          aria-label="Filtrer par statut"
          value={status}
          onChange={(event) =>
            onStatusChange(event.target.value as RequestStatus | "")
          }
          className={selectClass}
        >
          <option value="">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="VERIFYING">En vérification</option>
          <option value="PUBLISHED">Publiées</option>
          <option value="CLOSED">Clôturées</option>
          <option value="DRAFT">Brouillons</option>
          <option value="SUSPENDED">Suspendues</option>
          <option value="REJECTED">Rejetées</option>
        </select>

        <select
          aria-label="Filtrer par période"
          value={period}
          onChange={(event) => onPeriodChange(event.target.value)}
          className={selectClass}
        >
          <option value="all">Toutes les dates</option>
          <option value="month">Ce mois</option>
          <option value="year">Cette année</option>
        </select>

        <button
          type="button"
          onClick={exportCurrentPage}
          disabled={items.length === 0}
          className="ml-auto rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-40"
        >
          Exporter
        </button>
      </div>

      <div className="flex flex-wrap gap-2 lg:hidden">
        {[
          { value: "", label: "Tous" },
          { value: "PENDING", label: "En attente" },
          { value: "PUBLISHED", label: "Publiées" },
          { value: "VERIFYING", label: "Vérification" },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onStatusChange(item.value as RequestStatus | "")}
            className={`rounded-lg px-3 py-2 text-xs font-semibold ${
              status === item.value
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
