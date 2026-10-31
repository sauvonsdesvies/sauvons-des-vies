
export default function Loading() {
  return (
    <div
      className="w-full min-w-0"
      aria-label="Chargement de la page de publication"
      aria-busy="true"
    >
      <div className="mb-6 animate-pulse space-y-3">
        <div className="h-9 w-96 max-w-full rounded-lg bg-slate-200" />
        <div className="h-4 w-full max-w-2xl rounded bg-slate-100" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="h-6 w-60 animate-pulse rounded bg-slate-200" />
          <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-48 animate-pulse rounded-lg bg-slate-100" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
          </div>
          <div className="h-28 animate-pulse rounded-lg bg-slate-100" />
        </div>

        <div className="hidden space-y-5 xl:block">
          <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
