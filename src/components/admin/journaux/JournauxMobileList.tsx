"use client";

import {
  CalendarDays,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";

import type { Journal } from "./JournauxPage";

import {
  categoryLabel,
  formatJournalDate,
  statusLabel,
} from "./JournauxPage";

type Props = {
  publications: Journal[];
  onView: (id: string) => void;
  onEdit: (journal: Journal) => void;
  onDelete: (journal: Journal) => void;
  busy: boolean;
};

export default function JournauxMobileList({
  publications,
  onView,
  onEdit,
  onDelete,
  busy,
}: Props) {
  if (publications.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Aucun journal disponible.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {publications.map((journal) => {
        const published =
          journal.status === "PUBLISHED" &&
          !journal.archivedAt;

        return (
          <article
            key={journal.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
          >
            <div className="flex gap-3">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {journal.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={journal.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="line-clamp-2 text-sm font-extrabold leading-5 text-[#092d5b]">
                  {journal.title}
                </h2>

                <span className="mt-2 inline-block rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                  {categoryLabel(journal.category)}
                </span>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays size={12} />

                    {formatJournalDate(
                      journal.publicationDate ??
                        journal.createdAt
                    )}
                  </span>

                  <span
                    className={`rounded px-2 py-0.5 font-semibold ${
                      published
                        ? "bg-green-100 text-green-700"
                        : journal.archivedAt
                          ? "bg-slate-200 text-slate-600"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {statusLabel(journal)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => onView(journal.id)}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-2 py-2 text-xs font-semibold text-[#092d5b]"
              >
                <Eye size={14} />
                Voir
              </button>

              <button
                type="button"
                disabled={busy}
                      onClick={() => onEdit(journal)}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-2 py-2 text-xs font-semibold text-[#092d5b]"
              >
                <Pencil size={14} />
                Modifier
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => onDelete(journal)}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 px-2 py-2 text-xs font-semibold text-red-600 disabled:opacity-50"
              >
                <Trash2 size={14} />
                Supprimer
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}