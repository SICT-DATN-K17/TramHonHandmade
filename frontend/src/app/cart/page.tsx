'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

export default function CartPage() {
    const { items, removeItem, updateQuantity, clearCart, getTotalPrice } = useCart();
    const [isClearing, setIsClearing] = useState(false);

    const handleClearCart = () => {
        if (window.confirm('Bạn có chắc chắn muốn xóa tất cả sản phẩm trong giỏ hàng?')) {
            setIsClearing(true);
            clearCart();
            setTimeout(() => setIsClearing(false), 300);
        }
    };

    const handleQuantityChange = (id: number, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeItem(id);
        } else {
            updateQuantity(id, newQuantity);
        }
    };

    const totalPrice = getTotalPrice();

    return (
        <div className="min-h-screen font-sans text-gray-800 bg-white">
            <Header />

            <main className="container mx-auto px-6 py-12">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Giỏ hàng của tôi</h1>
                        {items.length > 0 && (
                            <button
                                onClick={handleClearCart}
                                className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                            >
                                Xóa tất cả
                            </button>
                        )}
                    </div>

                    {items.length === 0 ? (
                        <div className="text-center py-24">
                            <div className="text-6xl mb-6">🛒</div>
                            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Giỏ hàng trống</h2>
                            <p className="text-gray-600 mb-8">Bạn chưa có sản phẩm nào trong giỏ hàng</p>
                            <Link
                                href="/shop/products"
                                className="inline-block bg-[#0f172a] text-white px-8 py-3 rounded-full font-semibold shadow hover:bg-gray-800 transition-all duration-300"
                            >
                                Tiếp tục mua sắm
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Cart Items */}
                            <div className="lg:col-span-2 space-y-4">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300"
                                    >
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            {/* Product Image */}
                                            <Link href={`/shop/id/${item.id}`} className="flex-shrink-0">
                                                <div className="relative w-full sm:w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
                                                    <Image
                                                        src={
                                                            item.image
                                                                ? item.image.startsWith('//')
                                                                    ? `https:${item.image}`
                                                                    : item.image.startsWith('http')
                                                                    ? item.image
                                                                    : item.image.startsWith('/')
                                                                    ? item.image
                                                                    : `/${item.image}`
                                                                : '/tramhon-logo.png'
                                                        }
                                                        alt={item.productName}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            </Link>

                                            {/* Product Info */}
                                            <div className="flex-1 flex flex-col justify-between">
                                                <div>
                                                    <Link href={`/shop/id/${item.id}`}>
                                                        <h3 className="text-lg font-semibold text-gray-900 hover:text-[#0f172a] transition-colors mb-2">
                                                            {item.productName}
                                                        </h3>
                                                    </Link>
                                                    <p className="text-xl font-bold text-[#0f172a] mb-4">
                                                        ₫{(Number(item.price) || 0).toLocaleString('vi-VN')}
                                                    </p>
                                                </div>

                                                {/* Quantity Controls */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center border rounded-full overflow-hidden">
                                                        <button
                                                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                            aria-label="Giảm số lượng"
                                                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                            disabled={item.quantity <= 1}
                                                        >
                                                            -
                                                        </button>
                                                        <input
                                                            type="number"
                                                            inputMode="numeric"
                                                            min={1}
                                                            max={item.stockQuantity ?? 9999}
                                                            value={item.quantity}
                                                            onChange={(e) => {
                                                                const newQty = parseInt(e.target.value, 10);
                                                                if (!isNaN(newQty)) {
                                                                    handleQuantityChange(item.id, newQty);
                                                                }
                                                            }}
                                                            className="w-20 text-center px-3 py-2 outline-none appearance-none bg-white"
                                                            aria-label="Số lượng"
                                                        />
                                                        <button
                                                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                            aria-label="Tăng số lượng"
                                                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                            disabled={item.quantity >= (item.stockQuantity ?? 9999)}
                                                        >
                                                            +
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="text-red-600 hover:text-red-700 font-medium text-sm transition-colors flex items-center gap-2"
                                                        aria-label="Xóa sản phẩm"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="h-5 w-5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={2}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                            />
                                                        </svg>
                                                        Xóa
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Order Summary */}
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">Tóm tắt đơn hàng</h2>

                                    <div className="space-y-4 mb-6">
                                        <div className="flex justify-between text-gray-600">
                                            <span>Tạm tính:</span>
                                            <span className="font-medium">₫{totalPrice.toLocaleString('vi-VN')}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span>Phí vận chuyển:</span>
                                            <span className="font-medium">Tính khi thanh toán</span>
                                        </div>
                                        <div className="border-t pt-4 flex justify-between text-lg font-bold text-gray-900">
                                            <span>Tổng cộng:</span>
                                            <span className="text-[#0f172a]">₫{totalPrice.toLocaleString('vi-VN')}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Link
                                            href="/checkout"
                                            className="block w-full bg-[#0f172a] text-white px-6 py-3 rounded-full font-semibold shadow hover:bg-gray-800 transition-all duration-300 text-center"
                                        >
                                            Thanh toán
                                        </Link>
                                        <Link
                                            href="/shop/products"
                                            className="block w-full border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-full font-semibold hover:border-gray-400 transition-all duration-300 text-center"
                                        >
                                            Tiếp tục mua sắm
                                        </Link>
                                    </div>

                                    <div className="mt-6 pt-6 border-t text-sm text-gray-500">
                                        <p className="mb-2">💳 Thanh toán an toàn</p>
                                        <p className="mb-2">🚚 Miễn phí vận chuyển cho đơn hàng trên 500.000₫</p>
                                        <p>↩️ Đổi trả trong 7 ngày</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}

