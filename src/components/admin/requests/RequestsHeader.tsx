
import Link from "next/link";

export default function RequestsHeader() {
  return (
    <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#092d5b] sm:text-3xl">
          Toutes les demandes de don
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Suivez et gérez les demandes de collecte de fonds soumises
          à la fondation.
        </p>
      </div>

      <Link
        href="/admin/demandes/nouvelle"
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
      >
        <span aria-hidden="true" className="text-xl leading-none">+</span>
        Nouvelle demande
      </Link>
    </header>
  );
}
