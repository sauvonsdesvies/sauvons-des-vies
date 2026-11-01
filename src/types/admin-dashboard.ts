
/**
 * FONDATION SAUVONS DES VIES
 * Types du tableau de bord administrateur.
 *
 * Administration : français uniquement.
 * Données : Prisma / Supabase PostgreSQL.
 * Montants financiers : entiers en FCFA (XOF).
 *
 * Ce fichier ne contient aucune donnée fictive.
 */

export type DashboardCurrency = "XOF";

export type DashboardPeriod =
  | "current_month"
  | "previous_month"
  | "last_3_months"
  | "last_6_months"
  | "current_year"
  | "all";

export type DashboardTrendDirection =
  | "up"
  | "down"
  | "stable";

export interface DashboardTrend {
  direction: DashboardTrendDirection;
  percentage: number | null;
  previousValue: number | null;
}

export type DashboardStatKey =
  | "totalDonations"
  | "monthlyDonations"
  | "activeCampaigns"
  | "beneficiariesHelped"
  | "confirmedDonations"
  | "hospitalPayments"
  | "pendingRequests"
  | "completedCampaigns";

export interface DashboardStat {
  key: DashboardStatKey;
  label: string;
  value: number;
  unit: "XOF" | "count";
  trend: DashboardTrend | null;
}

export interface DashboardStats {
  totalDonations: number;
  monthlyDonations: number;
  activeCampaigns: number;
  beneficiariesHelped: number;
  confirmedDonations: number;
  hospitalPayments: number;
  pendingRequests: number;
  completedCampaigns: number;
}

export interface DashboardDonationPoint {
  date: string;
  label: string;
  amount: number;
  count: number;
}

export interface DashboardCategoryPoint {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
}

export interface DashboardCampaign {
  donorCount: number;
  id: string;
  title: string;
  status: string;
  targetAmount: number;
  collectedAmount: number;
  progressPercentage: number;
  imageUrl: string | null;
  createdAt: string;
}

export interface DashboardDonation {
  id: string;
  campaignId: string;
  campaignTitle: string;
  donorName: string | null;
  amount: number;
  currency: DashboardCurrency;
  status: string;
  createdAt: string;
  confirmedAt: string | null;
}

export interface DashboardAidRequest {
  id: string;
  reference: string;
  title: string;
  status: string;
  createdAt: string;
}

export interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardDateRange {
  start: string | null;
  end: string | null;
}

export interface AdminDashboardData {
  generatedAt: string;
  currency: DashboardCurrency;
  period: DashboardPeriod;
  dateRange: DashboardDateRange;

  stats: DashboardStats;
  trends: Partial<
    Record<DashboardStatKey, DashboardTrend>
  >;

  donationEvolution: DashboardDonationPoint[];
  donationsByCategory: DashboardCategoryPoint[];

  recentCampaigns: DashboardCampaign[];
  recentDonations: DashboardDonation[];
  recentRequests: DashboardAidRequest[];
  notifications: DashboardNotification[];
}

export interface DashboardDataResponse {
  success: boolean;
  data?: AdminDashboardData;
  message?: string;
}

export interface DashboardFilterOption {
  value: DashboardPeriod;
  label: string;
}

export const DASHBOARD_PERIOD_OPTIONS: DashboardFilterOption[] = [
  { value: "current_month", label: "Ce mois" },
  { value: "previous_month", label: "Mois précédent" },
  { value: "last_3_months", label: "3 derniers mois" },
  { value: "last_6_months", label: "6 derniers mois" },
  { value: "current_year", label: "Cette année" },
  { value: "all", label: "Toute la période" },
];
