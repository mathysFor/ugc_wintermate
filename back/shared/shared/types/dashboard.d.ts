export type CampaignMonthlyViews = {
  campaignId: number;
  campaignTitle: string;
  views: number;
};

export type BrandMonthlyData = {
  month: string;
  totalViews: number;
  totalCost: number;
  acceptedVideosCount: number;
  activeCampaignsCount: number;
  creatorsCount: number;
  averageCpm: number;
  campaignBreakdown: CampaignMonthlyViews[];
};

export type BrandDashboardStats = {
  monthlyData: BrandMonthlyData[];
  totalViews: number;
  totalSpent: number;
  activeCampaigns: number;
  averageRoi: number;
  viewsTrend: number;
  spentTrend: number;
  creatorsCount: number;
  acceptedVideosCount: number;
  averageCpm: number;
  acceptedVideosTrend: number;
  creatorsTrend: number;
};

export type BrandDashboardStatsResponse = BrandDashboardStats;

export type CreatorMonthlyData = {
  month: string;
  submissions: number;
  earnings: number;
};

export type TopVideo = {
  videoId: string;
  title: string;
  views: number;
  likes: number;
  coverImageUrl: string;
  submissionId?: number;
  campaignTitle?: string;
  submittedAt?: string;
  tiktokVideoId?: string;
  earnings?: number;
};

export type CreatorDashboardStats = CreatorDashboardStatsResponse;

export type CreatorDashboardStatsResponse = {
  totalSubmissions: number;
  acceptedSubmissions: number;
  pendingSubmissions: number;
  refusedSubmissions: number;
  totalEarnings: number;
  pendingEarnings: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  connectedAccounts: number;
  totalViews: number;
  monthlyData?: Array<{
    month: string;
    submissions: number;
    earnings: number;
  }>;
  viewsTrend?: number;
  earningsTrend?: number;
  topVideosByViews?: Array<{
    videoId: string;
    title: string;
    views: number;
    likes: number;
    coverImageUrl: string;
    submissionId?: number;
    campaignTitle?: string;
    submittedAt?: string;
    tiktokVideoId?: string;
  }>;
  topVideosByEarnings?: Array<{
    videoId: string;
    title: string;
    earnings: number;
    views: number;
    coverImageUrl: string;
    submissionId?: number;
    campaignTitle?: string;
    tiktokVideoId?: string;
  }>;
  submissionsByMonth: Array<{
    month: string;
    count: number;
  }>;
  earningsByMonth: Array<{
    month: string;
    amount: number;
  }>;
  recentSubmissions: Array<{
    id: number;
    campaignTitle: string;
    status: string;
    views: number;
    submittedAt: string;
  }>;
  recentVideos: Array<{
    videoId: string;
    title: string;
    views: number;
    likes: number;
    coverImageUrl: string;
  }>;
  connectedTiktokAccounts: Array<{
    id: number;
    username: string;
    isValid: boolean;
  }>;
};

