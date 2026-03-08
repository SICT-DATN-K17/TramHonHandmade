import { Product } from '@/types';
import { RawProductResponse } from '@/types/apiTypes';


export type ProductWithCategory = Product & { categoryName: string | null };

export const mapToProduct = (rawData: RawProductResponse): Product => {
    return {
        id: rawData.id,
        artisan_id: 1,
        category_id: rawData.categoryId,
        name: rawData.name,
        description: rawData.description ,
        price: rawData.price,
        image: rawData.image,
        status: rawData.status,
        quantity_sold: rawData.quantitySold,
        stock_quantity: rawData.stockQuantity,
        created_at: rawData.createdAt,
        updated_at: rawData.updatedAt,
    };
};

export const mapToProductWithCategory = (rawData: RawProductResponse): ProductWithCategory => {
    return {
        ...mapToProduct(rawData),
        categoryName: rawData.categoryName || null,
    };
}