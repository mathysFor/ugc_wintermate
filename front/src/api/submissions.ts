import { useFetcher, useMutator } from "@/api/api";
import type {
  CreateSubmissionInput,
  SubmissionResponse,
  PaginatedSubmissionsResponse,
  RefreshStatsResponse,
  ValidateSubmissionInput,
} from "@shared/types/submissions";

export const useGetSubmissions = (
  params?: { cursor?: string; limit?: number; campaignId?: string; status?: string },
  options = {}
) =>
  useFetcher<typeof params, PaginatedSubmissionsResponse>({
    key: ["submissions", params],
    path: "/api/submissions",
    params,
    options,
  });

export const useGetCampaignSubmissions = (
  campaignId: number,
  params?: { cursor?: string; limit?: number; status?: string },
  options = {}
) =>
  useFetcher<typeof params, PaginatedSubmissionsResponse>({
    key: ["campaigns", campaignId, "submissions", params],
    path: `/api/campaigns/${campaignId}/submissions`,
    params,
    options: {
      enabled: !!campaignId,
      ...options,
    },
  });

export const useCreateSubmission = (campaignId: number, options = {}) =>
  useMutator<Omit<CreateSubmissionInput, "campaignId">, SubmissionResponse>(
    `/api/campaigns/${campaignId}/submit`,
    options
  );

export const useValidateSubmission = (submissionId: number, options = {}) =>
  useMutator<ValidateSubmissionInput | undefined, SubmissionResponse>(`/api/submissions/${submissionId}/validate`, options);

export const useRefuseSubmission = (submissionId: number, options = {}) =>
  useMutator<{ reason?: string }, SubmissionResponse>(
    `/api/submissions/${submissionId}/refuse`,
    options
  );

export const useGetPublicCampaignSubmissions = (
  campaignId: number,
  options = {}
) =>
  useFetcher<undefined, PaginatedSubmissionsResponse>({
    key: ["campaigns", campaignId, "submissions", "public"],
    path: `/api/campaigns/${campaignId}/submissions/public`,
    options: {
      enabled: !!campaignId,
      ...options,
    },
  });

export const useGetBrandSubmissions = (
  params?: { 
    status?: 'pending' | 'accepted' | 'refused'; 
    cursor?: string; 
    limit?: number;
    campaignId?: string;
    creatorUsername?: string;
  },
  options = {}
) =>
  useFetcher<typeof params, PaginatedSubmissionsResponse>({
    key: ["brand-submissions", params],
    path: "/api/submissions/brand",
    params,
    options,
  });

export const useDeleteSubmission = (submissionId: number, options = {}) =>
  useMutator<undefined, { success: boolean; message: string }>(
    `/api/submissions/${submissionId}/delete`,
    options
  );

export const useRefreshStats = (options = {}) =>
  useMutator<undefined, RefreshStatsResponse>('/api/submissions/refresh-stats', options);

