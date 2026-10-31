
"use client";

import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: Props) {
  useEffect(() => {
    console.error("Erreur de la page de création de collecte :", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4 py-10">
      <div
        role="alert"
        className="w-full rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm"
      >
        <h1 className="text-xl font-bold text-slate-900">
          Impossible de charger cette page
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Une erreur est survenue lors de l&apos;affichage du formulaire.
          Aucune collecte n&apos;a été enregistrée par cette page.
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800"
        >
          Réessayer
        </button>
      </div>
    </main>
  );
}
