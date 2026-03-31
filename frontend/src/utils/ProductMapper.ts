import { Product } from '@/types';
import { RawProductResponse } from '@/types/apiTypes';

export type ProductWithCategory = Product & { categoryName: string | null };

export const mapToProduct = (rawData: RawProductResponse): Product => {
    return {
        id: rawData.id,
        artisanId: rawData.artisanId || null,
        artisanName: rawData.artisanName || 'Trạm Hồn', // Lấy tên shop từ Backend
        categoryId: rawData.categoryId,
        categoryName: rawData.categoryName || undefined,
        name: rawData.name,
        description: rawData.description,
        price: rawData.price,
        image: rawData.image,
        status: rawData.status,
        quantitySold: rawData.quantitySold,
        stockQuantity: rawData.stockQuantity,
        createdAt: rawData.createdAt,
        updatedAt: rawData.updatedAt,
    };
};

export const mapToProductWithCategory = (rawData: RawProductResponse): ProductWithCategory => {
    return {
        ...mapToProduct(rawData),
        categoryName: rawData.categoryName || null,
    };
}