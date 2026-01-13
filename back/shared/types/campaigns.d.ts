import type { BrandResponse } from './brands';
import type { CampaignReward } from './rewards';
import type { SubmissionWithRelations } from './submissions';

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'deleted';

export type Campaign = {
  id: number;
  brandId: number;
  title: string;
  description: string;
  coverImageUrl: string | null;
  youtubeUrl: string | null;
  status: CampaignStatus;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CampaignWithRelations = Campaign & {
  brand: BrandResponse;
  rewards: CampaignReward[];
  submissions?: SubmissionWithRelations[];
};

export type CampaignWithRelationsResponse = CampaignWithRelations;

export type CreateCampaignInput = {
  title: string;
  description: string;
  coverImageUrl?: string;
  youtubeUrl?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  rewards: Array<{
    viewsTarget: number;
    amountEur: number;
    allowMultipleVideos: boolean;
  }>;
};

export type UpdateCampaignInput = {
  title?: string;
  description?: string;
  coverImageUrl?: string;
  youtubeUrl?: string;
  status?: CampaignStatus;
  startDate?: Date | string;
  endDate?: Date | string;
};

export type PaginatedCampaignsResponse = {
  items: CampaignWithRelations[];
  nextCursor: number | null;
  hasMore: boolean;
};

