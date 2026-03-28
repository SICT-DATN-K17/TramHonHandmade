"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import useMyOrders from "@/hooks/useMyOrders";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package, Calendar, ChevronRight, XCircle, AlertTriangle } from "lucide-react";
import { Header, Footer } from "@/components/common";
import toast, { Toaster } from "react-hot-toast"; // Import toast

export default function MyOrdersPage() {
    // Lấy hàm cancelOrder từ hook
    const { orders, isLoading, error, cancelOrder } = useMyOrders();

    // --- LOGIC XỬ LÝ HỦY ĐƠN VỚI TOAST CONFIRM ---
    const handleCancelOrder = (orderId: number) => {
        toast.custom((t) => (
            <div
                className={`${
                    t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
            >
                <div className="flex-1 w-0 p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                            <AlertTriangle className="h-10 w-10 text-yellow-500" />
                        </div>
                        <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900">
                                Xác nhận hủy đơn hàng #{orderId}?
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                                Hành động này không thể hoàn tác. Bạn có chắc chắn muốn hủy không?
                            </p>
                            <div className="mt-3 flex gap-2">
                                <button
                                    onClick={() => performCancellation(orderId, t.id)}
                                    className="bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                                >
                                    Đồng ý hủy
                                </button>
                                <button
                                    onClick={() => toast.dismiss(t.id)}
                                    className="bg-white text-gray-700 border border-gray-300 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ), { duration: 5000 }); // Toast tự tắt sau 5s nếu không thao tác
    };

    // Hàm thực thi gọi API sau khi người dùng bấm "Đồng ý"
    const performCancellation = async (orderId: number, toastId: string) => {
        toast.dismiss(toastId); // Đóng toast confirm

        // Sử dụng toast.promise để hiển thị loading/success/error
        await toast.promise(
            cancelOrder(orderId),
            {
                loading: 'Đang xử lý hủy đơn...',
                success: <b>Đã hủy đơn hàng #{orderId} thành công!</b>,
                error: (err) => <b>{err.message || 'Lỗi khi hủy đơn'}</b>,
            }
        );
    };
    // ------------------------------------------------

    // Hàm helper render badge (giữ nguyên của bạn)
    const renderStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; className: string; icon: string }> = {
            PENDING: { label: "Đang chờ xử lý", className: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: "⏳" },
            IN_PROGRESS: { label: "Đang giao hàng", className: "bg-blue-100 text-blue-800 border-blue-200", icon: "🚚" },
            COMPLETED: { label: "Hoàn thành", className: "bg-green-100 text-green-800 border-green-200", icon: "✅" },
            CANCELLED: { label: "Đã hủy", className: "bg-red-100 text-red-800 border-red-200", icon: "❌" },
        };
        const config = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800", icon: "📦" };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 shadow-sm ${config.className}`}>
                <span>{config.icon}</span>{config.label}
            </span>
        );
    };

    return (
        <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: '#F7F1E8', color: '#3F2E23' }}>
            <Toaster position="top-center" />
            <Header />

            <main className="flex-grow container mx-auto px-4 py-12">
                {/* Header Page */}
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-bold mb-3" style={{ color: '#3F2E23' }}>📦 Lịch sử đơn hàng</h1>
                    <div className="h-1 w-24 mx-auto rounded-full mb-4" style={{ backgroundColor: '#D96C39' }}></div>
                    <p className="text-lg" style={{ color: '#6B4F3E' }}>Theo dõi và quản lý các đơn hàng của bạn</p>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin mb-4" style={{ color: '#D96C39' }} />
                        <p className="text-lg font-medium animate-pulse" style={{ color: '#6B4F3E' }}>Đang tải dữ liệu...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-16 rounded-xl border border-dashed border-red-200 bg-red-50 mx-auto max-w-2xl">
                        <div className="text-red-500 mb-4 text-5xl">⚠️</div>
                        <h3 className="text-xl font-bold text-red-700 mb-2">Có lỗi xảy ra</h3>
                        <p className="text-red-600 mb-6">{error}</p>
                        <Button onClick={() => window.location.reload()} className="bg-white text-red-600 border border-red-200 hover:bg-red-50">Thử lại</Button>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-20 rounded-xl border-2 border-dashed" style={{ borderColor: '#E8D5B5', backgroundColor: '#FFF8F0' }}>
                        {/* Empty state content giữ nguyên */}
                        <div className="text-8xl mb-6 animate-bounce">🛍️</div>
                        <h3 className="text-2xl font-semibold mb-3" style={{ color: '#3F2E23' }}>Bạn chưa có đơn hàng nào</h3>
                        <Link href="/shop/products">
                            <Button className="px-8 py-6 rounded-full text-white text-base font-medium shadow-lg hover:shadow-xl transition-all" style={{ backgroundColor: '#D96C39' }}>Bắt đầu mua sắm</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6 max-w-5xl mx-auto">
                        {orders.map((order, idx) => (
                            <div
                                key={order.id}
                                className="group overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-md bg-white"
                                style={{ borderColor: '#E8D5B5', animation: `fadeInUp 0.5s ease-out ${idx * 0.1}s backwards` }}
                            >
                                {/* Header Order giữ nguyên */}
                                <div className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4" style={{ backgroundColor: '#FFF8F0', borderColor: '#E8D5B5' }}>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                                        <div className="flex items-center gap-2">
                                            <Package size={18} style={{ color: '#D96C39' }} />
                                            <span className="font-bold text-lg" style={{ color: '#3F2E23' }}>#{order.id}</span>
                                        </div>
                                        <div className="hidden sm:block w-px h-4 bg-gray-300"></div>
                                        <div className="flex items-center gap-2 text-sm" style={{ color: '#6B4F3E' }}>
                                            <Calendar size={16} />{formatDate(order.orderDate)}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">{renderStatusBadge(order.status)}</div>
                                </div>

                                {/* Body Order giữ nguyên */}
                                <div className="p-6">
                                    <div className="space-y-4">
                                        {order.items.map((item: any, index: number) => {
                                            let imageUrl = item.productImage || item.imageUrl || '/tramhon-logo.png';
                                            
                                            if (imageUrl.startsWith('//')) imageUrl = `https:${imageUrl}`;
                                            // Handle relative paths from backend
                                            if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                                                imageUrl = `http://127.0.0.1:8000/${imageUrl}`;
                                            }
                                            
                                            return (
                                                <div key={index} className="flex gap-4 items-center">
                                                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border bg-gray-50" style={{ borderColor: '#E8D5B5' }}>
                                                        <Image src={imageUrl} alt={item.productName || 'Product'} fill className="object-cover" />
                                                    </div>
                                                    <div className="flex flex-1 flex-col justify-center">
                                                        <h4 className="font-semibold text-base line-clamp-2" style={{ color: '#3F2E23' }}>{item.productName}</h4>
                                                        <p className="text-sm mt-1" style={{ color: '#6B4F3E' }}>Số lượng: <span className="font-medium">x{item.quantity}</span></p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-base" style={{ color: '#D96C39' }}>
                                                            {formatCurrency(Number(item.priceOrder || item.price || 0))}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t px-6 py-4 bg-gray-50/50" style={{ borderColor: '#E8D5B5' }}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium" style={{ color: '#6B4F3E' }}>Tổng giá trị:</span>
                                        <span className="text-xl font-bold" style={{ color: '#D96C39' }}>
                                            {formatCurrency(Number(order.totalPrice))}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        {order.status === "PENDING" && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                // GỌI HÀM CONFIRM THAY VÌ GỌI TRỰC TIẾP
                                                onClick={() => handleCancelOrder(order.id)}
                                                className="flex-1 sm:flex-none border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                            >
                                                <XCircle size={16} className="mr-2" />
                                                Hủy đơn
                                            </Button>
                                        )}

                                        <Link href={`/orders/${order.id}`} className="flex-1 sm:flex-none">
                                            <Button size="sm" className="w-full sm:w-auto text-white shadow-sm hover:shadow transition-all" style={{ backgroundColor: '#3F2E23' }}>
                                                Xem chi tiết
                                                <ChevronRight size={16} className="ml-1" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <Footer />
            <style jsx global>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                /* Thêm animation cho toast custom */
                .animate-enter { animation: enter 0.2s ease-out; }
                .animate-leave { animation: leave 0.15s ease-in forwards; }
                @keyframes enter { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                @keyframes leave { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.9); } }
            `}</style>
        </div>
    );
}