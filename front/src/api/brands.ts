import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { useFetcher, useMutator } from "@/api/api";
import { axiosUpload } from "@/api/axios";
import type {
  CreateBrandInput,
  UpdateBrandInput,
  BrandResponse,
} from "@shared/types/brands";

export const useCreateBrand = (options = {}) =>
  useMutator<CreateBrandInput, BrandResponse>("/api/brands", options);

export const useGetMyBrand = (options = {}) =>
  useFetcher<undefined, BrandResponse | null>({
    key: ["brands", "me"],
    path: "/api/brands/me",
    options,
  });

export const useGetBrand = (brandId: number, options = {}) =>
  useFetcher<undefined, BrandResponse>({
    key: ["brands", brandId],
    path: `/api/brands/${brandId}`,
    options: {
      enabled: !!brandId,
      ...options,
    },
  });

export const useUpdateBrand = (brandId: number, options = {}) =>
  useMutator<UpdateBrandInput, BrandResponse>(`/api/brands/${brandId}/update`, options);

/**
 * Input pour uploader un logo de marque
 */
export type UploadBrandLogoInput = {
  brandId: number;
  file: File;
};

/**
 * Hook pour uploader le logo d'une marque
 * Utilise FormData pour envoyer le fichier image
 */
export const useUploadBrandLogo = (
  options: Partial<UseMutationOptions<BrandResponse, Error, UploadBrandLogoInput>> = {}
) => {
  return useMutation<BrandResponse, Error, UploadBrandLogoInput>({
    mutationFn: async (input: UploadBrandLogoInput): Promise<BrandResponse> => {
      const formData = new FormData();
      formData.append('logo', input.file);

      return axiosUpload<BrandResponse>(`/api/brands/${input.brandId}/upload-logo`, formData);
    },
    ...options,
  });
};

