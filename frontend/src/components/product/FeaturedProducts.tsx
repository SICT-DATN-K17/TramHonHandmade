'use client';

import {useState, useEffect} from 'react';
import { useRouter } from 'next/navigation';
import Image from "next/image";
import Link from "next/link";
import { useCart } from '@/contexts/CartContext';
import toast from 'react-hot-toast';
import { ShoppingCart, CreditCard, Store } from 'lucide-react'; // Đã thêm icon Store
import {axiosClient} from '@/lib/axios';
import { mapToProductWithCategory, ProductWithCategory } from '@/utils/ProductMapper';
import { PaginatedProductResponse } from '@/types/apiTypes';
import { isProductOutOfStock, getStockStatusText } from '@/lib/inventory';


export default function FeaturedProducts() {
    const [products, setProducts] = useState<ProductWithCategory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Lấy 8 sản phẩm nổi bật (sắp xếp theo bán chạy)
                const response = await axiosClient.get<PaginatedProductResponse>('/products/?sort=featured&size=8'); // 👉 FIX: Thêm / vào URL cho chuẩn
                const productsWithCategory = response.data.content.map(mapToProductWithCategory);

                setProducts(productsWithCategory);
                setLoading(false);

                console.log(">>> Featured products:", productsWithCategory);

            } catch (error) {
                console.error("Failed to fetch featured products:", error);
                setProducts([]);
                setLoading(false);
            }
        }

        fetchProducts().catch(console.error);
    }, []);

    const router = useRouter();
    const { addItem, buyNow } = useCart();

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
            stockQuantity: product.stockQuantity, // 👉 FIX: stockQuantity
            quantity: 1,
            artisanId: product.artisanId || undefined // 👉 FIX: Bổ sung cho Multi-vendor
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
            stockQuantity: product.stockQuantity, // 👉 FIX: stockQuantity
            quantity: 1,
            artisanId: product.artisanId || undefined // 👉 FIX: Bổ sung cho Multi-vendor
        });

        router.push('/checkout');
    };

    return (
        <section className="mt-16 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold mb-2" style={{color: '#3F2E23'}}>Sản phẩm nổi bật</h2>
                    <div className="h-1 w-20 rounded-full" style={{backgroundColor: '#D96C39'}}></div>
                </div>
                <Link href="/shop/products" className="text-sm font-medium transition-colors"
                      style={{color: '#D96C39'}}>Xem tất cả →</Link>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="rounded-xl h-96 animate-pulse"
                             style={{backgroundColor: '#E8D5B5'}}></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map((product, idx) => {
                        const isOutOfStock = isProductOutOfStock(product);
                        let imageUrl = product.image || '/tramhon-logo.png';
                        if (imageUrl.startsWith('//')) imageUrl = `https:${imageUrl}`;
                        // Handle relative paths from backend
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

                                    {/* Image */}
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

                                        {/* 👉 FIX: quantitySold */}
                                        {product.quantitySold && product.quantitySold > 0 && !isOutOfStock && (
                                            <div className="absolute top-3 right-3 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md" style={{ backgroundColor: '#D96C39' }}>
                                                ⭐ Bán chạy
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 flex-1 flex flex-col pointer-events-none relative z-10">
                                        <div className="flex items-center justify-between mb-3 gap-2">
                                            <div className="text-xs font-semibold uppercase tracking-wide truncate" style={{ color: '#D96C39' }}>
                                                {product.categoryName || 'Chưa phân loại'}
                                            </div>
                                            <div className="flex items-center shrink-0 shadow-sm">
                                                <span className="text-[10px] text-orange-700 bg-orange-50 px-2 py-1 rounded border border-orange-200 font-medium flex items-center gap-1">
                                                    <Store size={10} className="text-orange-600" />
                                                    <span className="truncate max-w-[100px]">{product.artisanName || 'Trạm Hồn'}</span>
                                                </span>
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
                                                            <span className="whitespace-nowrap">Thêm vào giỏ hàng</span>
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
                        );
                    })}
                </div>
            )}

            <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
        </section>
    );
}