"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import useMyOrders from "@/hooks/useMyOrders";
import useAxiosAuth from "@/hooks/useAxiosAuth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2, Package, Calendar, ChevronRight, AlertCircle as AlertCircleIcon, CheckCircle2 } from "lucide-react";
import { Header, Footer } from "@/components/common";
import toast, { Toaster } from "react-hot-toast";

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

export default function MyOrdersPage() {
    const { orders, isLoading, error, refetch } = useMyOrders(); // Đổi mutate -> refetch
    const axiosAuth = useAxiosAuth();
    const [isConfirmingId, setIsConfirmingId] = useState<number | null>(null);

    const confirmDelivery = async (orderId: number) => {
        setIsConfirmingId(orderId);
        const toastId = toast.loading('Đang cập nhật trạng thái...');
        try {
            await axiosAuth.put(`/orders/${orderId}/confirm-delivery/`);
            toast.success(<b>Đã xác nhận nhận hàng! Cảm ơn bạn.</b>, { id: toastId });
            if (refetch) refetch(); // Gọi refetch thay vì mutate
        } catch (err: any) {
            toast.error(<b>{err.response?.data?.message || 'Có lỗi xảy ra khi xác nhận.'}</b>, { id: toastId });
        } finally {
            setIsConfirmingId(null);
        }
    };

    const renderStatusBadge = (status: string) => {
        const upperStatus = status?.toUpperCase() || '';
        
        const statusMap: Record<string, { label: string; className: string; icon: string }> = {
            PENDING_PICKUP: { label: "Đang chờ lấy hàng", className: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: "⏳" },
            PACKAGING: { label: "Đang đóng gói hàng", className: "bg-blue-50 text-blue-700 border-blue-200", icon: "📦" },
            SHIPPING: { label: "Đang giao hàng", className: "bg-purple-50 text-purple-700 border-purple-200", icon: "🚚" },
            DELIVERED_AWAITING: { label: "Đang giao hàng", className: "bg-purple-50 text-purple-700 border-purple-200", icon: "🚚" },
            DELIVERED: { label: "Đã giao hàng", className: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "📬" },
            COMPLETED: { label: "Hoàn thành", className: "bg-green-50 text-green-700 border-green-200", icon: "✅" },
            CANCELLED: { label: "Đã hủy", className: "bg-red-50 text-red-700 border-red-200", icon: "❌" },
            REFUNDED: { label: "Đã hoàn tiền", className: "bg-gray-50 text-gray-700 border-gray-200", icon: "💸" },
        };
        
        const config = statusMap[upperStatus] || { label: status, className: "bg-gray-100 text-gray-800", icon: "📦" };
        
        return (
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-sm ${config.className}`}>
                <span>{config.icon}</span>{config.label}
            </span>
        );
    };

    return (
        <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: '#FDFBF7', color: '#3F2E23' }}>
            <Toaster position="top-center" />
            <Header />

            <main className="flex-grow container mx-auto px-4 py-12 max-w-6xl">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-extrabold mb-3" style={{ color: '#3F2E23' }}>📦 Lịch sử đơn hàng</h1>
                    <div className="h-1 w-24 mx-auto rounded-full mb-4" style={{ backgroundColor: '#D96C39' }}></div>
                    <p className="text-lg" style={{ color: '#6B4F3E' }}>Theo dõi và quản lý các đơn hàng của bạn</p>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader2 className="h-12 w-12 animate-spin mb-4" style={{ color: '#D96C39' }} />
                        <p className="text-lg font-medium animate-pulse" style={{ color: '#6B4F3E' }}>Đang tải dữ liệu đơn hàng...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-16 rounded-3xl border border-[#E8D5B5] bg-white shadow-sm mx-auto max-w-2xl">
                        <div className="text-red-500 mb-4 text-5xl">⚠️</div>
                        <h3 className="text-xl font-bold text-red-700 mb-2">Có lỗi xảy ra</h3>
                        <p className="text-red-600 mb-6 font-medium">{error}</p>
                        <Button onClick={() => window.location.reload()} className="bg-white text-red-600 border border-red-200 hover:bg-red-50 rounded-xl">Thử lại</Button>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-24 rounded-3xl border border-[#E8D5B5] bg-white shadow-sm max-w-4xl mx-auto">
                        <div className="w-32 h-32 bg-[#FFF8F0] rounded-full flex items-center justify-center mx-auto mb-6">
                            <div className="text-6xl animate-bounce">🛍️</div>
                        </div>
                        <h3 className="text-3xl font-extrabold mb-4" style={{ color: '#3F2E23' }}>Bạn chưa có đơn hàng nào</h3>
                        <p className="text-[#6B4F3E] mb-8 text-lg">Giỏ hàng trống rỗng, nhưng ngoài kia có rất nhiều món đồ đẹp đang chờ bạn đấy!</p>
                        <Link href="/shop/products">
                            <Button className="px-8 py-6 rounded-full text-white text-base font-bold shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all" style={{ backgroundColor: '#D96C39' }}>
                                Bắt đầu khám phá
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6 max-w-5xl mx-auto">
                        {orders.map((order, idx) => {
                            const isCancelled = order.status?.toUpperCase() === 'CANCELLED';
                            const rawNote = order.note || ""; // Lấy thẳng note từ api thay vì shippingAddress.note
                            const hasCancelReason = rawNote.includes("Lý do hủy đơn:");
                            const cancelReasonText = hasCancelReason ? rawNote.replace("Lý do hủy đơn:", "").trim() : "";
                            
                            const canConfirmDelivery = ['SHIPPING', 'DELIVERED_AWAITING'].includes(order.status?.toUpperCase() || '');

                            return (
                                <div
                                    key={order.id}
                                    className={`group overflow-hidden rounded-2xl border transition-all duration-500 hover:shadow-md bg-white animate-in fade-in slide-in-from-bottom-4 ${isCancelled ? 'border-red-200' : 'border-[#E8D5B5]'}`}
                                    style={{ animationFillMode: 'both', animationDelay: `${idx * 100}ms` }}
                                >
                                    <div className={`flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4 ${isCancelled ? 'bg-red-50/50 border-red-100' : 'bg-[#FFF8F0] border-[#E8D5B5]'}`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm ${isCancelled ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-[#E8D5B5] text-[#3F2E23]'}`}>
                                                <Package size={18} className={isCancelled ? 'text-red-500' : 'text-[#D96C39]'} />
                                                <span className="font-bold text-lg">#{order.orderNumber || order.id}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm font-medium text-[#6B4F3E]">
                                                <Calendar size={16} className={isCancelled ? 'text-red-500' : 'text-[#D96C39]'} />{formatDate(order.createdAt || order.orderDate)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">{renderStatusBadge(order.status || '')}</div>
                                    </div>

                                    {isCancelled && hasCancelReason && (
                                        <div className="px-6 pt-5">
                                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-start shadow-sm">
                                                <AlertCircleIcon className="text-red-600 mt-0.5 shrink-0" size={20} />
                                                <div>
                                                    <span className="text-xs font-bold text-red-700 uppercase tracking-wider block mb-1">Lý do hủy đơn</span>
                                                    <p className="text-sm font-medium text-red-800">{cancelReasonText}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-6">
                                        <div className="space-y-4">
                                            {order.items.map((item: any, index: number) => {
                                                const imageUrl = getProductImageUrl(item.productImage || item.imageUrl || item.image);
                                                
                                                return (
                                                    <div key={index} className="flex gap-4 items-center bg-[#FDFBF7] p-3 rounded-xl border border-[#E8D5B5]/50">
                                                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-[#E8D5B5] bg-white shadow-sm">
                                                            <Image src={imageUrl} alt={item.productName || 'Product'} fill className="object-cover" />
                                                        </div>
                                                        <div className="flex flex-1 flex-col justify-center">
                                                            <h4 className="font-bold text-base line-clamp-2 leading-snug" style={{ color: '#3F2E23' }}>{item.productName}</h4>
                                                            <p className="text-sm mt-1.5 font-medium bg-[#E8D5B5]/30 px-2 py-0.5 rounded-md inline-block w-max" style={{ color: '#6B4F3E' }}>
                                                                Số lượng: <span className="font-bold text-[#3F2E23]">x{item.quantity}</span>
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-black text-lg" style={{ color: '#D96C39' }}>
                                                                {formatCurrency(Number(item.priceOrder || item.price || 0))}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E8D5B5] px-6 py-5 bg-gray-50/30">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium uppercase tracking-wider" style={{ color: '#6B4F3E' }}>Tổng giá trị:</span>
                                            <span className="text-2xl font-black" style={{ color: '#D96C39' }}>
                                                {formatCurrency(Number(order.totalPrice || order.total || 0))}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                            {canConfirmDelivery && (
                                                <Button 
                                                    onClick={() => confirmDelivery(order.id)}
                                                    disabled={isConfirmingId === order.id}
                                                    className="flex-1 sm:flex-none text-white font-bold h-11 rounded-xl shadow-md transition-all hover:-translate-y-0.5" 
                                                    style={{ backgroundColor: '#10B981' }} 
                                                >
                                                    {isConfirmingId === order.id ? (
                                                        <Loader2 className="animate-spin h-5 w-5" />
                                                    ) : (
                                                        <><CheckCircle2 size={18} className="mr-1.5" /> Đã nhận được hàng</>
                                                    )}
                                                </Button>
                                            )}

                                            <Link href={`/account/orders/${order.id}`} className="flex-1 sm:flex-none">
                                                <Button variant="outline" className="w-full sm:w-auto text-[#3F2E23] border-[#E8D5B5] font-bold h-11 rounded-xl hover:bg-[#FFF8F0] transition-all">
                                                    Xem chi tiết <ChevronRight size={18} className="ml-1" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}