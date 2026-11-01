
export type RequestStatus =
  | "PENDING"
  | "VERIFYING"
  | "PUBLISHED"
  | "CLOSED"
  | "DRAFT"
  | "SUSPENDED"
  | "REJECTED";

export type RequestItem = {
  countryCode: string | null;
  isUrgent: boolean;
  id: string;
  reference: string;
  title: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  categoryName: string;
  targetAmount: number;
  collectedAmount: number;
  initialCollectedAmount: number;
  initialDonorCount: number;
  remainingAmount: number;
  percentage: number;
  status: RequestStatus;
  imageUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
};

export type RequestStatistics = {
  total: number;
  pending: number;
  verifying: number;
  published: number;
  closed: number;
};

export type RequestListResponse = {
  items: RequestItem[];
  total: number;
  page: number;
  pageSize: number;
  categories: {
    id: string;
    name: string;
  }[];
  stats: RequestStatistics;
};

export type RequestUpdateInput = {
  initialCollectedAmount?: number;
  initialDonorCount?: number;
  countryCode?: string | null;
  isUrgent?: boolean;
  title: string;
  shortDescription: string;
  description: string;
  targetAmount: number;
};
