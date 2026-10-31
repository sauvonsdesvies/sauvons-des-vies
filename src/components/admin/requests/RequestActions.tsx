
"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { RequestItem } from "@/types/request";

type Props = {
  item: RequestItem;
  onRefresh: () => Promise<void>;
};

export default function RequestActions({ item, onRefresh }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const locked = useRef(false);
  async function remove() {
    if (locked.current || !window.confirm(`Supprimer définitivement « ${item.title} » ?`)) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/requests/${encodeURIComponent(item.id)}`, { method: "DELETE", credentials: "same-origin" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Suppression impossible.");
      await onRefresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Suppression impossible."); }
    finally { locked.current = false; setBusy(false); }
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/admin/demandes/${item.id}`}
        aria-label={`Consulter ${item.title}`}
        title="Consulter"
        className="rounded-md border border-slate-200 px-2 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
      >
        Voir
      </Link>
      <Link
        href={`/admin/demandes/${item.id}/modifier`}
        aria-label={`Modifier ${item.title}`}
        title="Modifier"
        className="rounded-md border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
      >
        Modifier
      </Link>
      <button type="button" disabled={busy} onClick={() => void remove()} className="rounded-md border border-red-200 px-2 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50">{busy ? "Suppression…" : "Supprimer"}</button>
      {error && <p role="alert" className="w-full max-w-xs whitespace-normal text-xs text-red-700">{error}</p>}
    </div>
  );
}
