'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ShoppingBag, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface CartSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

// Khai báo Type để TypeScript không báo lỗi "any"
interface CartItem {
    id?: number;
    product_id?: number;
    name?: string;
    productName?: string;
    price: number;
    quantity: number;
    image?: string;
    imageUrl?: string;
    [key: string]: any;
}

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
    // Gọi đúng Context của sếp
    const { items, removeItem, updateQuantity, getTotalPrice } = useCart();
    const [isAnimating, setIsAnimating] = useState(false);

    // Xử lý khóa cuộn trang và animation
    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsAnimating(false), 300); // Chờ 300ms để chạy animation mượt
            document.body.style.overflow = '';
            return () => clearTimeout(timer);
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Format tiền tệ
    const formatVND = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    };

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    const getProductImageUrl = (path: string | null | undefined): string => {
        if (!path || path === 'undefined' || path === 'null' || path === '') return '/tramhon-logo.png';
        if (path.startsWith('http')) return path;
        if (path.startsWith('//')) return `https:${path}`;

        let normalizedPath = path;
        if (!normalizedPath.startsWith('/')) normalizedPath = '/' + normalizedPath;
        if (normalizedPath.startsWith('/uploads/uploads/')) {
            normalizedPath = normalizedPath.replace('/uploads/uploads/', '/uploads/');
        } else if (!normalizedPath.startsWith('/uploads/')) {
            normalizedPath = '/uploads' + normalizedPath;
        }
        return `${API_URL}${normalizedPath}`;
    };

    const totalItems = items.reduce((acc: number, item: CartItem) => acc + item.quantity, 0);

    if (!isOpen && !isAnimating) return null;

    return (
        <>
            {/* Backdrop làm mờ */}
            <div
                className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Khung Sidebar */}
            <div
                className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white z-50 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* Header giỏ hàng */}
                <div className="p-6 border-b border-[#E8D5B5] flex items-center justify-between bg-white">
                    <h2 className="text-2xl font-black flex items-center gap-2" style={{ color: '#3F2E23' }}>
                        <ShoppingBag className="w-6 h-6" style={{ color: '#D96C39' }} />
                        Giỏ hàng của bạn
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full text-gray-400 hover:bg-[#FFF8F0] hover:text-[#D96C39] transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Nội dung giỏ hàng */}
                {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-10 text-center animate-in fade-in zoom-in-95">
                        <div className="w-24 h-24 rounded-full bg-[#FFF8F0] border-2 border-[#E8D5B5] flex items-center justify-center">
                            <ShoppingBag className="w-12 h-12" style={{ color: '#E8D5B5' }} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold" style={{ color: '#3F2E23' }}>Giỏ hàng đang trống</h3>
                            <p className="text-sm font-medium" style={{ color: '#6B4F3E' }}>Có vẻ như bạn chưa chọn được sản phẩm nào.</p>
                        </div>
                        <Link href="/shop/products" onClick={onClose} className="w-full">
                            <Button className="w-full rounded-full font-bold h-11 text-white shadow-md hover:shadow-lg transition-all" style={{ backgroundColor: '#D96C39' }}>
                                Tiếp tục khám phá
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-gray-50/50">
                            {items.map((item: CartItem) => {
                                const itemId = item.id || item.product_id;
                                const itemName = item.name || item.productName || 'Sản phẩm';
                                const itemImage = item.image || item.imageUrl;
                                const imageUrl = getProductImageUrl(itemImage);

                                return (
                                    <div key={itemId} className="group relative flex gap-4 p-4 rounded-xl bg-white border border-[#E8D5B5] shadow-sm hover:shadow-md transition-all">
                                        <button
                                            onClick={() => removeItem(itemId!)}
                                            className="absolute -top-2 -right-2 p-1.5 rounded-full bg-white border border-[#E8D5B5] text-gray-400 hover:text-red-500 hover:shadow transition-all opacity-0 group-hover:opacity-100"
                                            title="Xóa khỏi giỏ hàng"
                                        >
                                            <Trash2 size={16} />
                                        </button>

                                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-[#E8D5B5] bg-[#F7F1E8]">
                                            <Image
                                                src={imageUrl}
                                                alt={itemName}
                                                fill
                                                className="object-cover transition-transform group-hover:scale-105"
                                            />
                                        </div>

                                        <div className="flex flex-col flex-1 min-w-0">
                                            <h4 className="font-semibold text-base line-clamp-2 leading-snug" style={{ color: '#3F2E23' }}>
                                                {itemName}
                                            </h4>

                                            <p className="mt-1 font-bold text-lg" style={{ color: '#D96C39' }}>
                                                {formatVND(item.price)}
                                            </p>

                                            <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                                                <div className="flex items-center gap-1 bg-[#FFF8F0] p-0.5 rounded-full border border-[#E8D5B5]">
                                                    <button
                                                        onClick={() => updateQuantity(itemId!, item.quantity - 1)}
                                                        className="p-1.5 rounded-full text-[#D96C39] hover:bg-white transition-colors"
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus size={16} />
                                                    </button>
                                                    <span className="w-8 text-center font-bold text-[#3F2E23] text-sm">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(itemId!, item.quantity + 1)}
                                                        className="p-1.5 rounded-full text-[#D96C39] hover:bg-white transition-colors"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-6 border-t border-[#E8D5B5] bg-[#FFF8F0]">
                            <div className="space-y-4 mb-6">
                                <div className="flex items-center justify-between text-sm font-medium" style={{ color: '#6B4F3E' }}>
                                    <span>Số lượng ({totalItems} sản phẩm)</span>
                                    <span className="text-gray-400">---</span>
                                </div>
                                <div className="flex items-end justify-between gap-2">
                                    <span className="text-lg font-bold" style={{ color: '#3F2E23' }}>Tổng cộng</span>
                                    <div className="text-right">
                                        <span className="text-3xl font-black" style={{ color: '#D96C39' }}>
                                            {formatVND(getTotalPrice())}
                                        </span>
                                        <p className="text-[11px] text-[#6B4F3E] italic mt-1">(Đã bao gồm thuế)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <Link href="/cart" onClick={onClose} className="w-full">
                                    <Button variant="outline" className="w-full rounded-full font-bold h-11 border-[#E8D5B5] text-[#6B4F3E] hover:bg-[#F7F1E8] hover:text-[#3F2E23] transition-all bg-white">
                                        Xem chi tiết
                                    </Button>
                                </Link>
                                <Link href="/checkout" onClick={onClose} className="w-full">
                                    <Button className="w-full rounded-full font-bold h-11 text-white shadow-md hover:shadow-lg transition-all" style={{ backgroundColor: '#3F2E23' }}>
                                        Thanh toán
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}