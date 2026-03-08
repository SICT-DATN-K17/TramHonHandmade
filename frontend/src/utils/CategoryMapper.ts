import { Category } from '@/types';
import { RawCategoryResponse } from '@/types/apiTypes';

export type EnrichedCategory = Category & { soldCount: number };

export const mapToEnrichedCategory = (rawData: RawCategoryResponse): EnrichedCategory => {
    return {
        id: rawData.categoryId,
        name: rawData.categoryName,
        soldCount: rawData.soldCount,
        slug: rawData.slug,
        parent_id: rawData.parentId,
        created_at: rawData.createdAt,
        updated_at: rawData.updatedAt,
    };
}