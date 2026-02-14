import type { BrandResponse } from './brands';

export type AcademyContentType = 'video' | 'article' | 'resource';

export type AcademyDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type AcademyCategory = {
  id: number;
  brandId: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type AcademyContent = {
  id: number;
  brandId: number;
  categoryId: number;
  title: string;
  slug: string;
  description: string;
  contentType: AcademyContentType;
  videoUrl: string | null;
  articleContent: string | null;
  resourceUrl: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  difficulty: AcademyDifficulty;
  order: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AcademyContentWithRelations = AcademyContent & {
  category: AcademyCategory;
  brand: Pick<BrandResponse, 'id' | 'name' | 'logoUrl'>;
};

export type AcademyContentResponse = AcademyContentWithRelations;

export type PaginatedAcademyResponse = {
  items: AcademyContentWithRelations[];
  nextCursor: number | null;
  hasMore: boolean;
};

export type AcademyCategoryResponse = AcademyCategory;

export type AcademyCategoriesResponse = AcademyCategory[];

export type CreateAcademyContentInput = {
  categoryId: number;
  title: string;
  description: string;
  contentType: AcademyContentType;
  videoUrl?: string;
  articleContent?: string;
  resourceUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  difficulty: AcademyDifficulty;
  order?: number;
};

export type UpdateAcademyContentInput = Partial<CreateAcademyContentInput>;

export type CreateAcademyCategoryInput = {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order?: number;
};

export type UpdateAcademyCategoryInput = Partial<CreateAcademyCategoryInput>;
