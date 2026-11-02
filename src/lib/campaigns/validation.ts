
import { COUNTRIES } from "@/lib/countries";
import { isCampaignCurrency } from "./currencies";
import type {
  CampaignCreateInput,
  CampaignPhotoInput,
  CampaignStatus,
} from "@/types/campaign";

type ValidationResult =
  | { success: true; data: CampaignCreateInput }
  | { success: false; error: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

export function validateCampaignInput(input: unknown): ValidationResult {
  if (!isObject(input)) {
    return { success: false, error: "Données invalides." };
  }

  const countryCode = cleanString(input.countryCode);
  if (!COUNTRIES.some((country) => country.code === countryCode)) return { success: false, error: "Veuillez choisir le pays du bénéficiaire." };
  if (typeof input.isUrgent !== "boolean") return { success: false, error: "Indicateur d’urgence invalide." };
  const title = cleanString(input.title);
  const shortDescription = cleanString(input.shortDescription);
  const description = cleanString(input.description);
  const categoryId = cleanString(input.categoryId);
  const startDate = cleanString(input.startDate);
  const endDate = cleanString(input.endDate);
  const status = input.status;
  const currency = input.currency === undefined ? "XOF" : input.currency;
  if (!isCampaignCurrency(currency)) return { success: false, error: "Veuillez choisir une devise valide." };
  const openingValue = (value: unknown) => value === undefined || value === "" ? 0 :
    typeof value === "number" || typeof value === "string" ? Number(value) : NaN;
  const initialCollectedAmount = openingValue(input.initialCollectedAmount);
  const initialDonorCount = openingValue(input.initialDonorCount);
  if (![initialCollectedAmount, initialDonorCount].every(value => Number.isSafeInteger(value) && value >= 0 && value <= 2147483647)) {
    return { success: false, error: "Le montant déjà récolté et le nombre de participants doivent être des entiers positifs ou nuls." };
  }

  const targetAmount =
    typeof input.targetAmount === "number" ||
    typeof input.targetAmount === "string"
      ? Number(input.targetAmount)
      : NaN;

  if (title.length < 5 || title.length > 180) {
    return {
      success: false,
      error: "Le titre doit contenir entre 5 et 180 caractères.",
    };
  }

  if (shortDescription.length < 10 || shortDescription.length > 500) {
    return {
      success: false,
      error: "La description courte doit contenir entre 10 et 500 caractères.",
    };
  }

  if (description.length < 20 || description.length > 30000) {
    return {
      success: false,
      error: "La description complète doit contenir entre 20 et 30 000 caractères.",
    };
  }

  if (!/^[a-f0-9-]{36}$/i.test(categoryId)) {
    return {
      success: false,
      error: "Veuillez sélectionner une catégorie valide.",
    };
  }

  if (
    !Number.isSafeInteger(targetAmount) ||
    targetAmount <= 0 ||
    targetAmount > 2147483647
  ) {
    return {
      success: false,
      error: "L’objectif doit être un montant entier positif dans la devise choisie.",
    };
  }

  if (status !== "DRAFT" && status !== "PUBLISHED") {
    return {
      success: false,
      error: "Statut de collecte invalide.",
    };
  }

  if (startDate && !validDate(startDate)) {
    return {
      success: false,
      error: "La date de lancement est invalide.",
    };
  }

  if (endDate && !validDate(endDate)) {
    return {
      success: false,
      error: "La date de fin est invalide.",
    };
  }

  if (startDate && endDate && endDate < startDate) {
    return {
      success: false,
      error: "La date de fin ne peut pas précéder la date de lancement.",
    };
  }

  if (!Array.isArray(input.photos) || input.photos.length > 5) {
    return {
      success: false,
      error: "Cinq photos maximum sont autorisées.",
    };
  }

  const photos: CampaignPhotoInput[] = [];

  for (const item of input.photos) {
    if (!isObject(item)) {
      return { success: false, error: "Photo invalide." };
    }

    const storagePath = cleanString(item.storagePath);
    const imageUrl = cleanString(item.imageUrl);

    if (
      !storagePath ||
      storagePath.length > 500 ||
      !imageUrl ||
      imageUrl.length > 2000
    ) {
      return {
        success: false,
        error: "Les informations d'une photo sont invalides.",
      };
    }

    try {
      const url = new URL(imageUrl);

      if (url.protocol !== "https:") {
        return {
          success: false,
          error: "L'adresse d'une photo est invalide.",
        };
      }
    } catch {
      return {
        success: false,
        error: "L'adresse d'une photo est invalide.",
      };
    }

    photos.push({ storagePath, imageUrl });
  }

  if (new Set(photos.map((photo) => photo.storagePath)).size !== photos.length) {
    return {
      success: false,
      error: "Une photo ne peut pas être ajoutée plusieurs fois.",
    };
  }

  return {
    success: true,
    data: {
      countryCode,
      isUrgent: input.isUrgent,
      title,
      shortDescription,
      description,
      categoryId,
      targetAmount,
      currency,
      initialCollectedAmount,
      initialDonorCount,
      startDate: startDate || null,
      endDate: endDate || null,
      status: status as CampaignStatus,
      photos,
    },
  };
}
