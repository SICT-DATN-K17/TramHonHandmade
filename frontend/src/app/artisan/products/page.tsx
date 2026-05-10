'use client';

import { ProductsClient } from '@/components/artisan/products/ProductsClient';
import { useEffect, useState, useCallback } from 'react';
import useAxiosAuth from '@/hooks/useAxiosAuth';
import { mapToProductWithCategory, ProductWithCategory } from '@/utils/ProductMapper'; 
import { PaginatedProductResponse } from '@/types/apiTypes';

const ProductsPage = () => {
    const [products, setProducts] = useState<ProductWithCategory[]>([]);
    const axiosAuth = useAxiosAuth();

    const fetchProducts = useCallback(async () => {
        try {
            const response = await axiosAuth.get<PaginatedProductResponse>('/products/?page=0&size=2000&artisan=true');
            const mappedProducts = response.data.content.map(mapToProductWithCategory);
            
            setProducts(mappedProducts);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        }
    }, [axiosAuth]);

    useEffect(() => {
        fetchProducts();

        const handleSilentRefresh = () => fetchProducts();

        const intervalId = setInterval(handleSilentRefresh, 10000);
        
        window.addEventListener('products-refresh', handleSilentRefresh);
        window.addEventListener('focus', handleSilentRefresh);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('products-refresh', handleSilentRefresh);
            window.removeEventListener('focus', handleSilentRefresh);
        };
    }, [fetchProducts]);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <ProductsClient data={products || []} />
        </div>
    );
};

export default ProductsPage;