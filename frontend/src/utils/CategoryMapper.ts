import { Category } from '@/types';
import { RawCategoryResponse } from '@/types/apiTypes';

export type EnrichedCategory = Category & { soldCount: number };

export const mapToEnrichedCategory = (rawData: RawCategoryResponse): EnrichedCategory => {
    return {
        categoryId: rawData.categoryId,
        categoryName: rawData.categoryName,
        soldCount: rawData.soldCount || 0,
        slug: rawData.slug,
        parentId: rawData.parentId,
        createdAt: rawData.createdAt,
        updatedAt: rawData.updatedAt,
    };
}