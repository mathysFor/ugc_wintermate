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


