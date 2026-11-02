"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, LoaderCircle } from "lucide-react";
import PublicationEditor from "./PublicationEditor";

import type { PublicationSummary } from "@/types/publication";

type Props = {
  publications: PublicationSummary[];
};

type Edition = { id: string; title: string; shortDescription: string; content: string };
type PublicationResponse = { error?: string; success?: boolean; publication?: Edition };

const statusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  SCHEDULED: "Programmé",
};

export default function RecentPublications({
  publications,
}: Props) {
  const router = useRouter();
  const lock = useRef(false);
  const originalText = useRef("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Edition | null>(null);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const visible = publications.filter(item => !removedIds.includes(item.id));

  function canCloseEditor() {
    return !editing || JSON.stringify(editing) === originalText.current || window.confirm("Abandonner les modifications non enregistrées ?");
  }

  async function request(url: string, options: RequestInit = {}) {
    const response = await fetch(url, { credentials: "same-origin", cache: "no-store", ...options });
    const result: PublicationResponse = await response.json();
    if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Impossible de terminer l’opération.");
    return result;
  }

  async function perform(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try { await action(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Une erreur est survenue."); }
    finally { lock.current = false; setBusy(false); }
  }

  async function editPublication(id: string) {
    if (lock.current || !canCloseEditor()) return;
    await perform(async () => {
      const result = await request(`/api/admin/publications/${encodeURIComponent(id)}`);
      const publication = result.publication;
      if (!publication || publication.id !== id || [publication.title, publication.shortDescription, publication.content].some(value => typeof value !== "string")) throw new Error("Les informations de la publication sont indisponibles.");
      const edition = { id, title: publication.title, shortDescription: publication.shortDescription, content: publication.content };
      originalText.current = JSON.stringify(edition);
      setEditing(edition);
    });
  }

  async function savePublication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const edition = editing;
    await perform(async () => {
      const result = await request(`/api/admin/publications/${encodeURIComponent(edition.id)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: edition.title, shortDescription: edition.shortDescription, content: edition.content }),
      });
      const updated = result.publication;
      if (!updated || updated.id !== edition.id || typeof updated.title !== "string") throw new Error("La modification n’a pas pu être confirmée.");
      setTitles(current => ({ ...current, [edition.id]: updated.title }));
      setEditing(null);
      setMessage("Publication modifiée avec succès.");
      router.refresh();
    });
  }

  async function removePublication(publication: PublicationSummary) {
    if (lock.current || !window.confirm(`Supprimer définitivement la publication « ${titles[publication.id] ?? publication.title} » ? Cette action est irréversible.`)) return;
    await perform(async () => {
      const result = await request(`/api/admin/publications/${encodeURIComponent(publication.id)}`, { method: "DELETE" });
      if (result.success !== true) throw new Error("La suppression n’a pas pu être confirmée.");
      setRemovedIds(current => [...current, publication.id]);
      if (editing?.id === publication.id) setEditing(null);
      setMessage("Publication supprimée avec succès.");
      router.refresh();
    });
  }

  return (
    <section aria-busy={busy} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-blue-50 px-4 py-3">
        <h2 className="text-sm font-bold text-[#092d5b]">
          Publications récentes
        </h2>
        <Link href="/admin/journaux" className="text-sm font-semibold text-blue-700 hover:underline">Tout gérer</Link>
      </header>

      {error && <p role="alert" className="m-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="m-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
      {busy && <p role="status" className="flex items-center gap-2 px-3 pt-3 text-sm text-slate-600"><LoaderCircle size={14} className="animate-spin" aria-hidden="true" />Opération en cours…</p>}

      {visible.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-slate-500">
          Aucune publication enregistrée.
        </p>
      ) : (
        <div className="divide-y divide-slate-100">
          {visible.map((publication) => (
            <article
              key={publication.id}
              className="flex flex-wrap items-start gap-3 p-3"
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {publication.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={publication.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-bold text-[#092d5b]">
                  {titles[publication.id] ?? publication.title}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {new Intl.DateTimeFormat("fr-FR").format(
                    new Date(publication.createdAt)
                  )}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                  publication.status === "PUBLISHED"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {statusLabels[publication.status] || publication.status}
              </span>
              <div className="flex w-full flex-wrap items-center justify-end gap-2">
                <button type="button" disabled={busy} onClick={() => void editPublication(publication.id)} aria-label={`Modifier la publication : ${titles[publication.id] ?? publication.title}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-blue-200 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"><Pencil size={14} aria-hidden="true" />Modifier</button>
                <button type="button" disabled={busy} onClick={() => void removePublication(publication)} aria-label={`Supprimer la publication : ${titles[publication.id] ?? publication.title}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"><Trash2 size={14} aria-hidden="true" />Supprimer</button>
              </div>
            </article>
          ))}
        </div>
      )}
      {editing && (
        <form onSubmit={event => void savePublication(event)} className="border-t border-slate-200 bg-slate-50 p-3 sm:p-4">
          <fieldset disabled={busy} className="min-w-0 space-y-3">
            <legend className="mb-3 text-sm font-bold text-[#092d5b]">Modifier la publication</legend>
            <div>
              <label htmlFor={`recent-title-${editing.id}`} className="text-sm font-semibold text-slate-700">Titre</label>
              <input autoFocus id={`recent-title-${editing.id}`} required minLength={5} maxLength={180} value={editing.title} onChange={event => setEditing({ ...editing, title: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900" />
            </div>
            <div>
              <label htmlFor={`recent-summary-${editing.id}`} className="text-sm font-semibold text-slate-700">Résumé court</label>
              <textarea id={`recent-summary-${editing.id}`} required minLength={10} maxLength={250} rows={4} value={editing.shortDescription} onChange={event => setEditing({ ...editing, shortDescription: event.target.value })} className="mt-1 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900" />
              <p className="mt-1 text-right text-sm text-slate-500">{editing.shortDescription.length}/250</p>
            </div>
            <PublicationEditor id={`recent-content-${editing.id}`} value={editing.content} onChange={content => setEditing({ ...editing, content })} />
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => { if (canCloseEditor()) setEditing(null); }} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-600">Annuler</button>
              <button type="submit" className="min-h-10 rounded-lg bg-blue-700 px-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Enregistrement…" : "Enregistrer les modifications"}</button>
            </div>
          </fieldset>
        </form>
      )}
    </section>
  );
}
