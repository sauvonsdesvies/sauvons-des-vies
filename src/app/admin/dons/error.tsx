
"use client";

import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function PublicationError({ error, reset }: Props) {
  useEffect(() => {
    console.error("Erreur de la page de publication :", error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <section
        role="alert"
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm"
      >
        <h1 className="text-xl font-bold text-[#092d5b]">
          Impossible de charger la page
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Une erreur est survenue pendant le chargement de la page de
          publication. Veuillez réessayer.
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Réessayer
        </button>
      </section>
    </main>
  );
}
