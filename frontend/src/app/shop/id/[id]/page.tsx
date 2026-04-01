'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { useCart } from '@/contexts/CartContext';
import toast, { Toaster } from 'react-hot-toast';
import { Store } from 'lucide-react';
import { isProductOutOfStock, getStockStatusText } from '@/lib/inventory';
import { axiosClient } from "@/lib/axios";
import { RawProductResponse } from "@/types/apiTypes";
import { ProductWithCategory, mapToProductWithCategory } from "@/utils/ProductMapper";

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const productId = Number(params.id);
    const { addItem, buyNow } = useCart();

    const [product, setProduct] = useState<ProductWithCategory | null>(null);
    const [categoryName, setCategoryName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [addToCartSuccess, setAddToCartSuccess] = useState(false);

    useEffect(() => {
        if (!productId || Number.isNaN(productId)) {
            setError('ID sản phẩm không hợp lệ');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const fetchProduct = async () => {
            try {
                const productData = await axiosClient.get<RawProductResponse>(`/products/${productId}/`);
                const productWithCategory = mapToProductWithCategory(productData.data);
                setProduct(productWithCategory);
                setCategoryName(productWithCategory.categoryName || null);
            } catch (err) {
                setError('Không tải được sản phẩm');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchProduct().catch(console.error);
    }, [productId]);

    const increase = () =>
        setQuantity((q) => {
            const max = product?.stockQuantity ?? 9999;
            return Math.min(max, q + 1);
        });
    const decrease = () => setQuantity((q) => Math.max(1, q - 1));

    const onQuantityChange = (value: string) => {
        const parsed = Number(value);
        if (Number.isNaN(parsed)) {
            setQuantity(1);
            return;
        }
        const min = 1;
        const max = product?.stockQuantity ?? 9999;

        if (parsed > max) {
            toast.error(`Số lượng tồn kho chỉ còn ${max} sản phẩm.`);
        }

        const clamped = Math.max(min, Math.min(max, Math.floor(parsed)));
        setQuantity(clamped);
    };

    const handleAddToCart = () => {
        if (!product || !product.id) return;

        addItem({
            id: product.id,
            productName: product.name,
            price: Number(product.price ?? 0),
            artisanId: product.artisanId || undefined,
            image: product.image
                ? product.image.startsWith('//')
                    ? `https:${product.image}`
                    : product.image.startsWith('http')
                        ? product.image
                        : product.image.startsWith('/')
                            ? product.image
                            : `/${product.image}`
                : '/tramhon-logo.png',
            stockQuantity: product.stockQuantity,
            quantity: quantity,
        });

        setAddToCartSuccess(true);
        setTimeout(() => setAddToCartSuccess(false), 3000);
    };

    const handleBuyNow = () => {
        if (!product || !product.id) return;

        buyNow({
            id: product.id,
            productName: product.name,
            price: Number(product.price ?? 0),
            artisanId: product.artisanId || undefined,
            image: product.image
                ? product.image.startsWith('//')
                    ? `https:${product.image}`
                    : product.image.startsWith('http')
                        ? product.image
                        : product.image.startsWith('/')
                            ? product.image
                            : `/${product.image}`
                : '/tramhon-logo.png',
            stockQuantity: product.stockQuantity,
            quantity: quantity,
        });
        router.push('/checkout');
    };

    return (
        <div className="min-h-screen font-sans text-gray-800 bg-white">
            <Toaster position="top-center" />
            <Header />

            <main className="container mx-auto px-6 py-12">
                {loading ? (
                    <div className="text-center py-24">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D96C39] mx-auto"></div>
                        <p className="mt-4 text-[#6B4F3E]">Đang tải dữ liệu sản phẩm...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-24">
                        <h2 className="text-2xl font-semibold mb-4 text-[#3F2E23]">Lỗi</h2>
                        <p className="text-red-600 mb-6">{error}</p>
                        <Link href="/shop/products" className="text-[#D96C39] hover:underline font-medium">
                            ← Quay lại cửa hàng
                        </Link>
                    </div>
                ) : !product ? (
                    <div className="text-center py-24">
                        <h2 className="text-2xl font-semibold mb-4 text-[#3F2E23]">Không tìm thấy sản phẩm</h2>
                        <Link href="/shop/products" className="text-[#D96C39] hover:underline font-medium">
                            ← Quay lại cửa hàng
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
                        {/* Image Section */}
                        <div>
                            <div className="relative rounded-2xl overflow-hidden shadow-md border border-[#E8D5B5]">
                                <div className="w-full h-[450px] relative bg-[#FFF8F0]">
                                    <Image
                                        src={
                                            product.image
                                                ? product.image.startsWith('//')
                                                    ? `https:${product.image}`
                                                    : product.image.startsWith('http')
                                                        ? product.image
                                                        : product.image.startsWith('/')
                                                            ? product.image
                                                            : `/${product.image}`
                                                : '/tramhon-logo.png'
                                        }
                                        alt={product.name ?? 'Product Image'}
                                        fill
                                        className="object-cover hover:scale-105 transition-transform duration-500"
                                        priority
                                    />
                                    {isProductOutOfStock(product) && (
                                        <div className="absolute top-4 left-4 bg-red-600 text-white px-5 py-2.5 rounded-lg font-bold text-base shadow-lg z-10">
                                            Hết hàng
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Details Section */}
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl font-bold text-[#3F2E23] mb-3">{product.name}</h1>
                                
                                {/* 👉 CLICK ĐƯỢC: Chuyển hướng sang trang Gian Hàng */}
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                    <div className="flex items-center shrink-0">
                                        {product.artisanId ? (
                                            <Link href={`/shop/artisan/${product.artisanId}`} className="text-sm text-orange-700 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200 font-medium flex items-center gap-2 shadow-sm hover:bg-orange-100 hover:scale-105 transition-all">
                                                <Store size={14} className="text-orange-600" />
                                                <span>Gian hàng: <strong className="ml-1">{product.artisanName || 'Trạm Hồn'}</strong></span>
                                            </Link>
                                        ) : (
                                            <span className="text-sm text-orange-700 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200 font-medium flex items-center gap-2 shadow-sm">
                                                <Store size={14} className="text-orange-600" />
                                                <span>Gian hàng: <strong className="ml-1">{product.artisanName || 'Trạm Hồn'}</strong></span>
                                            </span>
                                        )}
                                    </div>
                                    
                                    {categoryName && (
                                        <Link href={`/shop/products?categoryId=${product.categoryId}`} className="text-sm font-medium text-[#D96C39] bg-[#FFF8F0] px-3 py-1.5 rounded-full border border-[#E8D5B5] hover:bg-[#FCE9D8] transition-colors">
                                            {categoryName}
                                        </Link>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-2xl font-extrabold text-[#D96C39]">
                                    ₫{(product.price || 0).toLocaleString('vi-VN')}
                                </div>
                                {isProductOutOfStock(product) && (
                                    <div className="px-4 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-full text-sm font-semibold">
                                        {getStockStatusText(product)}
                                    </div>
                                )}
                            </div>

                            {product.description && (
                                <div className="text-base text-[#6B4F3E] leading-relaxed p-4 bg-[#FDFBF7] rounded-xl border border-[#E8D5B5]">
                                    {product.description}
                                </div>
                            )}

                            {/* Quantity and Actions */}
                            <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
                                <div className={`flex items-center border-2 border-[#E8D5B5] rounded-full overflow-hidden ${isProductOutOfStock(product) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <button
                                        onClick={decrease}
                                        aria-label="Giảm số lượng"
                                        className="px-5 py-3 bg-[#FFF8F0] hover:bg-[#FCE9D8] disabled:opacity-50 transition-colors text-[#3F2E23] font-bold"
                                        disabled={quantity <= 1 || isProductOutOfStock(product)}
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        min={1}
                                        max={product.stockQuantity ?? 9999}
                                        value={quantity}
                                        onChange={(e) => onQuantityChange(e.target.value)}
                                        className="w-16 text-center px-2 py-3 outline-none appearance-none bg-white font-bold text-[#3F2E23]"
                                        aria-label="Số lượng"
                                        disabled={isProductOutOfStock(product)}
                                    />
                                    <button
                                        onClick={increase}
                                        aria-label="Tăng số lượng"
                                        className="px-5 py-3 bg-[#FFF8F0] hover:bg-[#FCE9D8] disabled:opacity-50 transition-colors text-[#3F2E23] font-bold"
                                        disabled={quantity >= (product.stockQuantity ?? 9999) || isProductOutOfStock(product)}
                                    >
                                        +
                                    </button>
                                </div>

                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    {isProductOutOfStock(product) ? (
                                        <div className="flex-1 px-8 py-3 rounded-full font-semibold shadow-sm bg-gray-200 text-gray-500 text-center cursor-not-allowed">
                                            Hết hàng
                                        </div>
                                    ) : (
                                        <button
                                            className={`flex-1 sm:flex-none border-2 border-[#D96C39] bg-white text-[#D96C39] px-8 py-3 rounded-full font-bold shadow-sm hover:bg-[#FFF8F0] transition-all duration-300 relative ${addToCartSuccess ? 'bg-green-50 border-green-500 text-green-600' : ''}`}
                                            onClick={handleAddToCart}
                                            disabled={product.stockQuantity !== undefined && product.stockQuantity <= 0}
                                        >
                                            {addToCartSuccess ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    Đã thêm!
                                                </span>
                                            ) : (
                                                'Thêm vào giỏ'
                                            )}
                                        </button>
                                    )}
                                    {!isProductOutOfStock(product) && (
                                        <button
                                            className="flex-1 sm:flex-none bg-[#3F2E23] text-white px-8 py-3 border-2 border-[#3F2E23] rounded-full font-bold shadow hover:bg-[#2A1F17] hover:border-[#2A1F17] transition-all duration-300 text-center"
                                            onClick={handleBuyNow}
                                        >
                                            Mua ngay
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Custom Request Button */}
                            <div className="pt-4 mt-4 border-t border-[#E8D5B5]">
                                <Link
                                    href={`/custom-request/${productId}`}
                                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-4 rounded-xl font-bold shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-300 transform hover:-translate-y-1"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                        <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 019.75 22.5a.75.75 0 01-.75-.75v-4.131A15.838 15.838 0 016.382 15H2.25a.75.75 0 01-.75-.75 6.75 6.75 0 017.815-6.666zM15 6.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" clipRule="evenodd" />
                                    </svg>
                                    <span>Yêu cầu tùy chỉnh theo mẫu này</span>
                                </Link>
                                <p className="text-center text-xs text-[#6B4F3E] mt-2">
                                    Bạn thích mẫu này nhưng muốn đổi màu, kích thước? Hãy chat trực tiếp với Nghệ nhân!
                                </p>
                            </div>

                            {/* Meta Info */}
                            <div className="flex items-center gap-6 mt-6 pt-4 border-t border-[#E8D5B5] text-sm text-[#6B4F3E] font-medium">
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#D96C39]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    Tồn kho: {product.stockQuantity ?? '—'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#D96C39]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                    Đã bán: {product.quantitySold ?? '—'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}