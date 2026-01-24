import type { CampaignWithRelations } from './campaigns';
import type { TiktokAccount } from './tiktok';

export type SubmissionStatus = 'pending' | 'accepted' | 'refused';

export type VideoStats = {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  updatedAt: string;
};

export type Submission = {
  id: number;
  campaignId: number;
  tiktokAccountId: number;
  tiktokVideoId: string;
  coverImageUrl: string | null;
  status: SubmissionStatus;
  submittedAt: string;
  validatedAt: string | null;
  refuseReason: string | null;
  adsCode: string | null;
};

export type SubmissionWithRelations = Submission & {
  campaign: CampaignWithRelations;
  tiktokAccount: TiktokAccount;
  currentStats?: VideoStats;
};

export type SubmissionResponse = SubmissionWithRelations;

export type CreateSubmissionInput = {
  campaignId: number;
  tiktokAccountId: number;
  tiktokVideoId: string;
  coverImageUrl?: string;
};

export type RefuseSubmissionInput = {
  reason?: string;
};

export type PaginatedSubmissionsResponse = {
  items: SubmissionWithRelations[];
  nextCursor: number | null;
  hasMore: boolean;
  pendingCount?: number;
};

export type RefreshStatsResponse = {
  success?: boolean;
  updated: number;
  message: string;
};

