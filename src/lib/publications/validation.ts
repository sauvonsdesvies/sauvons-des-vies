
import type {
  PublicationCategory,
  PublicationCreateInput,
  PublicationLanguage,
} from "@/types/publication";

type ValidationResult =
  | { success: true; data: PublicationCreateInput }
  | { success: false; error: string };

const categories: PublicationCategory[] = [
  "ACTION_REALISEE",
  "PAIEMENT_HOPITAL",
  "REMISE_AIDE",
  "SUIVI_BENEFICIAIRE",
];

const languages: PublicationLanguage[] = [
  "fr",
  "en",
  "de",
  "es",
];

export function validatePublication(input: unknown): ValidationResult {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    return {
      success: false,
      error: "Les informations envoyées sont invalides.",
    };
  }

  const value = input as Record<string, unknown>;

  const title =
    typeof value.title === "string" ? value.title.trim() : "";

  const shortDescription =
    typeof value.shortDescription === "string"
      ? value.shortDescription.trim()
      : "";

  const content =
    typeof value.content === "string"
      ? value.content.trim()
      : "";

  if (title.length < 5 || title.length > 180) {
    return {
      success: false,
      error: "Le titre doit contenir entre 5 et 180 caractères.",
    };
  }

  if (
    shortDescription.length < 10 ||
    shortDescription.length > 250
  ) {
    return {
      success: false,
      error: "Le résumé doit contenir entre 10 et 250 caractères.",
    };
  }

  if (content.length < 20 || content.length > 30000) {
    return {
      success: false,
      error: "Le contenu doit contenir entre 20 et 30 000 caractères.",
    };
  }

  if (
    typeof value.category !== "string" ||
    !categories.includes(value.category as PublicationCategory)
  ) {
    return {
      success: false,
      error: "La catégorie sélectionnée est invalide.",
    };
  }

  if (
    typeof value.language !== "string" ||
    !languages.includes(value.language as PublicationLanguage)
  ) {
    return {
      success: false,
      error: "La langue sélectionnée est invalide.",
    };
  }

  if (
    typeof value.publicationDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value.publicationDate)
  ) {
    return {
      success: false,
      error: "La date de publication est invalide.",
    };
  }

  const date = new Date(`${value.publicationDate}T12:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value.publicationDate
  ) {
    return {
      success: false,
      error: "La date de publication n'existe pas.",
    };
  }

  if (value.status !== "DRAFT" && value.status !== "PUBLISHED") {
    return {
      success: false,
      error: "Le statut de publication est invalide.",
    };
  }

  if (
    !Array.isArray(value.tags) ||
    value.tags.length > 10 ||
    !value.tags.every(
      (tag) =>
        typeof tag === "string" &&
        tag.trim().length > 0 &&
        tag.trim().length <= 40
    )
  ) {
    return {
      success: false,
      error: "Les mots-clés sont invalides.",
    };
  }

  if (
    !Array.isArray(value.photos) ||
    value.photos.length > 5 ||
    !value.photos.every(
      (photo) =>
        photo !== null &&
        typeof photo === "object" &&
        !Array.isArray(photo) &&
        typeof photo.storagePath === "string" &&
        /^publications\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(
          photo.storagePath
        ) &&
        typeof photo.imageUrl === "string"
    )
  ) {
    return {
      success: false,
      error: "Les photos de la publication sont invalides.",
    };
  }

  const paths = value.photos.map(
    (photo: { storagePath: string }) => photo.storagePath
  );

  if (new Set(paths).size !== paths.length) {
    return {
      success: false,
      error: "Une photo est présente plusieurs fois.",
    };
  }

  return {
    success: true,
    data: {
      title,
      shortDescription,
      content,
      category: value.category as PublicationCategory,
      language: value.language as PublicationLanguage,
      publicationDate: value.publicationDate,
      status: value.status,
      tags: (value.tags as string[]).map((tag) => tag.trim()),
      photos: value.photos.map(
        (photo: { storagePath: string; imageUrl: string }) => ({
          storagePath: photo.storagePath,
          imageUrl: photo.imageUrl,
        })
      ),
    },
  };
}
