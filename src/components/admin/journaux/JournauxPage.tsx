"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Archive,
  CheckCircle2,
  Clock3,
  FileText,
  Pencil,
  Plus,
  Search,
  X,
} from "lucide-react";

import JournauxTable from "./JournauxTable";
import JournauxMobileList from "./JournauxMobileList";

export type Journal = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  content: string;
  category: string;
  language: string;
  authorName: string;
  status: string;
  imageUrl: string | null;
  publicationDate: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  publications: Journal[];
  referenceTime: number;
};

const PAGE_SIZE = 5;

const categoryNames: Record<string, string> = {
  ACTION_REALISEE: "Action réalisée",
  PAIEMENT_HOPITAL: "Paiement à l'hôpital",
  REMISE_AIDE: "Remise d'aide",
  SUIVI_BENEFICIAIRE: "Suivi d'un bénéficiaire",
};

export function categoryLabel(value: string): string {
  return categoryNames[value] ?? value.replaceAll("_", " ");
}

export function statusLabel(journal: Journal): string {
  if (journal.archivedAt) return "Archivé";
  if (journal.status === "PUBLISHED") return "Publié";
  if (journal.status === "SCHEDULED") return "Programmé";
  return "Brouillon";
}

export function formatJournalDate(value: string | null): string {
  if (!value) return "Non définie";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Non définie";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function JournauxPage({ publications, referenceTime }: Props) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [author, setAuthor] = useState("");
  const [page, setPage] = useState(1);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Journal | null>(null);

  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editContent, setEditContent] = useState("");

  const [busy, setBusy] = useState(false);
  const mutationLock = useRef(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [updates, setUpdates] = useState<Record<string, Journal>>({});
  const journals = useMemo(() => publications.filter((item) => !removedIds.includes(item.id)).map((item) => {
    const updated = updates[item.id];
    return updated && updated.updatedAt > item.updatedAt ? updated : item;
  }), [publications, removedIds, updates]);

  const categories = useMemo(
    () => [...new Set(journals.map((item) => item.category))].sort(),
    [journals]
  );

  const authors = useMemo(
    () => [...new Set(journals.map((item) => item.authorName))].sort(),
    [journals]
  );

  const stats = useMemo(() => {
    const lastSevenDays = referenceTime - 7 * 24 * 60 * 60 * 1000;

    return {
      total: journals.length,

      published: journals.filter(
        (item) => item.status === "PUBLISHED" && !item.archivedAt
      ).length,

      drafts: journals.filter(
        (item) => item.status === "DRAFT" && !item.archivedAt
      ).length,

      recent: journals.filter(
        (item) =>
          new Date(item.updatedAt).getTime() >= lastSevenDays
      ).length,

      archived: journals.filter(
        (item) => Boolean(item.archivedAt)
      ).length,
    };
  }, [journals, referenceTime]);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("fr");

    return journals.filter((item) => {
      if (term) {
        const searchableText = [
          item.title,
          item.shortDescription,
          item.authorName,
          categoryLabel(item.category),
        ]
          .join(" ")
          .toLocaleLowerCase("fr");

        if (!searchableText.includes(term)) {
          return false;
        }
      }

      if (category && item.category !== category) {
        return false;
      }

      if (author && item.authorName !== author) {
        return false;
      }

      if (status === "ARCHIVED" && !item.archivedAt) {
        return false;
      }

      if (status && status !== "ARCHIVED") {
        if (item.archivedAt || item.status !== status) {
          return false;
        }
      }

      if (dateFilter) {
        const date = item.publicationDate ?? item.createdAt;

        if (date.slice(0, 10) !== dateFilter) {
          return false;
        }
      }

      return true;
    });
  }, [
    journals,
    search,
    category,
    status,
    dateFilter,
    author,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const selected =
    journals.find((item) => item.id === selectedId) ??
    filtered[0] ??
    null;

  const recent = journals.slice(0, 5);

  function changeFilter(
    setter: (value: string) => void,
    value: string
  ) {
    setter(value);
    setPage(1);
  }

  function openEditor(journal: Journal) {
    if (mutationLock.current) return;
    setError("");
    setMessage("");
    setEditing(journal);
    setEditTitle(journal.title);
    setEditSummary(journal.shortDescription);
    setEditContent(journal.content);
  }

  async function saveEdit() {
    if (!editing || mutationLock.current) return;

    mutationLock.current = true;
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/publications/${encodeURIComponent(editing.id)}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: editTitle,
            shortDescription: editSummary,
            content: editContent,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Modification impossible."
        );
      }

      setUpdates((current) => ({ ...current, [editing.id]: { ...editing, ...result.publication } }));
      setMessage("Publication modifiée avec succès.");
      setEditing(null);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Une erreur est survenue."
      );
    } finally {
      mutationLock.current = false;
      setBusy(false);
    }
  }

  async function deleteJournal(journal: Journal) {
    if (mutationLock.current) return;

    const confirmed = window.confirm(
      `Supprimer définitivement la publication « ${journal.title} » ?`
    );

    if (!confirmed) return;

    mutationLock.current = true;
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/publications/${encodeURIComponent(journal.id)}`,
        {
          method: "DELETE",
          credentials: "same-origin",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Suppression impossible."
        );
      }

      if (selectedId === journal.id) {
        setSelectedId(null);
      }
      setRemovedIds((current) => [...current, journal.id]);
      setMessage("Publication supprimée avec succès.");

      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Une erreur est survenue."
      );
    } finally {
      mutationLock.current = false;
      setBusy(false);
    }
  }

  const statistics = [
    {
      label: "Total des publications",
      value: stats.total,
      icon: FileText,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Publiées",
      value: stats.published,
      icon: CheckCircle2,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "Brouillons",
      value: stats.drafts,
      icon: Pencil,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Mises à jour récentes",
      value: stats.recent,
      icon: Clock3,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Archivées",
      value: stats.archived,
      icon: Archive,
      color: "text-slate-600 bg-slate-100",
    },
  ];

  const selectClass =
    "min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 outline-none focus:border-blue-600";

  return (
    <div className="w-full min-w-0 [overflow-wrap:anywhere]">
      {message && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-sm font-semibold uppercase text-slate-500">
            Contenu du site
          </p>

          <h1 className="text-2xl font-extrabold text-[#092d5b]">
            Tous les journaux publiés
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Liste de tous les articles, mises à jour et nouvelles
            publiés sur la plateforme.
          </p>
        </div>

        <Link
          href="/admin/dons"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
        >
          <Plus size={17} />
          Nouvelle publication
        </Link>
      </div>

      <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0">
          <section className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {statistics.map((stat, index) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className={`flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm ${
                    index === 4
                      ? "col-span-2 sm:col-span-1"
                      : ""
                  }`}
                >
                  <div
                    className={`rounded-full p-2 ${stat.color}`}
                  >
                    <Icon size={20} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xl font-extrabold text-[#092d5b]">
                      {stat.value}
                    </p>

                    <p className="text-sm leading-4 text-slate-500">
                      {stat.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="mb-4 rounded-xl border border-slate-100 bg-white p-3">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search
                  size={16}
                  className="absolute left-3 top-3 text-slate-400"
                />

                <input
                  aria-label="Rechercher un article"
                  placeholder="Rechercher un article..."
                  value={search}
                  onChange={(event) =>
                    changeFilter(
                      setSearch,
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-blue-600"
                />
              </div>

              <select
                aria-label="Filtrer par catégorie"
                className={selectClass}
                value={category}
                onChange={(event) =>
                  changeFilter(
                    setCategory,
                    event.target.value
                  )
                }
              >
                <option value="">
                  Toutes les catégories
                </option>

                {categories.map((item) => (
                  <option key={item} value={item}>
                    {categoryLabel(item)}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filtrer par statut"
                className={selectClass}
                value={status}
                onChange={(event) =>
                  changeFilter(
                    setStatus,
                    event.target.value
                  )
                }
              >
                <option value="">Tous les statuts</option>
                <option value="PUBLISHED">Publiées</option>
                <option value="DRAFT">Brouillons</option>
                <option value="SCHEDULED">
                  Programmées
                </option>
                <option value="ARCHIVED">Archivées</option>
              </select>

              <input
                type="date"
                aria-label="Filtrer par date"
                value={dateFilter}
                onChange={(event) =>
                  changeFilter(
                    setDateFilter,
                    event.target.value
                  )
                }
                className={selectClass}
              />

              <select
                aria-label="Filtrer par auteur"
                className={selectClass}
                value={author}
                onChange={(event) =>
                  changeFilter(
                    setAuthor,
                    event.target.value
                  )
                }
              >
                <option value="">Tous les auteurs</option>

                {authors.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {error && (
            <p
              role="alert"
              className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <div className="hidden lg:block">
            <JournauxTable
              publications={visible}
              selectedId={selected?.id ?? null}
              onView={setSelectedId}
              onEdit={openEditor}
              onDelete={(journal) =>
                void deleteJournal(journal)
              }
              busy={busy}
            />
          </div>

          <div className="lg:hidden">
            <JournauxMobileList
              publications={visible}
              onView={setSelectedId}
              onEdit={openEditor}
              onDelete={(journal) =>
                void deleteJournal(journal)
              }
              busy={busy}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              {filtered.length === 0
                ? "Aucun résultat"
                : `Affichage de ${
                    (currentPage - 1) * PAGE_SIZE + 1
                  } à ${Math.min(
                    currentPage * PAGE_SIZE,
                    filtered.length
                  )} sur ${filtered.length} résultats`}
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() =>
                  setPage(currentPage - 1)
                }
                className="rounded border border-slate-200 px-3 py-2 text-xs disabled:opacity-40"
              >
                Précédent
              </button>

              {Array.from(
                { length: totalPages },
                (_, index) => index + 1
              ).map((number) => (
                <button
                  key={number}
                  type="button"
                  onClick={() => setPage(number)}
                  aria-current={
                    currentPage === number
                      ? "page"
                      : undefined
                  }
                  className={`rounded px-3 py-2 text-xs ${
                    currentPage === number
                      ? "bg-blue-700 text-white"
                      : "border border-slate-200 bg-white"
                  }`}
                >
                  {number}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setPage(currentPage + 1)
                }
                className="rounded border border-slate-200 px-3 py-2 text-xs disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>

        <aside className="hidden min-w-0 space-y-4 2xl:block">
          <section className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-[#092d5b]">
              Aperçu de la publication
            </h2>

            {selected ? (
              <>
                <div className="aspect-video overflow-hidden rounded-lg bg-slate-100">
                  {selected.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selected.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <h3 className="mt-3 text-sm font-bold text-[#092d5b]">
                  {selected.title}
                </h3>

                <p className="mt-2 text-sm font-semibold text-blue-600">
                  {categoryLabel(selected.category)}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  {formatJournalDate(
                    selected.publicationDate ??
                      selected.createdAt
                  )}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Par {selected.authorName}
                </p>

                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-5 text-slate-600">
                  {selected.shortDescription}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedId(selected.id)
                  }
                  className="mt-4 w-full rounded-lg bg-blue-700 px-3 py-2.5 text-xs font-semibold text-white"
                >
                  Article sélectionné
                </button>
              </>
            ) : (
              <p className="text-sm text-slate-500">
                Aucune publication disponible.
              </p>
            )}
          </section>

          <section className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-[#092d5b]">
              Publications récentes
            </h2>

            <div className="space-y-3">
              {recent.map((journal) => (
                <button
                  key={journal.id}
                  type="button"
                  onClick={() =>
                    setSelectedId(journal.id)
                  }
                  className="flex w-full items-center gap-2 text-left"
                >
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded bg-slate-100">
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
                    <p className="line-clamp-2 text-sm font-semibold text-[#092d5b]">
                      {journal.title}
                    </p>

                    <p className="text-sm text-slate-500">
                      {formatJournalDate(
                        journal.createdAt
                      )}
                    </p>
                  </div>
                </button>
              ))}

              {recent.length === 0 && (
                <p className="text-sm text-slate-500">
                  Aucune publication récente.
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>

      {selectedId && selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Consulter une publication"
          className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/60 p-4"
        >
          <div className="mx-auto my-6 max-w-2xl rounded-xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label="Fermer"
              >
                <X size={22} />
              </button>
            </div>

            {selected.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.imageUrl}
                alt=""
                className="mb-4 aspect-video w-full rounded-lg object-cover"
              />
            )}

            <p className="text-sm font-semibold text-blue-600">
              {categoryLabel(selected.category)}
            </p>

            <h2 className="mt-2 text-2xl font-bold text-[#092d5b]">
              {selected.title}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {formatJournalDate(
                selected.publicationDate ??
                  selected.createdAt
              )}{" "}
              · {selected.authorName}
            </p>

            <p className="mt-5 font-semibold text-slate-700">
              {selected.shortDescription}
            </p>

            <div className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
              {selected.content}
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Modifier une publication"
          className="fixed inset-0 z-[110] overflow-y-auto bg-slate-950/60 p-4"
        >
          <form onSubmit={(event) => { event.preventDefault(); void saveEdit(); }} className="mx-auto my-6 w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#092d5b]">
                Modifier la publication
              </h2>

              <button
                type="button"
                disabled={busy}
                onClick={() => setEditing(null)}
                aria-label="Fermer"
              >
                <X size={22} />
              </button>
            </div>

            <fieldset disabled={busy} className="mt-5 min-w-0 space-y-4">
              <label className="block text-sm font-semibold">
                Titre

                <input
                  autoFocus
                  required
                  minLength={5}
                  value={editTitle}
                  maxLength={180}
                  onChange={(event) =>
                    setEditTitle(event.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 p-3"
                />
              </label>

              <label className="block text-sm font-semibold">
                Résumé

                <textarea
                  required
                  minLength={10}
                  value={editSummary}
                  maxLength={250}
                  rows={3}
                  onChange={(event) =>
                    setEditSummary(event.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 p-3"
                />
              </label>

              <label className="block text-sm font-semibold">
                Contenu

                <textarea
                  required
                  minLength={20}
                  value={editContent}
                  maxLength={30000}
                  rows={9}
                  onChange={(event) =>
                    setEditContent(event.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 p-3"
                />
              </label>
            </fieldset>

            {error && (
              <p
                role="alert"
                className="mt-3 text-sm text-red-600"
              >
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setEditing(null)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy
                  ? "Enregistrement..."
                  : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
