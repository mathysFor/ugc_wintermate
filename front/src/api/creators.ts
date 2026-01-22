import { useFetcher } from "@/api/api";
import type {
  CreatorsStatsResponse,
  CreatorsListResponse,
} from "@shared/types/creators";

/**
 * Hook pour récupérer les statistiques globales des créateurs
 */
export const useGetCreatorsStats = (options = {}) =>
  useFetcher<undefined, CreatorsStatsResponse>({
    key: ["creators", "stats"],
    path: "/api/creators/stats",
    options,
  });

/**
 * Hook pour récupérer la liste paginée des créateurs avec leurs statistiques
 */
export const useGetAllCreators = (
  params?: {
    cursor?: string;
    limit?: number;
    direction?: 'next' | 'prev';
    sortBy?: 'views' | 'paid' | 'videos' | 'createdAt';
    search?: string;
  },
  options = {}
) =>
  useFetcher<typeof params, CreatorsListResponse>({
    key: ["creators", params],
    path: "/api/creators",
    params,
    options,
  });

