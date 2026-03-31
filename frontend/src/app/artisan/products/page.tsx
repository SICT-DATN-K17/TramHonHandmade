'use client';

import { ProductsClient } from '@/components/artisan/products/ProductsClient';
import { useEffect, useState, useCallback } from 'react';
import useAxiosAuth from '@/hooks/useAxiosAuth';
import { mapToProductWithCategory, ProductWithCategory } from '@/utils/ProductMapper'; // Đổi mapper
import { PaginatedProductResponse } from '@/types/apiTypes';

const ProductsPage = () => {
    const [products, setProducts] = useState<ProductWithCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    const axiosAuth = useAxiosAuth();

    const fetchProducts = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await axiosAuth.get<PaginatedProductResponse>('/products/?page=0&size=2000&artisan=true');
            const mappedProducts = response.data.content.map(mapToProductWithCategory);
            setProducts(mappedProducts);
        } catch (error) {
            console.error('Failed to fetch products:', error);
            setProducts([]);
        } finally {
            setIsLoading(false);
        }
    }, [axiosAuth]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts, refreshKey]);

    useEffect(() => {
        const handleRefresh = () => setRefreshKey(prev => prev + 1);
        const handleFocus = () => setRefreshKey(prev => prev + 1);

        window.addEventListener('products-refresh', handleRefresh);
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('products-refresh', handleRefresh);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D96C39] mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium animate-pulse">Đang tải sản phẩm...</p>
                </div>
            </div>
        );
    }

    return <ProductsClient data={products || []} />;
};

export default ProductsPage;