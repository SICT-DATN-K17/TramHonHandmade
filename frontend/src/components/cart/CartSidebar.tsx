'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';

interface CartSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
    const { items, removeItem, updateQuantity, getTotalPrice } = useCart();
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleQuantityChange = (id: number, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeItem(id);
        } else {
            updateQuantity(id, newQuantity);
        }
    };

    const totalPrice = getTotalPrice();

    if (!isOpen && !isAnimating) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ${isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div
                className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                onTransitionEnd={() => {
                    if (!isOpen) setIsAnimating(false);
                }}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b" style={{ backgroundColor: '#F7F1E8' }}>
                        <h2 className="text-xl font-bold text-gray-900">Giỏ hàng</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            aria-label="Đóng giỏ hàng"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {items.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-5xl mb-4">🛒</div>
                                <p className="text-gray-600 mb-6">Giỏ hàng trống</p>
                                <Link
                                    href="/shop/products"
                                    onClick={onClose}
                                    className="inline-block bg-[#0f172a] text-white px-6 py-2 rounded-full font-semibold text-sm hover:bg-gray-800 transition-all duration-300"
                                >
                                    Tiếp tục mua sắm
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                                    >
                                        <div className="flex gap-4">
                                            {/* Product Image */}
                                            <Link href={`/shop/id/${item.id}`} onClick={onClose} className="flex-shrink-0">
                                                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
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
                                            <div className="flex-1 min-w-0">
                                                <Link href={`/shop/id/${item.id}`} onClick={onClose}>
                                                    <h3 className="text-sm font-semibold text-gray-900 hover:text-[#0f172a] transition-colors mb-1 line-clamp-2">
                                                        {item.productName}
                                                    </h3>
                                                </Link>
                                                <p className="text-sm font-bold text-[#0f172a] mb-3">
                                                    ₫{(Number(item.price) || 0).toLocaleString('vi-VN')}
                                                </p>

                                                {/* Quantity Controls */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center border rounded-full overflow-hidden">
                                                        <button
                                                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                            aria-label="Giảm số lượng"
                                                            className="px-2 py-1 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
                                                            disabled={item.quantity <= 1}
                                                        >
                                                            -
                                                        </button>
                                                        <span className="w-8 text-center text-sm bg-white py-1">{item.quantity}</span>
                                                        <button
                                                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                            aria-label="Tăng số lượng"
                                                            className="px-2 py-1 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
                                                            disabled={item.quantity >= (item.stockQuantity ?? 9999)}
                                                        >
                                                            +
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="text-red-600 hover:text-red-700 transition-colors"
                                                        aria-label="Xóa sản phẩm"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="h-4 w-4"
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
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {items.length > 0 && (
                        <div className="border-t p-6 space-y-4" style={{ backgroundColor: '#F7F1E8' }}>
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-gray-900">Tổng cộng:</span>
                                <span className="text-xl font-bold text-[#0f172a]">
                                    ₫{totalPrice.toLocaleString('vi-VN')}
                                </span>
                            </div>
                            <Link
                                href="/cart"
                                onClick={onClose}
                                className="block w-full bg-[#0f172a] text-white px-6 py-3 rounded-full font-semibold shadow hover:bg-gray-800 transition-all duration-300 text-center"
                            >
                                Xem giỏ hàng
                            </Link>
                            <Link
                                href="/checkout"
                                onClick={onClose}
                                className="block w-full border-2 border-[#0f172a] text-[#0f172a] px-6 py-3 rounded-full font-semibold hover:bg-gray-50 transition-all duration-300 text-center"
                            >
                                Thanh toán
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

