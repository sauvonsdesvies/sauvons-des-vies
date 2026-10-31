
export type PublicationCategory =
  | "ACTION_REALISEE"
  | "PAIEMENT_HOPITAL"
  | "REMISE_AIDE"
  | "SUIVI_BENEFICIAIRE";

export type PublicationLanguage =
  | "fr"
  | "en"
  | "de"
  | "es";

export type PublicationStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "SCHEDULED";

export type PublicationImage = {
  storagePath: string;
  imageUrl: string;
};

export type PublicationDraft = {
  title: string;
  shortDescription: string;
  content: string;
  category: PublicationCategory;
  language: PublicationLanguage;
  publicationDate: string;
  tags: string[];
  photos: PublicationImage[];
};

export type PublicationCreateInput = PublicationDraft & {
  status: "DRAFT" | "PUBLISHED";
};

export type PublicationSummary = {
  id: string;
  title: string;
  slug: string;
  category: string;
  language: string;
  status: string;
  imageUrl: string | null;
  publicationDate: string | null;
  createdAt: string;
};
