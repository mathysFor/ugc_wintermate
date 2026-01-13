export type BrandSector =
  | 'fashion'
  | 'beauty'
  | 'tech'
  | 'food'
  | 'travel'
  | 'lifestyle'
  | 'gaming'
  | 'sports'
  | 'music'
  | 'immobilier'
  | 'other';

export type BrandResponse = {
  id: number;
  userId: number;
  name: string;
  sector: BrandSector;
  website: string | null;
  logoUrl: string | null;
  createdAt: string;
};

export type CreateBrandInput = {
  name: string;
  sector: BrandSector;
  website?: string;
  logoUrl?: string;
};

export type UpdateBrandInput = {
  name?: string;
  sector?: BrandSector;
  website?: string;
  logoUrl?: string;
};

