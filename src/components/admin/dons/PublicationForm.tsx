
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PublicationEditor from "./PublicationEditor";
import PublicationPhotos from "./PublicationPhotos";
import PublicationPreview from "./PublicationPreview";
import type {
  PublicationCategory,
  PublicationDraft,
  PublicationImage,
  PublicationLanguage,
} from "@/types/publication";

const categories: { value: PublicationCategory; label: string }[] = [
  { value: "ACTION_REALISEE", label: "Action réalisée" },
  { value: "PAIEMENT_HOPITAL", label: "Paiement à l'hôpital" },
  { value: "REMISE_AIDE", label: "Remise d'aide" },
  { value: "SUIVI_BENEFICIAIRE", label: "Suivi d'un bénéficiaire" },
];

const languages: { value: PublicationLanguage; label: string }[] = [
  { value: "fr", label: "Français" },
  { value: "en", label: "Anglais" },
  { value: "de", label: "Allemand" },
  { value: "es", label: "Espagnol" },
];

const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

function localDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function PublicationForm() {
  const router = useRouter();

  const [draft, setDraft] = useState<PublicationDraft>({
    title: "",
    shortDescription: "",
    content: "",
    category: "ACTION_REALISEE",
    language: "fr",
    publicationDate: localDate(),
    tags: [],
    photos: [],
  });

  const [tagInput, setTagInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [message, setMessage] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const remaining = 250 - draft.shortDescription.length;

  const preview = useMemo(
    () => ({
      ...draft,
      photos: draft.photos,
    }),
    [draft]
  );

  function update<K extends keyof PublicationDraft>(
    key: K,
    value: PublicationDraft[K]
  ) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  function addTag() {
    const value = tagInput.trim().replace(/\s+/g, " ");
    if (
      !value ||
      value.length > 40 ||
      draft.tags.length >= 10 ||
      draft.tags.some(
        (tag) => tag.toLowerCase() === value.toLowerCase()
      )
    ) {
      return;
    }

    update("tags", [...draft.tags, value]);
    setTagInput("");
  }

  async function submit(status: "DRAFT" | "PUBLISHED") {
    if (busy || uploadingPhotos) return;

    setMessage("");
    setBusy(true);

    try {
      const response = await fetch("/api/admin/publications", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          photos: draft.photos.map((photo) => ({
            storagePath: photo.storagePath,
            imageUrl: photo.imageUrl,
          })),
          status,
        }),
      });

      const result: {
        error?: string;
        publication?: { id: string };
      } = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Enregistrement impossible.");
      }

      setMessage(
        status === "DRAFT"
          ? "Brouillon enregistré avec succès."
          : "Publication enregistrée avec succès."
      );

      router.refresh();

      if (result.publication?.id) {
        setDraft({
          title: "",
          shortDescription: "",
          content: "",
          category: "ACTION_REALISEE",
          language: "fr",
          publicationDate: localDate(),
          tags: [],
          photos: [],
        });
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Une erreur est survenue."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
          <h2 className="flex items-center gap-2 text-base font-bold text-[#092d5b]">
            <span aria-hidden="true" className="text-blue-600">▣</span>
            Informations de la publication
          </h2>
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          <div>
            <label htmlFor="publication-title" className="text-sm font-semibold text-[#092d5b]">
              Titre de la publication <span className="text-red-600">*</span>
            </label>
            <input
              id="publication-title"
              value={draft.title}
              onChange={(event) => update("title", event.target.value)}
              maxLength={180}
              placeholder="Titre de l'action réalisée"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="publication-summary" className="text-sm font-semibold text-[#092d5b]">
              Résumé court <span className="text-red-600">*</span>
            </label>
            <textarea
              id="publication-summary"
              rows={3}
              maxLength={250}
              value={draft.shortDescription}
              onChange={(event) =>
                update("shortDescription", event.target.value)
              }
              placeholder="Résumez l'action réalisée..."
              className={`${inputClass} resize-y`}
            />
            <p className="mt-1 text-right text-xs text-slate-500">
              {remaining} caractères restants
            </p>
          </div>

          <PublicationEditor
            value={draft.content}
            onChange={(value) => update("content", value)}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="publication-category" className="text-sm font-semibold text-[#092d5b]">
                Catégorie / Type de publication <span className="text-red-600">*</span>
              </label>
              <select
                id="publication-category"
                value={draft.category}
                onChange={(event) =>
                  update("category", event.target.value as PublicationCategory)
                }
                className={inputClass}
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="publication-date" className="text-sm font-semibold text-[#092d5b]">
                Date de publication <span className="text-red-600">*</span>
              </label>
              <input
                id="publication-date"
                type="date"
                value={draft.publicationDate}
                onChange={(event) =>
                  update("publicationDate", event.target.value)
                }
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="publication-author" className="text-sm font-semibold text-[#092d5b]">
                Auteur / Administrateur
              </label>
              <input
                id="publication-author"
                value="Fondation Sauvons des Vies"
                readOnly
                className={`${inputClass} bg-slate-50`}
              />
            </div>

            <div>
              <label htmlFor="publication-language" className="text-sm font-semibold text-[#092d5b]">
                Langue de publication <span className="text-red-600">*</span>
              </label>
              <select
                id="publication-language"
                value={draft.language}
                onChange={(event) =>
                  update("language", event.target.value as PublicationLanguage)
                }
                className={inputClass}
              >
                {languages.map((language) => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <PublicationPhotos
            photos={draft.photos}
            onChange={(photos: PublicationImage[]) => update("photos", photos)}
            disabled={busy}
            onUploadingChange={setUploadingPhotos}
          />

          <div>
            <label htmlFor="publication-tag" className="text-sm font-semibold text-[#092d5b]">
              Mots-clés / Tags <span className="font-normal text-slate-500">(optionnel)</span>
            </label>

            <div className="mt-2 flex flex-wrap gap-2">
              {draft.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() =>
                      update("tags", draft.tags.filter((item) => item !== tag))
                    }
                    aria-label={`Supprimer ${tag}`}
                    className="px-1 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="mt-2 flex gap-2">
              <input
                id="publication-tag"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addTag();
                  }
                }}
                maxLength={40}
                placeholder="Ajouter un mot-clé"
                className={`${inputClass} mt-0 min-w-0 flex-1`}
              />
              <button
                type="button"
                onClick={addTag}
                className="rounded-lg border border-blue-200 px-3 text-sm font-semibold text-blue-700"
              >
                Ajouter
              </button>
            </div>
          </div>

          {message && (
            <p role="status" className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              {message}
            </p>
          )}

          <div className="grid gap-2 border-t border-slate-100 pt-5 sm:grid-cols-3">
            <button
              type="button"
              disabled={busy || uploadingPhotos}
              onClick={() => void submit("DRAFT")}
              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-3 text-sm font-semibold text-blue-700 disabled:opacity-50"
            >
              Enregistrer en brouillon
            </button>

            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="rounded-lg border border-blue-200 px-3 py-3 text-sm font-semibold text-blue-700"
            >
              Prévisualiser
            </button>

            <button
              type="button"
              disabled={busy || uploadingPhotos}
              onClick={() => void submit("PUBLISHED")}
              className="rounded-lg bg-blue-700 px-3 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {busy ? "Enregistrement..." : "Publier la mise à jour"}
            </button>
          </div>
        </div>
      </section>

      {previewOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Prévisualisation de la publication"
          className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/70 p-4"
        >
          <div className="mx-auto max-w-2xl">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900"
              >
                Fermer l&apos;aperçu
              </button>
            </div>
            <PublicationPreview publication={preview} />
          </div>
        </div>
      )}
    </>
  );
}
