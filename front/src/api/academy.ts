import { useFetcher, useMutator } from "@/api/api";
import type {
  AcademyCategoriesResponse,
  AcademyCategoryResponse,
  AcademyContentResponse,
  CreateAcademyCategoryInput,
  CreateAcademyContentInput,
  PaginatedAcademyResponse,
  UpdateAcademyCategoryInput,
  UpdateAcademyContentInput,
} from "@shared/types/academy";

/**
 * Liste des catégories academy
 */
export const useGetAcademyCategories = (options = {}) =>
  useFetcher<undefined, AcademyCategoriesResponse>({
    key: ["academy-categories"],
    path: "/api/academy/categories",
    options,
  });

/**
 * Contenu academy paginé avec filtre catégorie
 */
export const useGetAcademyContent = (
  params?: {
    cursor?: string;
    limit?: number;
    categoryId?: number;
  },
  options = {}
) =>
  useFetcher<typeof params, PaginatedAcademyResponse>({
    key: ["academy", params],
    path: "/api/academy/content",
    params,
    options,
  });

/**
 * Créer un contenu academy
 */
export const useCreateAcademyContent = (options = {}) =>
  useMutator<CreateAcademyContentInput, AcademyContentResponse>(
    "/api/academy/content",
    options
  );

/**
 * Mettre à jour un contenu academy
 */
export const useUpdateAcademyContent = (contentId: number, options = {}) =>
  useMutator<UpdateAcademyContentInput, AcademyContentResponse>(
    `/api/academy/content/${contentId}/update`,
    options
  );

/**
 * Supprimer un contenu academy
 */
export const useDeleteAcademyContent = (contentId: number, options = {}) =>
  useMutator<undefined, { message: string }>(
    `/api/academy/content/${contentId}/delete`,
    options
  );

/**
 * Incrémenter la vue d'un contenu academy
 */
export const useIncrementAcademyView = (contentId: number, options = {}) =>
  useMutator<undefined, unknown>(
    `/api/academy/content/${contentId}/view`,
    options
  );

/**
 * Créer une catégorie academy
 */
export const useCreateAcademyCategory = (options = {}) =>
  useMutator<CreateAcademyCategoryInput, AcademyCategoryResponse>(
    "/api/academy/categories",
    options
  );

/**
 * Mettre à jour une catégorie academy
 */
export const useUpdateAcademyCategory = (categoryId: number, options = {}) =>
  useMutator<UpdateAcademyCategoryInput, AcademyCategoryResponse>(
    `/api/academy/categories/${categoryId}/update`,
    options
  );

/**
 * Supprimer une catégorie academy
 */
export const useDeleteAcademyCategory = (categoryId: number, options = {}) =>
  useMutator<undefined, { message: string }>(
    `/api/academy/categories/${categoryId}/delete`,
    options
  );
