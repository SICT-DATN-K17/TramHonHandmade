'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Image from "next/image";
import Link from "next/link";
import { Header, Footer } from "../../../components/common";
import { ShoppingCart, CreditCard, Store } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useCart } from '@/contexts/CartContext';

import { EnrichedCategory, mapToEnrichedCategory } from '@/utils/CategoryMapper';
import { RawCategoryResponse, PaginatedProductResponse } from '@/types/apiTypes';
import { isProductOutOfStock, getStockStatusText } from '@/lib/inventory';
import { axiosClient } from "@/lib/axios";
import { mapToProductWithCategory, ProductWithCategory } from '@/utils/ProductMapper';

const PRICE_RANGES = [
    { id: 'all', label: 'Tất cả', min: 0 },
    { id: 'under-100k', label: 'Dưới 100.000đ', min: 0, max: 100000 },
    { id: '100k-200k', label: '100.000 - 200.000đ', min: 100000, max: 200000 },
    { id: '200k-500k', label: '200.000 - 500.000đ', min: 200000, max: 500000 },
    { id: 'over-500k', label: 'Trên 500.000đ', min: 500000 },
];

const categoryIcons: Record<string, string> = {
    "Tất cả": "✨",
    "Đồng hồ": "🕰️",
    "Hoa vĩnh cửu": "🌹",
    "Quà tặng": "🎁",
    "Thiệp handmade": "💌",
    "Phụ kiện & nguyên liệu": "🧵",
    "Vải decor": "🧣",
    "Ví & passport": "💼",
    "Limited": "🌟",
};

const SORT_OPTIONS = [
    { id: 'featured', label: 'Nổi bật' },
    { id: 'price-asc', label: 'Giá tăng dần' },
    { id: 'price-desc', label: 'Giá giảm dần' },
];

function ProductsPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { addItem, buyNow } = useCart();

    const categoryIdParam = searchParams.get('categoryId') || 'all';
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const priceRangeParam = searchParams.get('priceRange') || 'all';
    const sortParam = searchParams.get('sort') || 'featured';
    const keywordParam = searchParams.get('keyword') || '';

    const [products, setProducts] = useState<ProductWithCategory[]>([]);
    const [categories, setCategories] = useState<EnrichedCategory[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState(keywordParam);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const pageSize = 24;
    const safePage = Math.max(0, pageParam - 1);

    useEffect(() => {
        const timer = setTimeout(() => {
            const currentKeyword = searchParams.get('keyword') || '';
            if (searchTerm !== currentKeyword) {
                updateUrlParams({ keyword: searchTerm, page: '1' });
            }
        }, 800); 
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    useEffect(() => {
        if (!keywordParam && searchTerm !== '') {
            setSearchTerm('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [keywordParam]);

    const updateUrlParams = useCallback((newParams: Record<string, string>) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));

        Object.entries(newParams).forEach(([key, value]) => {
            if (value === '' || value === 'all' || value === 'featured') {
                current.delete(key);
            } else {
                current.set(key, value);
            }
        });

        if (newParams.categoryId === 'all') current.delete('categoryId');

        const search = current.toString();
        const query = search ? `?${search}` : '';
        router.push(`${pathname}${query}`, { scroll: false });
    }, [searchParams, router, pathname]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                if (categories.length === 0) {
                    const categoriesRes = await axiosClient.get<RawCategoryResponse[]>('/categories/');
                    const catData = Array.isArray(categoriesRes.data) ? categoriesRes.data : (categoriesRes.data as any).content || [];
                    setCategories(catData.map(mapToEnrichedCategory));
                }

                const params = new URLSearchParams();
                params.set('size', String(pageSize));
                params.set('page', String(safePage));

                if (categoryIdParam !== 'all') params.set('categoryId', categoryIdParam);
                if (keywordParam) params.set('keyword', keywordParam);

                if (priceRangeParam !== 'all') {
                    const range = PRICE_RANGES.find(r => r.id === priceRangeParam);
                    if (range) {
                        if (range.min !== undefined) params.set('minPrice', String(range.min));
                        if (range.max !== undefined) params.set('maxPrice', String(range.max));
                    }
                }

                if (sortParam !== 'featured') params.set('sort', sortParam);

                const pagedResponse = await axiosClient.get<PaginatedProductResponse>('/products/', { params });
                const productData = pagedResponse.data;

                setTotalItems(productData.totalElements);
                setTotalPages(productData.totalPages);
                setProducts(productData.content.map(mapToProductWithCategory));

            } catch (error) {
                console.error("Failed to fetch data:", error);
                setProducts([]);
                setTotalItems(0);
            } finally {
                setLoading(false);
            }
        }

        fetchData().catch(console.error);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categoryIdParam, pageParam, priceRangeParam, sortParam, keywordParam]);

    const handleAddToCart = (e: React.MouseEvent, product: ProductWithCategory) => {
        e.preventDefault();
        e.stopPropagation();

        if (isProductOutOfStock(product)) {
            toast.error('Sản phẩm đã hết hàng');
            return;
        }

        addItem({
            id: product.id,
            productName: product.name,
            price: product.price,
            image: product.image || '/tramhon-logo.png',
            stockQuantity: product.stockQuantity,
            quantity: 1,
            artisanId: product.artisanId || undefined
        });

        toast.success('Đã thêm vào giỏ hàng!');
    };

    const handleBuyNow = (e: React.MouseEvent, product: ProductWithCategory) => {
        e.preventDefault();
        e.stopPropagation();

        if (isProductOutOfStock(product)) {
            toast.error('Sản phẩm đã hết hàng');
            return;
        }

        buyNow({
            id: product.id,
            productName: product.name,
            price: product.price,
            image: product.image || '/tramhon-logo.png',
            stockQuantity: product.stockQuantity,
            quantity: 1,
            artisanId: product.artisanId || undefined
        });

        // ĐÃ FIX: Truyền ID sản phẩm qua query string để trang Checkout biết cần thanh toán món nào
        router.push(`/checkout?ids=${product.id}`);
    };

    return (
        <main className="container mx-auto px-6 py-12"
            style={{ background: 'linear-gradient(to bottom, #F7F1E8, #F7F1E8)' }}>

            {/* Page Header */}
            <div className="mb-12 text-center">
                <h1 className="text-4xl font-bold mb-3" style={{ color: '#3F2E23' }}>
                    🛍️ Cửa hàng TRAMHON
                </h1>
                <div className="h-1 w-24 mx-auto rounded-full mb-4" style={{ backgroundColor: '#D96C39' }}></div>
                <p className="text-lg" style={{ color: '#6B4F3E' }}>
                    Khám phá bộ sưu tập sản phẩm thủ công độc đáo của chúng tôi
                </p>
            </div>

            {/* Search Bar */}
            <div className="mb-8 flex justify-center">
                <div className="relative max-w-md w-full">
                    <input
                        type="text"
                        placeholder="Tìm kiếm sản phẩm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-6 py-4 pl-12 pr-4 text-sm border rounded-full focus:outline-none focus:ring-2 focus:border-transparent shadow-sm hover:shadow-md transition-all duration-300"
                        style={{
                            backgroundColor: '#F7F1E8',
                            borderColor: '#D96C39',
                            color: '#3F2E23'
                        }}
                    />
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            style={{ color: '#D96C39' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Category Filter */}
            <div className="mb-10">
                <div className="flex flex-wrap gap-3 justify-center">
                    {[{ categoryId: 'all', categoryName: 'Tất cả' } as any, ...categories].map((category) => {
                        const isSelected = category.categoryId.toString() === categoryIdParam.toString();
                        return (
                            <button
                                key={category.categoryId}
                                onClick={() => updateUrlParams({ categoryId: String(category.categoryId), page: '1' })}
                                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-sm border`}
                                style={{
                                    backgroundColor: isSelected ? '#D96C39' : '#F7F1E8',
                                    color: isSelected ? 'white' : '#3F2E23',
                                    borderColor: '#D96C39'
                                }}
                            >
                                <span className="flex items-center gap-3">
                                    <span className="text-lg">{categoryIcons[String(category.categoryName)] ?? '🎁'}</span>
                                    <span>{category.categoryName}</span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Filter & Sort Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="md:col-span-1">
                    <div className="rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
                        style={{ backgroundColor: '#F7F1E8', borderColor: '#D96C39', border: '1px solid #D96C39' }}>
                        <h3 className="font-semibold mb-5 flex items-center gap-3 text-base" style={{ color: '#3F2E23' }}>
                            <span>Mức Giá</span>
                        </h3>
                        <div className="space-y-3">
                            {PRICE_RANGES.map((range) => (
                                <label key={range.id}
                                    className="flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-all duration-200"
                                    style={{ color: '#3F2E23' }}>
                                    <input
                                        type="radio"
                                        name="priceRange"
                                        value={range.id}
                                        checked={priceRangeParam === range.id}
                                        onChange={(e) => updateUrlParams({ priceRange: e.target.value, page: '1' })}
                                        className="w-4 h-4"
                                    />
                                    <span className={`text-sm ${priceRangeParam === range.id ? 'font-semibold' : ''}`}
                                        style={{ color: priceRangeParam === range.id ? '#D96C39' : '#3F2E23' }}>
                                        {range.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="md:col-span-3">
                    <div className="flex items-center justify-between mb-8 p-5 rounded-xl shadow-sm"
                        style={{ backgroundColor: '#F7F1E8', borderColor: '#D96C39', border: '1px solid #D96C39' }}>
                        <div className="text-sm font-medium" style={{ color: '#3F2E23' }}>
                            Tìm thấy <span style={{ color: '#D96C39', fontWeight: 'bold' }}>{totalItems}</span> sản phẩm
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium" style={{ color: '#3F2E23' }}>Sắp xếp:</span>
                            <select
                                value={sortParam}
                                onChange={(e) => updateUrlParams({ sort: e.target.value, page: '1' })}
                                className="px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 cursor-pointer"
                                style={{
                                    borderColor: '#D96C39',
                                    border: '1px solid #D96C39',
                                    backgroundColor: '#FFF8F0',
                                    color: '#3F2E23'
                                }}
                            >
                                {SORT_OPTIONS.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Products Grid */}
                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full opacity-50 pointer-events-none">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-96 rounded-xl bg-gray-200 animate-pulse"></div>
                            ))}
                        </div>
                    ) : products.length > 0 ? (
                        <div>
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                                {products.map((product, idx) => {
                                    const categoryName = categories.find(c => c.categoryId === product.categoryId)?.categoryName || 'Chưa phân loại';
                                    const isOutOfStock = isProductOutOfStock(product);

                                    let imageUrl = product.image || '/tramhon-logo.png';
                                    if (imageUrl.startsWith('//')) imageUrl = `https:${imageUrl}`;
                                    if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                                        imageUrl = `http://127.0.0.1:8000/${imageUrl}`;
                                    }

                                    return (
                                        <div key={`${product.id}-${idx}`} className="group relative h-full">
                                            <div
                                                className="rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col relative"
                                                style={{
                                                    backgroundColor: '#F7F1E8',
                                                    borderColor: '#D96C39',
                                                    border: '1px solid #E8D5B5',
                                                    animation: `fadeInUp 0.5s ease-out ${idx * 0.05}s backwards`
                                                }}>

                                                <Link href={`/shop/id/${product.id}`} className="absolute inset-0 z-0" />

                                                <div className="relative w-full h-48 overflow-hidden pointer-events-none" style={{ backgroundColor: '#E8D5B5' }}>
                                                    <Image
                                                        src={imageUrl}
                                                        alt={product.name}
                                                        fill
                                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                    />

                                                    {isOutOfStock && (
                                                        <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg z-10">
                                                            Hết hàng
                                                        </div>
                                                    )}

                                                    {product.quantitySold && product.quantitySold > 0 && !isOutOfStock && (
                                                        <div className="absolute top-3 right-3 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md" style={{ backgroundColor: '#D96C39' }}>
                                                            ⭐ Bán chạy
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="p-5 flex-1 flex flex-col pointer-events-none relative z-10">
                                                    <div className="flex items-center justify-between mb-3 gap-2">
                                                        <div className="text-xs font-semibold uppercase tracking-wide truncate" style={{ color: '#D96C39' }}>
                                                            {categoryName}
                                                        </div>
                                                        
                                                        {/* CLICK ĐƯỢC: Chuyển hướng sang trang Gian Hàng (Thêm z-20 pointer-events-auto) */}
                                                        <div className="flex items-center shrink-0 shadow-sm z-20 pointer-events-auto">
                                                            {product.artisanId ? (
                                                                <Link href={`/shop/artisan/${product.artisanId}`} className="text-[11px] text-orange-700 bg-orange-50 px-2 py-1 rounded border border-orange-200 font-bold flex items-center gap-1 hover:bg-orange-100 transition-colors">
                                                                    <Store size={12} className="text-orange-600" /> 
                                                                    <span className="truncate max-w-[120px]">{product.artisanName || 'Trạm Hồn'}</span>
                                                                </Link>
                                                            ) : (
                                                                <span className="text-[11px] text-orange-700 bg-orange-50 px-2 py-1 rounded border border-orange-200 font-bold flex items-center gap-1">
                                                                    <Store size={12} className="text-orange-600" /> 
                                                                    <span className="truncate max-w-[120px]">{product.artisanName || 'Trạm Hồn'}</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <h3 className="text-sm font-semibold mb-2 line-clamp-2 transition-colors" style={{ color: '#3F2E23' }}>
                                                        {product.name}
                                                    </h3>
                                                    <p className="text-xs mt-1 line-clamp-2 mb-4 flex-grow" style={{ color: '#6B4F3E' }}>
                                                        {product.description}
                                                    </p>
                                                    <div className="flex items-center justify-between pt-4 relative" style={{ borderTop: '1px solid #E8D5B5' }}>
                                                        <div className="flex flex-col">
                                                            <div className="text-lg font-semibold" style={{ color: '#D96C39' }}>
                                                                {product.price.toLocaleString("vi-VN")}₫
                                                            </div>
                                                            {isOutOfStock && (
                                                                <div className="text-xs font-semibold mt-1" style={{ color: '#DC2626' }}>
                                                                    {getStockStatusText(product)}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className={`absolute right-0 flex items-center gap-1 transition-opacity duration-300 pointer-events-auto ${isOutOfStock ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                            {isOutOfStock ? (
                                                                <div className="px-3 py-1.5 rounded-full text-white shadow-md flex items-center gap-1 text-[10px] font-medium cursor-not-allowed" style={{ backgroundColor: '#9CA3AF' }}>
                                                                    <span className="whitespace-nowrap">Hết hàng</span>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => handleAddToCart(e, product)}
                                                                        className="px-2 py-1.5 rounded-full text-white hover:scale-105 transition-transform shadow-md cursor-pointer flex items-center gap-1 text-[10px] font-medium"
                                                                        style={{ backgroundColor: '#D96C39' }}
                                                                    >
                                                                        <ShoppingCart size={12} />
                                                                        <span className="whitespace-nowrap">Thêm vào giỏ</span>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => handleBuyNow(e, product)}
                                                                        className="px-2 py-1.5 rounded-full text-white hover:scale-105 transition-transform shadow-md cursor-pointer flex items-center gap-1 text-[10px] font-medium"
                                                                        style={{ backgroundColor: '#3F2E23' }}
                                                                    >
                                                                        <CreditCard size={12} />
                                                                        <span className="whitespace-nowrap">Mua ngay</span>
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Pagination */}
                            <div className="mt-12 flex items-center justify-center gap-2 pb-8 w-full">
                                <button
                                    onClick={() => updateUrlParams({ page: String(safePage) })}
                                    disabled={safePage === 0}
                                    className="px-4 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        backgroundColor: '#F7F1E8',
                                        color: '#3F2E23',
                                        borderColor: '#D96C39',
                                        border: '1px solid #D96C39'
                                    }}
                                >
                                    ← Prev
                                </button>

                                {Array.from({ length: totalPages }).map((_, i) => {
                                    const show = totalPages <= 7 || Math.abs(i - safePage) <= 2 || i === 0 || i === totalPages - 1;
                                    if (!show) {
                                        if ((i === 1 && safePage > 3) || (i === totalPages - 2 && safePage < totalPages - 4)) {
                                            return <span key={`gap-${i}`} className="px-2 font-medium" style={{ color: '#D96C39' }}>…</span>;
                                        }
                                        return null;
                                    }
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => updateUrlParams({ page: String(i + 1) })}
                                            className="px-4 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-110 shadow-sm"
                                            style={{
                                                backgroundColor: i === safePage ? '#D96C39' : '#F7F1E8',
                                                color: i === safePage ? 'white' : '#3F2E23',
                                                borderColor: '#D96C39',
                                                border: '1px solid #D96C39'
                                            }}
                                        >
                                            {i + 1}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => updateUrlParams({ page: String(safePage + 2) })}
                                    disabled={safePage >= totalPages - 1}
                                    className="px-4 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        backgroundColor: '#F7F1E8',
                                        color: '#3F2E23',
                                        borderColor: '#D96C39',
                                        border: '1px solid #D96C39'
                                    }}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <div className="text-8xl mb-6 animate-bounce">🔍</div>
                            <h3 className="text-2xl font-semibold mb-3" style={{ color: '#3F2E23' }}>
                                Không tìm thấy sản phẩm
                            </h3>
                            <p className="text-base" style={{ color: '#6B4F3E' }}>
                                {keywordParam
                                    ? `Không có sản phẩm nào phù hợp với "${keywordParam}".`
                                    : "Hãy thử chọn danh mục hoặc mức giá khác."}
                            </p>
                            <button
                                onClick={() => router.push('/shop/products')}
                                className="mt-4 px-6 py-2 rounded-full text-white text-sm font-medium hover:opacity-90 transition-opacity"
                                style={{ backgroundColor: '#D96C39' }}
                            >
                                Xóa bộ lọc
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </main>
    );
}

export default function ProductsPage() {
    return (
        <div className="min-h-screen font-sans" style={{ backgroundColor: '#F7F1E8', color: '#3F2E23' }}>
            <Toaster position="top-center" />
            <Header />
            <Suspense fallback={
                <main className="container mx-auto px-6 py-8">
                    <div className="text-center py-16">
                        <div className="text-lg font-medium animate-pulse" style={{ color: '#D96C39' }}>
                            ✨ Đang tải...
                        </div>
                    </div>
                </main>
            }>
                <ProductsPageContent />
            </Suspense>
            <Footer />
        </div>
    );
}