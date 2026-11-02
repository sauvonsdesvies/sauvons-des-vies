
"use client";

import { useRef, useState } from "react";
import type { PublicationImage } from "@/types/publication";

type Props = {
  photos: PublicationImage[];
  onChange: (photos: PublicationImage[]) => void;
  disabled?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
};

const MAX_PHOTOS = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function PublicationPhotos({ photos, onChange, disabled = false, onUploadingChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(files: FileList | null) {
    if (!files || files.length === 0 || disabled || uploadingRef.current) return;

    setError("");

    const selected = Array.from(files);
    if (inputRef.current) inputRef.current.value = "";

    if (photos.length + selected.length > MAX_PHOTOS) {
      setError("Vous pouvez ajouter cinq photos maximum.");
      return;
    }

    for (const file of selected) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("Formats acceptés : JPG, PNG et WebP.");
        return;
      }

      if (file.size === 0 || file.size > MAX_BYTES) {
        setError("Chaque photo doit peser au maximum 5 Mo.");
        return;
      }
    }

    setUploading(true);
    uploadingRef.current = true;
    onUploadingChange?.(true);

    const uploaded: PublicationImage[] = [];

    try {
      for (const file of selected) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/admin/publications/photos", {
          method: "POST",
          credentials: "same-origin",
          body: formData,
        });

        const result: {
          error?: string;
          photo?: PublicationImage;
        } = await response.json();

        if (!response.ok || !result.photo) {
          throw new Error(result.error || "Téléversement impossible.");
        }

        uploaded.push(result.photo);
        onChange([...photos, ...uploaded]);
      }

    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible de téléverser les photos."
      );

    } finally {
      setUploading(false);
      uploadingRef.current = false;
      onUploadingChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section aria-busy={uploading}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#092d5b]">
          Images de la publication
        </h3>
        <span aria-live="polite" aria-label={`${photos.length} images sur ${MAX_PHOTOS}`} className="text-xs text-slate-500">
          {photos.length}/{MAX_PHOTOS}
        </span>
      </div>

      <div className="grid min-w-0 grid-cols-2 gap-3 min-[420px]:grid-cols-3 sm:grid-cols-5">
        {photos.map((photo, index) => (
          <div
            key={photo.storagePath}
            className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
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
              onClick={() =>
                onChange(
                  photos.filter(
                    (item) => item.storagePath !== photo.storagePath
                  )
                )
              }
              aria-label={`Retirer la photo ${index + 1}`}
              className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-800 shadow disabled:cursor-not-allowed disabled:opacity-50"
            >
              ×
            </button>
              {index === 0 && <span className="absolute inset-x-0 bottom-0 bg-slate-950/70 py-1 text-center text-xs text-white">Principale</span>}
          </div>
        ))}

        {Array.from({ length: Math.max(0, MAX_PHOTOS - photos.length) }, (_, index) => (
          <button
            key={`empty-${index}`}
            type="button"
            disabled={disabled || uploading}
            aria-label={`Ajouter une image, emplacement ${photos.length + index + 1} sur ${MAX_PHOTOS}`}
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center rounded-lg border border-dashed border-blue-300 bg-blue-50 text-blue-700 disabled:opacity-50"
          >
            <span className="text-2xl font-bold">+</span>
            <span className="text-xs font-semibold">
              {uploading ? "Envoi..." : "Ajouter"}
            </span>
          </button>
        ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={disabled || uploading || photos.length >= MAX_PHOTOS}
        className="hidden"
        onChange={(event) => void upload(event.target.files)}
      />

      <p className="mt-2 text-sm text-slate-500">
        JPG, PNG ou WebP — 5 Mo maximum par photo, cinq images maximum.
      </p>

      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
