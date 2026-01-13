import { useFetcher } from "@/api/api";
import type {
  BrandDashboardStatsResponse,
  CreatorDashboardStatsResponse,
} from "@shared/types/dashboard";

/**
 * Hook pour récupérer les statistiques du dashboard marque
 */
export const useGetBrandDashboardStats = (options = {}) =>
  useFetcher<undefined, BrandDashboardStatsResponse>({
    key: ["dashboard", "brand", "stats"],
    path: "/api/dashboard/brand/stats",
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

