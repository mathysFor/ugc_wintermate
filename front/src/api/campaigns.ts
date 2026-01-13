import { useFetcher, useMutator } from "@/api/api";
import type {
  CreateCampaignInput,
  UpdateCampaignInput,
  CampaignWithRelationsResponse,
  PaginatedCampaignsResponse,
} from "@shared/types/campaigns";
import type { CreateRewardInput, UpdateRewardInput, RewardResponse, RewardsListResponse, RewardsStatusResponse } from "@shared/types/rewards";

// === Campaigns ===

export const useGetAllCampaigns = (
  params?: { cursor?: string; limit?: number; status?: string },
  options = {}
) =>
  useFetcher<typeof params, PaginatedCampaignsResponse>({
    key: ["campaigns", params],
    path: "/api/campaigns",
    params,
    options,
  });

export const useGetCampaign = (campaignId: number, options = {}) =>
  useFetcher<undefined, CampaignWithRelationsResponse>({
    key: ["campaigns", campaignId],
    path: `/api/campaigns/${campaignId}`,
    options: {
      enabled: !!campaignId,
      ...options,
    },
  });

export const useCreateCampaign = (options = {}) =>
  useMutator<CreateCampaignInput, CampaignWithRelationsResponse>("/api/campaigns", options);

export const useUpdateCampaign = (campaignId: number, options = {}) =>
  useMutator<UpdateCampaignInput, CampaignWithRelationsResponse>(
    `/api/campaigns/${campaignId}/update`,
    options
  );

export const useDeleteCampaign = (campaignId: number, options = {}) =>
  useMutator<undefined, { message: string }>(`/api/campaigns/${campaignId}/delete`, options);

// === Rewards ===

export const useGetCampaignRewards = (campaignId: number, options = {}) =>
  useFetcher<undefined, RewardsListResponse>({
    key: ["campaigns", campaignId, "rewards"],
    path: `/api/campaigns/${campaignId}/rewards`,
    options: {
      enabled: !!campaignId,
      ...options,
    },
  });

export const useCreateReward = (campaignId: number, options = {}) =>
  useMutator<CreateRewardInput, RewardResponse>(`/api/campaigns/${campaignId}/rewards`, options);

export const useUpdateReward = (rewardId: number, options = {}) =>
  useMutator<UpdateRewardInput, RewardResponse>(`/api/rewards/${rewardId}/update`, options);

export const useDeleteReward = (rewardId: number, options = {}) =>
  useMutator<undefined, { message: string }>(`/api/rewards/${rewardId}/delete`, options);

export const useGetMyRewardsStatus = (campaignId: number, options = {}) =>
  useFetcher<undefined, RewardsStatusResponse>({
    key: ["campaigns", campaignId, "my-rewards-status"],
    path: `/api/campaigns/${campaignId}/my-rewards-status`,
    options: {
      enabled: !!campaignId,
      ...options,
    },
  });


