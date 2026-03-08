'use client';

import {useState, useEffect} from 'react';
import {useParams, useRouter} from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import {useCart} from '@/contexts/CartContext';
import toast, { Toaster } from 'react-hot-toast';
import {isProductOutOfStock, getStockStatusText} from '@/lib/inventory';
import { axiosClient} from "@/lib/axios";
import { RawProductResponse} from "@/types/apiTypes";
import { ProductWithCategory, mapToProductWithCategory} from "@/utils/ProductMapper";

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const productId = Number(params.id);
    const {addItem, buyNow} = useCart();

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
                const productData = await axiosClient.get<RawProductResponse>(`/products/${productId}`);
                const productWithCategory = mapToProductWithCategory(productData.data);
                setProduct(productWithCategory);
                setCategoryName(productWithCategory.categoryName);
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
            const max = product?.stock_quantity ?? 9999;
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
        const max = product?.stock_quantity ?? 9999;

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
            image: product.image
                ? product.image.startsWith('//')
                    ? `https:${product.image}`
                    : product.image.startsWith('http')
                    ? product.image
                    : product.image.startsWith('/')
                    ? product.image
                    : `/${product.image}`
                : '/tramhon-logo.png',
            stockQuantity: product.stock_quantity,
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
            image: product.image
                ? product.image.startsWith('//')
                    ? `https:${product.image}`
                    : product.image.startsWith('http')
                    ? product.image
                    : product.image.startsWith('/')
                    ? product.image
                    : `/${product.image}`
                : '/tramhon-logo.png',
            stockQuantity: product.stock_quantity,
            quantity: quantity,
        });
        router.push('/checkout');
    };

    return (
        <div className="min-h-screen font-sans text-gray-800 bg-white">
            <Toaster position="top-center" />
            <Header/>

            <main className="container mx-auto px-6 py-12">
                {loading ? (
                    <div className="text-center py-24">Đang tải...</div>
                ) : error ? (
                    <div className="text-center py-24">
                        <h2 className="text-2xl font-semibold mb-4">Lỗi</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <Link href="/shop/products" className="text-[#0f172a] hover:underline">
                            ← Quay lại cửa hàng
                        </Link>
                    </div>
                ) : !product ? (
                    <div className="text-center py-24">
                        <h2 className="text-2xl font-semibold mb-4">Không tìm thấy sản phẩm</h2>
                        <Link href="/shop/products" className="text-[#0f172a] hover:underline">
                            ← Quay lại cửa hàng
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        {/* Image Section */}
                        <div>
                            <div className="relative rounded-2xl overflow-hidden shadow-lg">
                                <div className="w-full h-[420px] relative bg-gray-100">
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
                                        className="object-cover"
                                        priority
                                    />
                                    {isProductOutOfStock(product) && (
                                        <div
                                            className="absolute top-4 left-4 bg-red-600 text-white px-5 py-2.5 rounded-lg font-bold text-base shadow-lg z-10">
                                            Hết hàng
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Details Section */}
                        <div className="space-y-6">
                            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                            <div className="flex items-center gap-4">
                                <div className="text-xl font-extrabold text-[#0f172a]">
                                    ₫{(product.price || 0).toLocaleString('vi-VN')}
                                </div>
                                {isProductOutOfStock(product) && (
                                    <div
                                        className="px-4 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                                        {getStockStatusText(product)}
                                    </div>
                                )}
                            </div>

                            {product.description && (
                                <div className="text-sm text-gray-600">{product.description}</div>
                            )}

                            {/* Quantity and Actions */}
                            <div className="flex items-center gap-4 mt-4">
                                <div
                                    className={`flex items-center border rounded-full overflow-hidden ${isProductOutOfStock(product) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <button
                                        onClick={decrease}
                                        aria-label="Giảm số lượng"
                                        className="px-4 py-2 bg-gray-100 disabled:opacity-50"
                                        disabled={quantity <= 1 || isProductOutOfStock(product)}
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        min={1}
                                        max={product.stock_quantity ?? 9999}
                                        value={quantity}
                                        onChange={(e) => onQuantityChange(e.target.value)}
                                        className="w-20 text-center px-3 py-2 outline-none appearance-none bg-white"
                                        aria-label="Số lượng"
                                        disabled={isProductOutOfStock(product)}
                                    />
                                    <button
                                        onClick={increase}
                                        aria-label="Tăng số lượng"
                                        className="px-4 py-2 bg-gray-100 disabled:opacity-50"
                                        disabled={quantity >= (product.stock_quantity ?? 9999) || isProductOutOfStock(product)}
                                    >
                                        +
                                    </button>
                                </div>

                                <div className="flex items-center gap-3">
                                    {isProductOutOfStock(product) ? (
                                        <div
                                            className="px-6 py-3 rounded-full font-semibold shadow-sm bg-gray-300 text-gray-600 cursor-not-allowed">
                                            Hết hàng
                                        </div>
                                    ) : (
                                        <button
                                            className={`border-2 border-orange-500 bg-white text-orange-600 px-6 py-3 rounded-full font-semibold shadow-sm hover:bg-orange-50 transition-all duration-300 relative ${addToCartSuccess ? 'bg-green-50 border-green-500 text-green-600' : ''}`}
                                            onClick={handleAddToCart}
                                            disabled={product.stock_quantity !== undefined && product.stock_quantity <= 0}
                                        >
                                            {addToCartSuccess ? (
                                                <span className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20"
                               fill="currentColor">
                            <path fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"/>
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
                                            className="bg-[#0f172a] text-white px-6 py-3 rounded-full font-semibold shadow hover:bg-gray-800 transition-all duration-300 text-center"
                                            onClick={handleBuyNow}
                                        >
                                            Mua ngay
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Custom Request Button */}
                            <div className="pt-2">
                                <Link
                                    href={`/custom-request/${productId}`}
                                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-orange-600 to-yellow-500 text-white px-6 py-3 rounded-full font-semibold shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                                         className="w-5 h-5">
                                        <path
                                            fillRule="evenodd"
                                            d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 019.75 22.5a.75.75 0 01-.75-.75v-4.131A15.838 15.838 0 016.382 15H2.25a.75.75 0 01-.75-.75 6.75 6.75 0 017.815-6.666zM15 6.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span>Yêu cầu tùy chỉnh</span>
                                </Link>
                            </div>

                            {/* Meta Info */}
                            <div className="text-sm text-gray-500">
                                Kho: {product.stock_quantity ?? '—'} · Đã bán: {product.quantity_sold ?? '—'}
                            </div>

                            {/* Category Link */}
                            {categoryName && product.category_id && (
                                <div className="pt-4 border-t">
                                    <h3 className="font-medium mb-2">Danh mục</h3>
                                    <Link href={`/shop/products?categoryId=${product.category_id}`}
                                          className="text-sm text-[#0f172a] hover:underline">
                                        {categoryName}
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            <Footer/>
        </div>
    );
}