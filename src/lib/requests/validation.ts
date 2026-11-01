
import type { RequestUpdateInput } from "@/types/request";
import { COUNTRIES } from "@/lib/countries";

type ValidationResult =
  | { success: true; data: RequestUpdateInput }
  | { success: false; error: string };

export function validateRequestUpdate(
  input: unknown
): ValidationResult {
  if (
    typeof input !== "object" ||
    input === null ||
    Array.isArray(input)
  ) {
    return {
      success: false,
      error: "Les données envoyées sont invalides.",
    };
  }

  const data = input as Record<string, unknown>;
  for (const key of ["initialCollectedAmount", "initialDonorCount"]) {
    const value = data[key];
    if (value !== undefined && (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 || value > 2147483647)) {
      return { success: false, error: "Le montant déjà récolté et le nombre de participants doivent être des entiers positifs ou nuls." };
    }
  }
  if (data.countryCode != null && data.countryCode !== "" && !COUNTRIES.some((country) => country.code === data.countryCode)) return { success: false, error: "Pays invalide." };
  if (data.isUrgent !== undefined && typeof data.isUrgent !== "boolean") return { success: false, error: "Indicateur d’urgence invalide." };

  const title =
    typeof data.title === "string" ? data.title.trim() : "";

  const shortDescription =
    typeof data.shortDescription === "string"
      ? data.shortDescription.trim()
      : "";

  const description =
    typeof data.description === "string"
      ? data.description.trim()
      : "";

  const targetAmount = data.targetAmount;

  if (title.length < 5 || title.length > 180) {
    return {
      success: false,
      error: "Le titre doit contenir entre 5 et 180 caractères.",
    };
  }

  if (
    shortDescription.length < 10 ||
    shortDescription.length > 500
  ) {
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

  if (
    typeof targetAmount !== "number" ||
    !Number.isSafeInteger(targetAmount) ||
    targetAmount <= 0 ||
    targetAmount > 2147483647
  ) {
    return {
      success: false,
      error: "Le montant doit être un entier positif valide en FCFA.",
    };
  }

  return {
    success: true,
    data: {
      countryCode: data.countryCode === "" ? null : data.countryCode as string | null | undefined,
      isUrgent: data.isUrgent as boolean | undefined,
      title,
      shortDescription,
      description,
      targetAmount,
      initialCollectedAmount: data.initialCollectedAmount as number | undefined,
      initialDonorCount: data.initialDonorCount as number | undefined,
    },
  };
}
