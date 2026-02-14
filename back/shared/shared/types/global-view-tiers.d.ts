export type GlobalViewTier = {
  id: number;
  viewsTarget: number;
  rewardLabel: string;
  createdAt: string;
  updatedAt: string;
};

export type GlobalViewTierResponse = GlobalViewTier;

export type GlobalViewTiersResponse = GlobalViewTierResponse[];

export type UpsertGlobalViewTierInput = {
  viewsTarget: number;
  rewardLabel: string;
};

export type UpsertGlobalViewTiersInput = {
  tiers: UpsertGlobalViewTierInput[];
};
