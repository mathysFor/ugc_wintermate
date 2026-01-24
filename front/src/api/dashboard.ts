import { useFetcher } from "@/api/api";
import type {
  BrandDashboardStatsResponse,
  CreatorDashboardStatsResponse,
  BrandStatsQuery,
} from "@shared/types/dashboard";

/**
 * Hook pour récupérer les statistiques du dashboard marque
 */
export const useGetBrandDashboardStats = (params?: BrandStatsQuery, options = {}) =>
  useFetcher<BrandStatsQuery, BrandDashboardStatsResponse>({
    key: ["dashboard", "brand", "stats", params],
    path: "/api/dashboard/brand/stats",
    params,
    options,
  });

/**
 * Hook pour récupérer les statistiques du dashboard créateur
 */
export const useGetCreatorDashboardStats = (options = {}) =>
  useFetcher<undefined, CreatorDashboardStatsResponse>({
    key: ["dashboard", "creator", "stats"],
    path: "/api/dashboard/creator/stats",
    options,
  });
