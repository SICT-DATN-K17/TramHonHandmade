'use client';

import { ProductsClient } from '@/components/artisan/products/ProductsClient';
import { useEffect, useState, useCallback } from 'react';
import useAxiosAuth from '@/hooks/useAxiosAuth';
import { mapToProduct } from '@/utils/ProductMapper';
import { Product } from '@/types';
import { PaginatedProductResponse } from '@/types/apiTypes';

const ProductsPage = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    // 1. Khởi tạo axiosAuth hook
    const axiosAuth = useAxiosAuth();

    // 2. Hàm lấy danh sách sản phẩm (dùng useCallback để tối ưu cho useEffect)
    const fetchProducts = useCallback(async () => {
        try {
            setIsLoading(true);

            const response = await axiosAuth.get<PaginatedProductResponse>('/products/?page=0&size=2000&artisan=true');

            const mappedProducts = response.data.content.map(mapToProduct);
            setProducts(mappedProducts);
        } catch (error) {
            console.error('Failed to fetch products:', error);
            setProducts([]);
        } finally {
            setIsLoading(false);
        }
    }, [axiosAuth]); // Thêm axiosAuth vào dependency

    // 3. Effect gọi API khi component mount hoặc refreshKey thay đổi
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts, refreshKey]);

    // Listen for custom refresh event
    useEffect(() => {
        const handleRefresh = () => {
            setRefreshKey(prev => prev + 1);
        };

        // Listen for custom refresh event
        window.addEventListener('products-refresh', handleRefresh);

        // Also listen for focus event to refresh when user returns to tab
        const handleFocus = () => {
            setRefreshKey(prev => prev + 1);
        };
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('products-refresh', handleRefresh);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f172a] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải sản phẩm...</p>
                </div>
            </div>
        );
    }

    return <ProductsClient data={products} />;
};

export default ProductsPage;