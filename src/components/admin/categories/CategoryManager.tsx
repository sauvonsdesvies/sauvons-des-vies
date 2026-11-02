"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveCategory } from "@/app/admin/categories/actions";

type Category = { id: string; name: string; slug: string };

export default function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [id, setId] = useState<string>();
  const [name, setName] = useState("");
  const [feedback, setFeedback] = useState<{ success: boolean; message: string }>();
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setFeedback(undefined);
    startTransition(async () => {
      try {
        const result = await saveCategory({ id, name });
        setFeedback(result);
        if (result.success) { setId(undefined); setName(""); router.refresh(); }
      } catch { setFeedback({ success: false, message: "Connexion interrompue. Vérifiez la liste avant de réessayer." }); }
    });
  }

  return (
    <div className="w-full min-w-0 space-y-5 [overflow-wrap:anywhere]">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Catégories</h1><p className="mt-2 text-sm text-slate-600">Gérez les catégories proposées lors de la création d’une collecte.</p></div>
        <Link href="/admin/campagnes/nouvelle" className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white">Nouvelle collecte</Link>
      </header>
      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <form onSubmit={submit} className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">{id ? "Modifier une catégorie" : "Ajouter une catégorie"}</h2>
          <div><label htmlFor="category-name" className="text-sm font-medium">Nom de la catégorie</label>
            <input ref={input} id="category-name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} disabled={pending} className="mt-2 w-full min-w-0 rounded-xl border border-slate-300 px-3 py-3 text-sm focus:outline-blue-600" />
          </div>
          {feedback && <p role={feedback.success ? "status" : "alert"} className={`text-sm ${feedback.success ? "text-green-700" : "text-red-700"}`}>{feedback.message}</p>}
          <div className="flex flex-wrap gap-3">
            <button disabled={pending} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Enregistrement..." : "Enregistrer"}</button>
            {id && <button type="button" disabled={pending} onClick={() => { setId(undefined); setName(""); setFeedback(undefined); }} className="rounded-xl border border-slate-300 px-4 py-3 text-sm">Annuler</button>}
          </div>
        </form>
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 font-semibold">Catégories enregistrées ({categories.length})</h2>
          {!categories.length ? <p className="text-sm text-slate-600">Aucune catégorie enregistrée. Ajoutez une catégorie avec le formulaire.</p> :
            <ul className="divide-y divide-slate-100">{categories.map((category) => <li key={category.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="min-w-0 flex-1"><p className="font-medium">{category.name}</p><p className="mt-1 text-sm text-slate-500">{category.slug}</p></div>
              <button type="button" disabled={pending} aria-label={`Modifier ${category.name}`} onClick={() => { setId(category.id); setName(category.name); setFeedback(undefined); input.current?.focus(); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-blue-700 disabled:opacity-60">Modifier</button>
            </li>)}</ul>}
        </section>
      </div>
    </div>
  );
}
