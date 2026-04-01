'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from "next/image";
import Link from "next/link";
import { useCart } from '@/contexts/CartContext';
import toast, { Toaster } from 'react-hot-toast';
import { ShoppingCart, CreditCard, Store, User as UserIcon, Calendar, Sparkles, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Header, Footer } from "@/components/common";

import { axiosClient } from '@/lib/axios';
import { mapToProductWithCategory, ProductWithCategory } from '@/utils/ProductMapper';
import { mapToUser } from '@/utils/UserMapper';
import { PaginatedProductResponse, RawUserResponse } from '@/types/apiTypes';
import { User } from '@/types';
import { isProductOutOfStock, getStockStatusText } from '@/lib/inventory';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function ArtisanProfilePage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const artisanId = Array.isArray(params.id) ? Number(params.id[0]) : Number(params.id);

    // --- LOGIC PHÂN TRANG ---
    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = 12; // Số sản phẩm mỗi trang
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const [artisan, setArtisan] = useState<User | null>(null);
    const [products, setProducts] = useState<ProductWithCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { addItem, buyNow } = useCart();

    const fetchArtisanAndProducts = useCallback(async () => {
        if (!artisanId || Number.isNaN(artisanId)) {
            setError("ID Nghệ nhân không hợp lệ");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            // 1. Fetch thông tin Nghệ nhân (Chỉ chạy lần đầu hoặc khi ID đổi)
            if (!artisan || artisan.id !== artisanId) {
                const userRes = await axiosClient.get<RawUserResponse>(`/users/${artisanId}/`);
                if (userRes.data.role !== 'ARTISAN') {
                    setError("Không tìm thấy gian hàng Nghệ nhân này.");
                    setLoading(false);
                    return;
                }
                setArtisan(mapToUser(userRes.data));
            }

            // 2. Fetch sản phẩm theo trang (Gửi page - 1 vì Backend tính từ 0)
            const productRes = await axiosClient.get<PaginatedProductResponse>(
                `/products/?artisanId=${artisanId}&size=${pageSize}&page=${currentPage - 1}`
            );
            
            setProducts(productRes.data.content.map(mapToProductWithCategory));
            setTotalPages(productRes.data.totalPages);
            setTotalElements(productRes.data.totalElements);

        } catch (err) {
            console.error("Lỗi tải dữ liệu:", err);
            setError("Không thể tải thông tin gian hàng lúc này.");
        } finally {
            setLoading(false);
        }
    }, [artisanId, currentPage, artisan]);

    useEffect(() => {
        fetchArtisanAndProducts();
    }, [fetchArtisanAndProducts]);

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        
        // Cập nhật URL
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        current.set('page', newPage.toString());
        router.push(`/shop/artisan/${artisanId}?${current.toString()}`, { scroll: false });

        // Cuộn lên đầu phần sản phẩm
        const section = document.getElementById('product-grid-section');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleAddToCart = (e: React.MouseEvent, product: ProductWithCategory) => {
        e.preventDefault(); e.stopPropagation();
        if (isProductOutOfStock(product)) { toast.error('Sản phẩm đã hết hàng'); return; }
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
        e.preventDefault(); e.stopPropagation();
        if (isProductOutOfStock(product)) { toast.error('Sản phẩm đã hết hàng'); return; }
        buyNow({
            id: product.id,
            productName: product.name,
            price: product.price,
            image: product.image || '/tramhon-logo.png',
            stockQuantity: product.stockQuantity,
            quantity: 1,
            artisanId: product.artisanId || undefined
        });
        router.push('/checkout');
    };

    if (loading && products.length === 0) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
                <Header /><div className="flex-grow flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D96C39]"></div>
                </div><Footer />
            </div>
        );
    }

    if (error || !artisan) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
                <Header /><div className="flex-grow flex flex-col items-center justify-center gap-4">
                    <h2 className="text-2xl font-semibold text-[#3F2E23]">{error || 'Gian hàng không tồn tại'}</h2>
                    <Link href="/shop/products" className="text-[#D96C39] hover:underline font-medium">← Quay lại cửa hàng chung</Link>
                </div><Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans">
            <Toaster position="top-center" />
            <Header />

            <main className="flex-grow container mx-auto px-4 py-12 max-w-6xl">
                {/* --- HEADER PROFILE (Giữ nguyên như cũ) --- */}
                <div className="bg-white rounded-3xl border border-[#E8D5B5] shadow-sm overflow-hidden mb-12 relative">
                    <div className="h-32 md:h-48 w-full bg-gradient-to-r from-[#6B4F3E] to-[#3F2E23] relative">
                        <div className="absolute inset-0 opacity-20 bg-[url('/pattern.png')] bg-repeat"></div>
                    </div>
                    <div className="px-6 md:px-10 pb-8 relative">
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 md:-mt-20 mb-6">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white bg-[#F7F1E8] shadow-lg flex items-center justify-center flex-shrink-0 z-10 text-5xl font-bold text-[#D96C39]">
                                {artisan.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 text-center md:text-left z-10 w-full pt-4 md:pt-0">
                                <h1 className="text-3xl md:text-4xl font-extrabold text-[#3F2E23] mb-2">{artisan.name}</h1>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-medium text-[#6B4F3E]">
                                    <span className="flex items-center gap-1 bg-[#FFF8F0] px-3 py-1 rounded-full border border-[#E8D5B5]">
                                        <Store size={14} className="text-[#D96C39]" /> Gian hàng thủ công
                                    </span>
                                    {artisan.createdAt && (
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} /> Tham gia: {formatDate(artisan.createdAt)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="w-full md:w-auto z-10 mt-4 md:mt-0">
                                <Link href={`/custom-request/new?artisanId=${artisan.id}`}>
                                    <button className="w-full md:w-auto bg-gradient-to-r from-[#D96C39] to-orange-500 hover:from-[#C25B2D] hover:to-orange-600 text-white px-8 py-4 rounded-full font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-lg">
                                        <Sparkles size={20} /> Đặt làm riêng
                                    </button>
                                </Link>
                            </div>
                        </div>
                        <div className="bg-[#FFF8F0] rounded-2xl p-6 border border-[#E8D5B5]">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-[#6B4F3E] mb-2 flex items-center gap-2">
                                <UserIcon size={16} /> Giới thiệu
                            </h3>
                            <p className="text-[#3F2E23] leading-relaxed whitespace-pre-wrap">{artisan.bio || "Nghệ nhân này rất tỉ mỉ trong từng sản phẩm."}</p>
                        </div>
                    </div>
                </div>

                {/* --- DANH SÁCH SẢN PHẨM --- */}
                <div id="product-grid-section">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-[#3F2E23] flex items-center gap-3">
                            Tác phẩm nghệ thuật
                            <span className="text-sm font-medium bg-[#E8D5B5] text-[#6B4F3E] px-3 py-1 rounded-full">
                                {totalElements} sản phẩm
                            </span>
                        </h2>
                    </div>

                    {products.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-[#E8D5B5]">
                            <p className="text-[#6B4F3E]">Chưa có sản phẩm nào ở trang này.</p>
                        </div>
                    ) : (
                        <>
                            <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
                                {products.map((product, idx) => (
                                    <ProductCard key={product.id} product={product} idx={idx} handleAddToCart={handleAddToCart} handleBuyNow={handleBuyNow} />
                                ))}
                            </div>

                            {/* --- THANH PHÂN TRANG --- */}
                            {totalPages > 1 && (
                                <div className="mt-12 flex items-center justify-center gap-2 pb-8">
                                    <Button 
                                        variant="outline" 
                                        disabled={currentPage === 1}
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        className="rounded-lg border-[#D96C39] text-[#3F2E23] hover:bg-[#FFF8F0]"
                                    >
                                        <ChevronLeft size={18} />
                                    </Button>

                                    {Array.from({ length: totalPages }).map((_, i) => {
                                        const pageNum = i + 1;
                                        // Chỉ hiển thị vài nút nếu quá nhiều trang
                                        if (totalPages > 7 && Math.abs(pageNum - currentPage) > 2 && pageNum !== 1 && pageNum !== totalPages) {
                                            if (pageNum === 2 || pageNum === totalPages - 1) return <span key={pageNum}>...</span>;
                                            return null;
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`w-10 h-10 rounded-lg font-bold transition-all ${
                                                    currentPage === pageNum 
                                                    ? "bg-[#D96C39] text-white shadow-md scale-110" 
                                                    : "bg-white text-[#3F2E23] border border-[#E8D5B5] hover:bg-[#FFF8F0]"
                                                }`}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}

                                    <Button 
                                        variant="outline" 
                                        disabled={currentPage === totalPages}
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        className="rounded-lg border-[#D96C39] text-[#3F2E23] hover:bg-[#FFF8F0]"
                                    >
                                        <ChevronRight size={18} />
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}

// Tách nhỏ component Card để code chính đỡ rối
function ProductCard({ product, idx, handleAddToCart, handleBuyNow }: any) {
    const isOutOfStock = isProductOutOfStock(product);
    let imageUrl = product.image || '/tramhon-logo.png';
    if (imageUrl.startsWith('//')) imageUrl = `https:${imageUrl}`;
    if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) imageUrl = `http://127.0.0.1:8000/${imageUrl}`;

    return (
        <div className="group relative h-full">
            <div className="rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col relative bg-white border border-[#E8D5B5]"
                style={{ animation: `fadeInUp 0.5s ease-out ${idx * 0.05}s backwards` }}>
                <Link href={`/shop/id/${product.id}`} className="absolute inset-0 z-0" />
                <div className="relative w-full h-56 overflow-hidden pointer-events-none bg-[#F7F1E8]">
                    <Image src={imageUrl} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="250px" />
                    {isOutOfStock && <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold z-10">Hết hàng</div>}
                </div>
                <div className="p-5 flex-1 flex flex-col pointer-events-none relative z-10 bg-white">
                    <div className="text-[11px] font-bold uppercase tracking-wider mb-2 text-[#6B4F3E]">{product.categoryName || 'Sản phẩm'}</div>
                    <h3 className="text-sm font-bold mb-2 line-clamp-2 text-[#3F2E23] group-hover:text-[#D96C39]">{product.name}</h3>
                    <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-100">
                        <div className="text-lg font-extrabold text-[#D96C39]">{product.price.toLocaleString("vi-VN")}₫</div>
                        <div className={`absolute right-5 flex items-center gap-2 transition-all duration-300 pointer-events-auto ${isOutOfStock ? 'opacity-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'}`}>
                            <button onClick={(e) => handleAddToCart(e, product)} className="w-9 h-9 rounded-full text-white bg-[#D96C39] flex items-center justify-center hover:scale-110 transition shadow-sm"><ShoppingCart size={16} /></button>
                            <button onClick={(e) => handleBuyNow(e, product)} className="w-9 h-9 rounded-full text-white bg-[#3F2E23] flex items-center justify-center hover:scale-110 transition shadow-sm"><CreditCard size={16} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}