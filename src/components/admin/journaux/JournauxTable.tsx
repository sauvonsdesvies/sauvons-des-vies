"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";

import type { Journal } from "./JournauxPage";

import {
  categoryLabel,
  formatJournalDate,
  statusLabel,
} from "./JournauxPage";

type Props = {
  publications: Journal[];
  selectedId: string | null;
  onView: (id: string) => void;
  onEdit: (journal: Journal) => void;
  onDelete: (journal: Journal) => void;
  busy: boolean;
};

export default function JournauxTable({
  publications,
  selectedId,
  onView,
  onEdit,
  onDelete,
  busy,
}: Props) {
  return (
    <div className="min-w-0 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[790px] border-collapse text-left">
        <thead className="bg-slate-50 text-xs font-bold text-[#092d5b]">
          <tr>
            <th className="px-3 py-4">Article</th>
            <th className="px-3 py-4">Catégorie</th>
            <th className="px-3 py-4">
              Date de publication
            </th>
            <th className="px-3 py-4">Auteur</th>
            <th className="px-3 py-4">Statut</th>
            <th className="px-3 py-4">Visibilité</th>
            <th className="px-3 py-4">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {publications.map((journal) => {
            const published =
              journal.status === "PUBLISHED" &&
              !journal.archivedAt;

            return (
              <tr
                key={journal.id}
                className={`align-middle hover:bg-blue-50/40 ${
                  selectedId === journal.id
                    ? "bg-blue-50/30"
                    : ""
                }`}
              >
                <td className="px-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      {journal.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={journal.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="line-clamp-2 max-w-48 text-sm font-bold text-[#092d5b]">
                        {journal.title}
                      </p>

                      <p className="mt-1 line-clamp-2 max-w-48 text-sm text-slate-500">
                        {journal.shortDescription}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-3 py-3">
                  <span className="inline-block rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                    {categoryLabel(journal.category)}
                  </span>
                </td>

                <td className="px-3 py-3 text-xs text-slate-600">
                  {formatJournalDate(
                    journal.publicationDate ??
                      journal.createdAt
                  )}
                </td>

                <td className="px-3 py-3 text-xs text-slate-600">
                  {journal.authorName}
                </td>

                <td className="px-3 py-3">
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-semibold ${
                      published
                        ? "bg-green-100 text-green-700"
                        : journal.archivedAt
                          ? "bg-slate-200 text-slate-600"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {statusLabel(journal)}
                  </span>
                </td>

                <td className="px-3 py-3 text-xs text-slate-600">
                  {published ? "Public" : "Non public"}
                </td>

                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Voir"
                      aria-label={`Voir ${journal.title}`}
                      onClick={() => onView(journal.id)}
                      className="rounded-md border border-slate-200 p-2 text-blue-700 hover:bg-blue-50"
                    >
                      <Eye size={15} />
                    </button>

                    <button
                      type="button"
                      title="Modifier"
                      aria-label={`Modifier ${journal.title}`}
                      disabled={busy}
                      onClick={() => onEdit(journal)}
                      className="rounded-md border border-slate-200 p-2 text-blue-700 hover:bg-blue-50"
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      type="button"
                      title="Supprimer"
                      aria-label={`Supprimer ${journal.title}`}
                      disabled={busy}
                      onClick={() => onDelete(journal)}
                      className="rounded-md border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {publications.length === 0 && (
        <div className="px-4 py-12 text-center text-sm text-slate-500">
          Aucun journal ne correspond à votre recherche.
        </div>
      )}
    </div>
  );
}