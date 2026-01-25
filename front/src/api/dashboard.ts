import { useFetcher } from "@/api/api";
import { keepPreviousData } from "@tanstack/react-query";
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
    options: {
      staleTime: 5 * 60 * 1000, // 5 minutes - Les stats dashboard peuvent rester fraîches 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes - Garder en cache 30 minutes
      placeholderData: keepPreviousData, // Afficher les données précédentes pendant le chargement
      ...options,
    },
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
