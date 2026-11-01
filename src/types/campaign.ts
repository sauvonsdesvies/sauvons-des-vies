
export type CampaignStatus = "DRAFT" | "PUBLISHED";

export type CampaignCategoryOption = {
  id: string;
  name: string;
  slug: string;
};

export type CampaignPhotoInput = {
  storagePath: string;
  imageUrl: string;
};

export type CampaignFormData = {
  countryCode: string;
  isUrgent: boolean;
  title: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  targetAmount: string;
  initialCollectedAmount: string;
  initialDonorCount: string;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  photos: CampaignPhotoInput[];
};

export type CampaignCreateInput = {
  countryCode?: string;
  isUrgent?: boolean;
  title: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  targetAmount: number;
  initialCollectedAmount: number;
  initialDonorCount: number;
  startDate: string | null;
  endDate: string | null;
  status: CampaignStatus;
  photos: CampaignPhotoInput[];
};

export type CampaignProgressData = {
  collectedAmount: number;
  targetAmount: number;
  remainingAmount: number;
  percentage: number;
  confirmedDonationsCount: number;
};

export type PublicCampaignData = {
  countryCode: string | null;
  isUrgent: boolean;
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  targetAmount: number;
  currency: string;
  imageUrl: string | null;
  category: {
    name: string;
    slug: string;
  };
  photos: {
    id: string;
    imageUrl: string;
    position: number;
  }[];
  startDate: string | null;
  endDate: string | null;
  publishedAt: string | null;
  progress: CampaignProgressData;
};
