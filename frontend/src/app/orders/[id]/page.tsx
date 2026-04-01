"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";
import {
    Loader2,
    ChevronLeft,
    MapPin,
    CreditCard,
    Package,
    Phone,
    User,
    Truck,
    CheckCircle2,
    Clock,
    XCircle,
    AlertCircle,
    Sparkles,
    StickyNote
} from "lucide-react";

import { Header, Footer } from "@/components/common";
import { Button } from "@/components/ui/button";

import { formatCurrency, formatDate } from "@/lib/utils";
import useOrderDetails from "@/hooks/useOrderDetails";

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;

    const { order, isLoading, error, cancelOrderApi } = useOrderDetails(orderId);

    const handleCancelClick = () => {
        toast((t) => (
            <div className="min-w-[300px] p-2">
                <p className="font-semibold text-gray-800 mb-1">Xác nhận hủy đơn hàng?</p>
                <p className="text-sm text-gray-500 mb-4">Hành động này không thể hoàn tác.</p>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                        Đóng
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            executeCancel();
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors shadow-sm"
                    >
                        Đồng ý hủy
                    </button>
                </div>
            </div>
        ), {
            duration: 5000,
            style: { border: '1px solid #E5E7EB' }
        });
    };

    const executeCancel = async () => {
        const loadingToast = toast.loading("Đang xử lý yêu cầu...");
        try {
            await cancelOrderApi();
            toast.success("Đã hủy đơn hàng thành công!", { id: loadingToast });
        } catch (err: any) {
            toast.error(err.message || "Lỗi khi hủy đơn hàng", { id: loadingToast });
        }
    };

    const renderTimeline = (status: string) => {
        if (status === "CANCELLED") {
            return (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-red-700 mb-8 animate-in fade-in zoom-in duration-300">
                    <XCircle size={32} />
                    <span className="font-bold text-lg">Đơn hàng đã bị hủy</span>
                    <span className="text-sm text-red-600">Vui lòng liên hệ hỗ trợ nếu đây là sự nhầm lẫn.</span>
                </div>
            );
        }

        const steps = [
            { key: "PENDING", label: "Đã đặt hàng", icon: Clock },
            { key: "IN_PROGRESS", label: "Đang vận chuyển", icon: Truck },
            { key: "COMPLETED", label: "Hoàn thành", icon: CheckCircle2 },
        ];

        const currentStepIndex = steps.findIndex(s => s.key === status);
        const activeIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

        return (
            <div className="relative flex justify-between items-center w-full max-w-3xl mx-auto mb-10 px-4 mt-4">
                <div className="absolute top-1/2 left-4 right-4 h-1 bg-gray-200 -z-10 -translate-y-1/2 rounded-full"></div>
                <div
                    className="absolute top-1/2 left-4 h-1 bg-[#D96C39] -z-10 -translate-y-1/2 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
                ></div>

                {steps.map((step, index) => {
                    const isActive = index <= activeIndex;
                    const Icon = step.icon;

                    return (
                        <div key={step.key} className="flex flex-col items-center gap-3 bg-[#F7F1E8] px-2">
                            <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 z-10 
                                ${isActive
                                    ? "bg-[#D96C39] border-[#D96C39] text-white shadow-lg scale-110"
                                    : "bg-white border-gray-300 text-gray-400"}`}
                            >
                                <Icon size={20} />
                            </div>
                            <span className={`text-xs sm:text-sm font-semibold transition-colors duration-300 ${isActive ? "text-[#D96C39]" : "text-gray-400"}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    const isCustomOrder = order && order.chatId;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F7F1E8] flex flex-col">
                <Header />
                <div className="flex-grow flex flex-col items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-[#D96C39] mb-4" />
                    <p className="text-[#6B4F3E] font-medium animate-pulse">Đang tải chi tiết đơn hàng...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-[#F7F1E8] flex flex-col">
                <Header />
                <div className="flex-grow flex flex-col items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-red-100 text-center max-w-md w-full">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-[#3F2E23] mb-2">Không thể tải đơn hàng</h2>
                        <p className="text-gray-500 mb-6">{error || "Không tìm thấy thông tin đơn hàng này."}</p>
                        <Link href="/account/orders">
                            <Button className="bg-[#3F2E23] hover:bg-[#2A1E17] text-white w-full">
                                <ChevronLeft className="mr-2 h-4 w-4" /> Quay lại danh sách
                            </Button>
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: '#F7F1E8', color: '#3F2E23' }}>
            <Toaster position="top-center" />
            <Header />

            <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-500">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <Link href="/account/orders" className="inline-flex items-center text-sm font-medium text-[#6B4F3E] hover:text-[#D96C39] transition-colors group">
                        <ChevronLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" />
                        Quay lại lịch sử đơn hàng
                    </Link>
                </div>

                {/* Header Info */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-[#E8D5B5]">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-[#D96C39] text-white text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Order</span>

                            {isCustomOrder && (
                                <span className="flex items-center gap-1 bg-purple-100 text-purple-700 border border-purple-200 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                                    <Sparkles size={12} />
                                    Đơn thiết kế riêng
                                </span>
                            )}

                            <span className="text-sm text-[#6B4F3E] ml-auto md:ml-0 border-l border-[#6B4F3E]/30 pl-3 font-medium">
                                {formatDate(order.orderDate)}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-[#3F2E23] flex items-center gap-2">
                            Đơn hàng #{order.id}
                        </h1>
                    </div>

                    {/* Action Buttons */}
                    {order.status === "PENDING" && (
                        <Button
                            variant="destructive"
                            onClick={handleCancelClick}
                            className="bg-white text-red-600 border border-red-200 hover:bg-red-50 shadow-sm rounded-full px-6"
                        >
                            <XCircle size={16} className="mr-2" />
                            Hủy đơn hàng
                        </Button>
                    )}
                </div>

                {/* Timeline Process */}
                {renderTimeline(order.status)}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN: Products List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: '#E8D5B5' }}>
                            <div className="bg-[#FFF8F0] px-6 py-4 border-b border-[#E8D5B5] flex items-center gap-2">
                                <Package size={20} className="text-[#D96C39]" />
                                <h3 className="font-bold text-[#3F2E23] text-lg">Sản phẩm ({order.items.length})</h3>
                            </div>

                            <div className="p-6 divide-y divide-gray-100">
                                {order.items.map((item, idx) => {
                                    // 👉 Bọc an toàn để tránh lỗi string.startsWith is not a function nếu null
                                    let imageUrl = item.productImage || '/tramhon-logo.png';
                                    if (typeof imageUrl === 'string') {
                                        if (imageUrl.startsWith('//')) imageUrl = `https:${imageUrl}`;
                                        if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                                            imageUrl = `http://127.0.0.1:8000/${imageUrl}`;
                                        }
                                    }

                                    return (
                                        <div key={idx} className="flex gap-4 py-5 first:pt-0 last:pb-0 group">
                                            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border bg-gray-50 border-[#E8D5B5]">
                                                <Image
                                                    src={imageUrl}
                                                    alt={item.productName || 'Sản phẩm'}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>

                                            <div className="flex-1 flex flex-col justify-center">
                                                <h4 className="font-bold text-[#3F2E23] text-base md:text-lg line-clamp-2 mb-1">
                                                    {item.productName}
                                                </h4>
                                                <div className="flex flex-wrap items-end justify-between gap-2 mt-2">
                                                    <div className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 inline-flex items-center gap-1.5">
                                                        {formatCurrency(item.price || item.priceOrder || 0)} 
                                                        <span className="text-xs text-gray-400">x</span> 
                                                        <span className="text-[#3F2E23]">{item.quantity}</span>
                                                    </div>
                                                    <span className="font-bold text-[#D96C39] text-lg">
                                                        {formatCurrency(item.subtotal || ((item.price || item.priceOrder || 0) * item.quantity))}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Info & Payment */}
                    <div className="space-y-6">

                        {order.note && (
                            <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: '#E8D5B5' }}>
                                <div className="bg-[#FFF8F0] px-6 py-4 border-b border-[#E8D5B5] flex items-center gap-2">
                                    <StickyNote size={20} className="text-[#D96C39]" />
                                    <h3 className="font-bold text-[#3F2E23]">Ghi chú đơn hàng</h3>
                                </div>
                                <div className="p-6">
                                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-[#3F2E23] text-sm italic relative">
                                        <span className="absolute -top-3 -left-1 text-3xl text-yellow-400 opacity-50">“</span>
                                        <p className="relative z-10">{order.note}</p>
                                        <span className="absolute -bottom-5 -right-1 text-3xl text-yellow-400 opacity-50">”</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Customer Info */}
                        <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: '#E8D5B5' }}>
                            <div className="bg-[#FFF8F0] px-6 py-4 border-b border-[#E8D5B5] flex items-center gap-2">
                                <MapPin size={20} className="text-[#D96C39]" />
                                <h3 className="font-bold text-[#3F2E23]">Địa chỉ nhận hàng</h3>
                            </div>
                            <div className="p-6 space-y-5">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                        <User size={16} className="text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Người nhận</p>
                                        <p className="font-bold text-[#3F2E23]">{order.customerName}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                        <Phone size={16} className="text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Số điện thoại</p>
                                        <p className="font-bold text-[#3F2E23]">{order.customerPhone}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                        <MapPin size={16} className="text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Địa chỉ giao hàng</p>
                                        <p className="font-medium text-[#3F2E23] leading-relaxed text-sm">{order.shippingAddress}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: '#E8D5B5' }}>
                            <div className="bg-[#FFF8F0] px-6 py-4 border-b border-[#E8D5B5] flex items-center gap-2">
                                <CreditCard size={20} className="text-[#D96C39]" />
                                <h3 className="font-bold text-[#3F2E23]">Thông tin thanh toán</h3>
                            </div>
                            <div className="p-6 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">Phương thức:</span>
                                    <span className="font-bold text-[#3F2E23] bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                        {order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : order.paymentMethod}
                                    </span>
                                </div>

                                <div className="border-t border-dashed border-gray-200 my-4"></div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-medium">Tạm tính:</span>
                                    <span className="font-bold text-[#3F2E23]">{formatCurrency(order.totalPrice)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-medium">Phí vận chuyển:</span>
                                    <span className="font-bold text-[#3F2E23]">{formatCurrency(order.shippingFee || 0)}</span>
                                </div>

                                <div className="border-t border-gray-200 pt-4 mt-4 flex justify-between items-center bg-[#FFF8F0] -mx-6 px-6 -mb-6 pb-6">
                                    <span className="font-bold text-[#3F2E23] text-lg uppercase">Tổng cộng</span>
                                    <span className="text-2xl font-extrabold text-[#D96C39]">
                                        {formatCurrency(order.finalTotal || (order.totalPrice + (order.shippingFee || 0)))}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Support Button */}
                        <div className="text-center pt-2">
                            <Button
                                variant="outline"
                                className="w-full text-[#6B4F3E] border-[#E8D5B5] hover:bg-[#FFF8F0] hover:text-[#D96C39] transition-colors rounded-full font-bold h-12"
                            >
                                Liên hệ hỗ trợ đơn hàng
                            </Button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}