
"use client";

type Props = {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export default function RequestsPagination({
  page,
  total,
  pageSize,
  onPageChange,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(total, page * pageSize);

  return (
    <nav
      aria-label="Pagination des demandes"
      className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
    >
      <p className="text-xs text-slate-600">
        Affichage de {first} à {last} sur {total} demandes
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs disabled:opacity-40"
        >
          Précédent
        </button>

        <span className="text-xs font-semibold text-[#092d5b]">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs disabled:opacity-40"
        >
          Suivant
        </button>
      </div>
    </nav>
  );
}
