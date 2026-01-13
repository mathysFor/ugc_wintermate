import type { SubmissionWithRelations } from './submissions';
import type { CampaignReward } from './rewards';

export type PaymentMethod = 'invoice' | 'gift_card';

export type InvoiceStatus = 'uploaded' | 'paid';

export type Invoice = {
  id: number;
  submissionId: number;
  rewardId: number;
  pdfUrl: string | null;
  paymentMethod: PaymentMethod;
  status: InvoiceStatus;
  uploadedAt: string;
  paidAt: string | null;
};

export type InvoiceWithRelations = Invoice & {
  submission: {
    id: number;
    campaignId: number;
    tiktokAccountId: number;
    tiktokVideoId: string;
    coverImageUrl: string | null;
    status: 'pending' | 'accepted' | 'refused';
    submittedAt: string;
    validatedAt: string | null;
    refuseReason: string | null;
    adsCode: string | null;
  };
  reward: CampaignReward;
  campaign: {
    id: number;
    title: string;
    coverImageUrl: string | null;
    brandName: string;
  };
  creatorUsername?: string;
  adsCodesStatus?: AdsCodesStatus;
};

export type InvoiceResponse = InvoiceWithRelations;

export type AdsCodeInput = {
  submissionId: number;
  adsCode: string;
};

export type AdsCodesStatus = {
  totalVideos: number;
  videosWithAdsCode: number;
  videos: Array<{
    submissionId: number;
    tiktokVideoId: string;
    tiktokUsername: string;
    hasAdsCode: boolean;
    adsCode: string | null;
  }>;
};

export type PaginatedInvoicesResponse = {
  items: InvoiceWithRelations[];
  nextCursor: number | null;
  hasMore: boolean;
  pendingCount?: number;
};

