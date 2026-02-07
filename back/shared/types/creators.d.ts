export type CreatorListItem = {
  id: number;
  firstName: string;
  lastName: string;
  username: string | null;
  totalViews: number;
  totalPaid: number;
  videosCount: number;
  campaignsCount: number;
  createdAt: string;
};

export type CreatorsListResponse = {
  items: CreatorListItem[];
  nextCursor: number | null;
  hasMore: boolean;
};

export type CreatorsStatsResponse = {
  totalViews: number;
  totalPaid: number;
  creatorsCount: number;
  averageViewsPerCreator: number;
};

export type CreatorTrackingItem = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  tiktokConnected: boolean;
  hasPublished: boolean;
  username: string | null;
};

export type CreatorsTrackingResponse = {
  items: CreatorTrackingItem[];
  nextCursor: number | null;
  hasMore: boolean;
};
