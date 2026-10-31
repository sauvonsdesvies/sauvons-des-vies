
import type { PublicStatistics } from "@/lib/statistics/service";

// ==========================================================
// FONDATION SAUVONS DES VIES
// TYPES — PAGE D'ACCUEIL PUBLIQUE
// ==========================================================

// ----------------------------------------------------------
// LANGUES
// ----------------------------------------------------------

export type PublicLanguage = "fr" | "en" | "es" | "de";

export type LocalizedText = Partial<
  Record<PublicLanguage, string>
>;

// ----------------------------------------------------------
// STATISTIQUES OFFICIELLES
// ----------------------------------------------------------

export type HomeStatistics = PublicStatistics;

// ----------------------------------------------------------
// CATÉGORIES / CAUSES
// ----------------------------------------------------------

export type HomeCause = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  campaignCount: number;
};

// ----------------------------------------------------------
// CAMPAGNES
// ----------------------------------------------------------

export type HomeCampaignStatus =
  | "ACTIVE"
  | "COMPLETED"
  | "CLOSED";

export type HomeCampaign = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  imageUrl: string | null;

  category: {
    id: string;
    name: string;
    slug: string;
  } | null;

  country: string | null;

  targetAmount: number;
  collectedAmount: number;
  remainingAmount: number;
  progressPercentage: number;

  donorCount: number;

  currency: string;

  isUrgent: boolean;

  status: HomeCampaignStatus;

  startDate: string | null;
  endDate: string | null;
};

// ----------------------------------------------------------
// ACTUALITÉS
// ----------------------------------------------------------

export type HomeNewsItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  imageUrl: string | null;
  publishedAt: string;
};

// ----------------------------------------------------------
// DONNÉES COMPLÈTES DE L'ACCUEIL
// ----------------------------------------------------------

export type HomeData = {
  campaigns: HomeCampaign[];
  statistics: HomeStatistics;

  urgentCampaigns: HomeCampaign[];

  causes: HomeCause[];

  news: HomeNewsItem[];

  generatedAt: string | null;
};

// ----------------------------------------------------------
// RÉPONSE API
// ----------------------------------------------------------

export type HomeApiSuccess = {
  success: true;
  statistics: HomeStatistics;
};

export type HomeApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export type HomeApiResponse =
  | HomeApiSuccess
  | HomeApiFailure;
