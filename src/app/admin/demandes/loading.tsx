
export default function Loading() {
  return (
    <main
      className="w-full min-w-0 px-4 py-6 sm:px-6"
      aria-busy="true"
      aria-label="Chargement des demandes"
    >
      <div className="mb-6 animate-pulse space-y-3">
        <div className="h-8 w-72 max-w-full rounded-lg bg-slate-200" />
        <div className="h-4 w-96 max-w-full rounded bg-slate-100" />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
          />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
        <div className="space-y-4">
          <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-96 animate-pulse rounded-xl bg-slate-100" />
        </div>
        <div className="h-96 animate-pulse rounded-xl bg-slate-100" />
      </div>
    </main>
  );
}
