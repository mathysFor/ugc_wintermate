import type { PaymentMethod, InvoiceStatus } from './invoices';
import type { AuthUser } from './auth';

export type Referee = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isCreator: boolean;
  isBrand: boolean;
  createdAt: string;
  totalCommissions?: number;
};

export type ReferralCommission = {
  id: number;
  referrerId: number;
  refereeId: number;
  invoiceId: number;
  amountEur: number;
  status: 'pending' | 'available' | 'withdrawn';
  createdAt: string;
};

export type ReferralCommissionWithReferee = ReferralCommission & {
  referee: Referee;
  campaignTitle?: string;
  rewardViewsTarget?: number;
};

export type ReferralInvoice = {
  id: number;
  userId: number;
  pdfUrl: string | null;
  paymentMethod: PaymentMethod;
  amountEur: number;
  status: InvoiceStatus;
  uploadedAt: string;
  paidAt: string | null;
};

export type ReferralInvoiceWithCreator = ReferralInvoice & {
  creator: AuthUser;
};

export type ReferralDashboardResponse = {
  referralCode: string;
  referralPercentage: number;
  availableAmount: number;
  withdrawnAmount: number;
  pendingAmount: number;
  refereeCount: number;
};

export type PaginatedRefereesResponse = {
  items: Referee[];
  nextCursor: number | null;
  hasMore: boolean;
};

export type PaginatedReferralCommissionsResponse = {
  items: ReferralCommissionWithReferee[];
  nextCursor: number | null;
  hasMore: boolean;
};

export type PaginatedReferralInvoicesResponse = {
  items: ReferralInvoice[];
  nextCursor: number | null;
  hasMore: boolean;
};

export type PaginatedReferralInvoicesForBrandResponse = {
  items: ReferralInvoiceWithCreator[];
  nextCursor: number | null;
  hasMore: boolean;
};

export type ReferralInvoiceResponse = ReferralInvoice;

