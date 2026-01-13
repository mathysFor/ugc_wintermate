import { useFetcher, useMutator } from "@/api/api";
import { useMutation } from "@tanstack/react-query";
import { axiosPost } from "@/api/axios";
import type {
  TiktokAuthUrlResponse,
  ConnectTiktokResponse,
  TiktokAccountsListResponse,
  TiktokVideosListResponse,
  TiktokRefreshTokenResponse,
  TiktokCallbackInput,
} from "@shared/types/tiktok";

/**
 * Récupère l'URL d'autorisation OAuth TikTok
 */
export const useGetTiktokAuthUrl = (options = {}) =>
  useFetcher<undefined, TiktokAuthUrlResponse>({
    key: ["tiktok", "auth-url"],
    path: "/api/tiktok/auth-url",
    options: {
      enabled: false, // Ne pas exécuter automatiquement
      ...options,
    },
  });

/**
 * Traite le callback OAuth TikTok
 */
export const useTiktokCallback = (options = {}) =>
  useMutator<TiktokCallbackInput, ConnectTiktokResponse>(
    "/api/tiktok/callback",
    options
  );

/**
 * Récupère la liste des comptes TikTok de l'utilisateur
 */
export const useGetTiktokAccounts = (options = {}) =>
  useFetcher<undefined, TiktokAccountsListResponse>({
    key: ["tiktok", "accounts"],
    path: "/api/tiktok/accounts",
    options,
  });

/**
 * Récupère les vidéos d'un compte TikTok
 */
export const useGetTiktokVideos = (accountId: number, cursor?: string, options = {}) =>
  useFetcher<undefined, TiktokVideosListResponse>({
    key: ["tiktok", "videos", accountId, cursor],
    path: `/api/tiktok/accounts/${accountId}/videos${cursor ? `?cursor=${cursor}` : ""}`,
    options: {
      enabled: !!accountId,
      ...options,
    },
  });

/**
 * Déconnecte un compte TikTok
 * Utilise useMutation directement car le path est dynamique
 */
export const useDisconnectTiktokAccount = (options = {}) =>
  useMutation({
    mutationFn: (accountId: number) => 
      axiosPost<undefined, { message: string }>(`/api/tiktok/accounts/${accountId}/disconnect`, undefined),
    ...options,
  });

/**
 * Force le refresh du token d'un compte TikTok
 */
export const useRefreshTiktokToken = (accountId: number, options = {}) =>
  useMutator<undefined, TiktokRefreshTokenResponse>(
    `/api/tiktok/accounts/${accountId}/refresh`,
    options
  );
