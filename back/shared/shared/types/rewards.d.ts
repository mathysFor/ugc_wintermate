export type CampaignReward = {
  id: number;
  campaignId: number;
  viewsTarget: number;
  amountEur: number;
  allowMultipleVideos: boolean;
  createdAt: string;
};

export type RewardResponse = CampaignReward;

export type CreateRewardInput = {
  viewsTarget: number;
  amountEur: number;
  allowMultipleVideos: boolean;
};

export type UpdateRewardInput = {
  viewsTarget?: number;
  amountEur?: number;
  allowMultipleVideos?: boolean;
};

export type RewardsListResponse = CampaignReward[];

export type RewardStatus = {
  rewardId: number;
  viewsTarget: number;
  amountEur: number;
  totalViews: number;
  isUnlocked: boolean;
  invoice: {
    id: number;
    status: 'uploaded' | 'paid';
    uploadedAt: string;
  } | null;
  anchorSubmissionId: number | null;
};

export type RewardsStatusResponse = RewardStatus[];

