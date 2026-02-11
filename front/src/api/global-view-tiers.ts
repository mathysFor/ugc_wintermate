import { useFetcher, useMutator } from "@/api/api";
import type {
  GlobalViewTiersResponse,
  UpsertGlobalViewTiersInput,
} from "@shared/types/global-view-tiers";

/**
 * Récupérer les paliers globaux de vues
 */
export const useGetGlobalViewTiers = (options = {}) =>
  useFetcher<undefined, GlobalViewTiersResponse>({
    key: ["global-view-tiers"],
    path: "/api/global-view-tiers",
    options,
  });

/**
 * Mettre à jour les paliers globaux de vues (replace all)
 */
export const useUpsertGlobalViewTiers = (options = {}) =>
  useMutator<UpsertGlobalViewTiersInput, GlobalViewTiersResponse>(
    "/api/global-view-tiers",
    options
  );
