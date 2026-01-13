import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { useFetcher, useMutator } from "@/api/api";
import { axiosUpload } from "@/api/axios";
import type {
  ReferralDashboardResponse,
  PaginatedRefereesResponse,
  PaginatedReferralCommissionsResponse,
  PaginatedReferralInvoicesResponse,
  PaginatedReferralInvoicesForBrandResponse,
  ReferralInvoiceResponse,
} from "@shared/types/referral";
import type { PaymentMethod } from "@shared/types/invoices";

/**
 * Hook pour récupérer le dashboard de parrainage du créateur connecté
 */
export const useGetReferralDashboard = (options = {}) =>
  useFetcher<undefined, ReferralDashboardResponse>({
    key: ["referral", "dashboard"],
    path: "/api/referral/dashboard",
    options,
  });

/**
 * Hook pour récupérer la liste des filleuls
 */
export const useGetReferees = (
  params?: { cursor?: string; limit?: number },
  options = {}
) =>
  useFetcher<typeof params, PaginatedRefereesResponse>({
    key: ["referral", "referees", params],
    path: "/api/referral/referees",
    params,
    options,
  });

/**
 * Hook pour récupérer la liste des commissions de parrainage
 */
export const useGetReferralCommissions = (
  params?: { cursor?: string; limit?: number },
  options = {}
) =>
  useFetcher<typeof params, PaginatedReferralCommissionsResponse>({
    key: ["referral", "commissions", params],
    path: "/api/referral/commissions",
    params,
    options,
  });

/**
 * Hook pour récupérer la liste des factures de parrainage
 */
export const useGetReferralInvoices = (
  params?: { cursor?: string; limit?: number },
  options = {}
) =>
  useFetcher<typeof params, PaginatedReferralInvoicesResponse>({
    key: ["referral", "invoices", params],
    path: "/api/referral/invoices",
    params,
    options,
  });

/**
 * Hook pour récupérer toutes les factures de parrainage (marques uniquement)
 */
export const useGetAllReferralInvoices = (
  params?: { cursor?: string; limit?: number; status?: 'uploaded' | 'paid' },
  options = {}
) =>
  useFetcher<typeof params, PaginatedReferralInvoicesForBrandResponse>({
    key: ["referral", "invoices", "all", params],
    path: "/api/referral/invoices/all",
    params,
    options,
  });

/**
 * Input pour uploader une facture de parrainage
 * Le fichier est optionnel si paymentMethod === 'gift_card'
 */
export type UploadReferralInvoiceFileInput = {
  file?: File;
  amountEur: number;
  paymentMethod: PaymentMethod;
};

/**
 * Hook pour uploader une facture de parrainage PDF
 * Si paymentMethod === 'gift_card', pas de fichier requis
 */
export const useUploadReferralInvoice = (
  options: Partial<UseMutationOptions<ReferralInvoiceResponse, Error, UploadReferralInvoiceFileInput>> = {}
) => {
  return useMutation<ReferralInvoiceResponse, Error, UploadReferralInvoiceFileInput>({
    mutationFn: async (input: UploadReferralInvoiceFileInput): Promise<ReferralInvoiceResponse> => {
      const formData = new FormData();
      formData.append('amountEur', String(input.amountEur));
      formData.append('paymentMethod', input.paymentMethod);
      
      if (input.file) {
        formData.append('file', input.file);
      }

      return axiosUpload<ReferralInvoiceResponse>('/api/referral/invoices', formData);
    },
    ...options,
  });
};

/**
 * Hook pour marquer une facture de parrainage comme payée (marques uniquement)
 */
export const useMarkReferralInvoicePaid = (invoiceId: number, options = {}) =>
  useMutator<undefined, ReferralInvoiceResponse>(`/api/referral/invoices/${invoiceId}/mark-paid`, options);

