
"use client";

import { useRef, useState } from "react";
import type { CampaignPhotoInput } from "@/types/campaign";

type Props = {
  photos: CampaignPhotoInput[];
  onChange: (photos: CampaignPhotoInput[]) => void;
  disabled?: boolean;
};

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function CampaignPhotoUpload({
  photos,
  onChange,
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0 || uploading) return;

    setError("");

    const selected = Array.from(files);

    if (photos.length + selected.length > MAX_PHOTOS) {
      setError("Vous pouvez ajouter cinq photos maximum.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    for (const file of selected) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError("Formats acceptés : JPG, PNG et WebP.");
        if (inputRef.current) inputRef.current.value = "";
        return;
      }

      if (file.size === 0 || file.size > MAX_FILE_SIZE) {
        setError("Chaque photo doit peser 5 Mo maximum.");
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
    }

    setUploading(true);
    const uploaded: CampaignPhotoInput[] = [];

    try {
      for (const file of selected) {
        const data = new FormData();
        data.append("file", file);

        const response = await fetch("/api/admin/campaigns/photos", {
          method: "POST",
          body: data,
          credentials: "same-origin",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Téléversement impossible.");
        }

        uploaded.push({
          storagePath: result.photo.storagePath,
          imageUrl: result.photo.imageUrl,
        });
        // Afficher chaque succès immédiatement, même si un fichier suivant échoue.
        onChange([...photos, ...uploaded]);
      }

    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur de téléversement."
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removePhoto(index: number) {
    onChange(photos.filter((_, position) => position !== index));
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-slate-900">
          Photos de la collecte
        </h3>
        <span className="text-xs font-semibold text-slate-500">
          {photos.length}/{MAX_PHOTOS}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={disabled || uploading || photos.length >= MAX_PHOTOS}
        onChange={(event) => void uploadFiles(event.target.files)}
        className="sr-only"
        id="campaign-photos"
      />

      <label
        htmlFor="campaign-photos"
        className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center transition hover:border-blue-400"
      >
        <span className="text-3xl text-blue-700">+</span>
        <span className="mt-2 text-sm font-semibold text-slate-700">
          {uploading ? "Téléversement en cours..." : "Ajouter des photos"}
        </span>
        <span className="mt-1 text-xs text-slate-500">
          JPG, PNG, WebP — 5 Mo par photo
        </span>
      </label>

      {photos.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {photos.map((photo, index) => (
            <div
              key={photo.storagePath}
              className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.imageUrl}
                alt={`Photo ${index + 1}`}
                className="h-full w-full object-cover"
              />

              <button
                type="button"
                disabled={disabled || uploading}
                onClick={() => removePhoto(index)}
                aria-label={`Retirer la photo ${index + 1}`}
                className="absolute right-1 top-1 rounded-full bg-red-700 px-2 py-1 text-xs font-bold text-white"
              >
                ×
              </button>

              {index === 0 && (
                <span className="absolute bottom-0 left-0 right-0 bg-slate-950/75 py-1 text-center text-[10px] text-white">
                  Principale
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
