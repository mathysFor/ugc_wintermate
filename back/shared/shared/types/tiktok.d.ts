export type TiktokAccount = {
  id: number;
  userId: number;
  tiktokUserId: string;
  username: string;
  isValid: boolean;
  expiresAt: string;
  createdAt: string;
};

export type TiktokVideo = {
  id?: string;
  videoId: string;
  title: string;
  description?: string;
  coverImageUrl: string;
  shareUrl?: string;
  embedLink?: string;
  duration: number;
  createTime: number;
  createdAt?: string;
  stats?: {
    viewCount: number;
    likeCount: number;
    commentCount: number;
    shareCount: number;
  };
};

export type TiktokAuthUrlResponse = {
  authUrl: string;
  state: string;
  codeVerifier: string;
};

export type TiktokCallbackInput = {
  code: string;
  state: string;
  codeVerifier: string;
};

export type ConnectTiktokResponse = {
  account: TiktokAccount;
  message: string;
};

export type TiktokAccountsListResponse = TiktokAccount[];

export type TiktokVideosListResponse = {
  videos: TiktokVideo[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type TiktokRefreshTokenResponse = {
  success?: boolean;
  account: TiktokAccount;
  message: string;
};

