import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { useFetcher, useMutator } from "@/api/api";
import { axiosUpload } from "@/api/axios";
import type {
  InvoiceResponse,
  PaginatedInvoicesResponse,
  AdsCodeInput,
  PaymentMethod,
} from "@shared/types/invoices";

export const useGetInvoices = (
  params?: { cursor?: string; limit?: number; status?: string },
  options = {}
) =>
  useFetcher<typeof params, PaginatedInvoicesResponse>({
    key: ["invoices", params],
    path: "/api/invoices",
    params,
    options,
  });

export const useGetCampaignInvoices = (
  campaignId: number,
  params?: { cursor?: string; limit?: number; status?: string },
  options = {}
) =>
  useFetcher<typeof params, PaginatedInvoicesResponse>({
    key: ["campaigns", campaignId, "invoices", params],
    path: `/api/campaigns/${campaignId}/invoices`,
    params,
    options: {
      enabled: !!campaignId,
      ...options,
    },
  });

export const useGetBrandInvoices = (
  params?: { status?: 'uploaded' | 'paid'; cursor?: string; limit?: number },
  options = {}
) =>
  useFetcher<typeof params, PaginatedInvoicesResponse>({
    key: ["brand-invoices", params],
    path: "/api/invoices/brand",
    params,
    options,
  });

/**
 * Input pour uploader une facture avec un fichier PDF et les codes d'ads
 * Le fichier est optionnel si paymentMethod === 'gift_card'
 */
export type UploadInvoiceFileInput = {
  submissionId: number;
  rewardId: number;
  paymentMethod: PaymentMethod;
  file?: File;
  adsCodes: AdsCodeInput[];
};

/**
 * Hook pour uploader une facture PDF avec les codes d'ads
 * Utilise FormData pour envoyer le fichier
 * Si paymentMethod === 'gift_card', pas de fichier requis
 */
export const useUploadInvoice = (
  options: Partial<UseMutationOptions<InvoiceResponse, Error, UploadInvoiceFileInput>> = {}
) => {
  return useMutation<InvoiceResponse, Error, UploadInvoiceFileInput>({
    mutationFn: async (input: UploadInvoiceFileInput): Promise<InvoiceResponse> => {
      const formData = new FormData();
      formData.append('submissionId', String(input.submissionId));
      formData.append('rewardId', String(input.rewardId));
      formData.append('paymentMethod', input.paymentMethod);
      formData.append('adsCodes', JSON.stringify(input.adsCodes));
      
      if (input.file) {
        formData.append('file', input.file);
      }

      return axiosUpload<InvoiceResponse>('/api/invoices', formData);
    },
    ...options,
  });
};

export const useMarkInvoicePaid = (invoiceId: number, options = {}) =>
  useMutator<undefined, InvoiceResponse>(`/api/invoices/${invoiceId}/mark-paid`, options);
