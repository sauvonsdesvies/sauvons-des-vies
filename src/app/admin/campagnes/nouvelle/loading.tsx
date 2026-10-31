
export default function Loading() {
  return (
    <main
      className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
      aria-busy="true"
      aria-label="Chargement du formulaire"
    >
      <div className="mb-8 space-y-3 animate-pulse">
        <div className="h-8 w-64 rounded-lg bg-slate-200" />
        <div className="h-4 w-96 max-w-full rounded bg-slate-100" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
          {[120, 100, 160, 110, 140].map((height, index) => (
            <div
              key={index}
              className="animate-pulse rounded-xl bg-slate-100"
              style={{ height }}
            />
          ))}
        </div>

        <div className="h-[480px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
      </div>
    </main>
  );
}
