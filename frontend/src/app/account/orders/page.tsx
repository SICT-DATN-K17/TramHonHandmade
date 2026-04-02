"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import useMyOrders from "@/hooks/useMyOrders";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2, Package, Calendar, ChevronRight, XCircle, AlertTriangle, X, AlertCircle as AlertCircleIcon } from "lucide-react";
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

const CANCEL_REASONS = [
    "Muốn thay đổi địa chỉ giao hàng",
    "Muốn thay đổi sản phẩm/số lượng",
    "Tìm thấy giá rẻ hơn ở nơi khác",
    "Đổi ý không muốn mua nữa",
    "Thời gian giao hàng quá lâu",
    "Khác"
];

export default function MyOrdersPage() {
    const { orders, isLoading, error, cancelOrder } = useMyOrders();

    // --- STATE FOR CANCEL MODAL ---
    const [cancelModalData, setCancelModalData] = useState<{ isOpen: boolean, orderId: number | null }>({ isOpen: false, orderId: null });
    const [selectedReason, setSelectedReason] = useState<string>("");
    const [customReason, setCustomReason] = useState<string>("");
    const [isCancelling, setIsCancelling] = useState(false);

    // Mở Modal Hủy
    const openCancelModal = (orderId: number) => {
        setCancelModalData({ isOpen: true, orderId });
        setSelectedReason("");
        setCustomReason("");
    };

    // Đóng Modal
    const closeCancelModal = () => {
        if (!isCancelling) {
            setCancelModalData({ isOpen: false, orderId: null });
        }
    };

    // Thực thi Hủy
    const performCancellation = async () => {
        if (!selectedReason) {
            toast.error("Vui lòng chọn lý do hủy đơn!");
            return;
        }
        
        if (selectedReason === "Khác" && !customReason.trim()) {
            toast.error("Vui lòng nhập lý do cụ thể!");
            return;
        }

        const finalReason = selectedReason === "Khác" ? customReason.trim() : selectedReason;
        const cancelNoteText = `Lý do hủy đơn: ${finalReason}`;

        setIsCancelling(true);
        const toastId = toast.loading('Đang xử lý hủy đơn...');

        try {
            await cancelOrder(cancelModalData.orderId!, cancelNoteText);
            toast.success(<b>Đã hủy đơn hàng #{cancelModalData.orderId} thành công!</b>, { id: toastId });
            closeCancelModal();
        } catch (err: any) {
            toast.error(<b>{err.message || 'Lỗi khi hủy đơn'}</b>, { id: toastId });
        } finally {
            setIsCancelling(false);
        }
    };

    // Hàm helper render badge
    const renderStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; className: string; icon: string }> = {
            PENDING: { label: "Đang chờ xử lý", className: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: "⏳" },
            IN_PROGRESS: { label: "Đang giao hàng", className: "bg-blue-100 text-blue-800 border-blue-200", icon: "🚚" },
            COMPLETED: { label: "Hoàn thành", className: "bg-green-100 text-green-800 border-green-200", icon: "✅" },
            CANCELLED: { label: "Đã hủy", className: "bg-red-100 text-red-800 border-red-200", icon: "❌" },
        };
        const config = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800", icon: "📦" };
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
                {/* Header Page */}
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
                            const isCancelled = order.status === 'cancelled';
                            const rawNote = order.shippingAddress?.note || "";
                            const hasCancelReason = rawNote.includes("Lý do hủy đơn:");
                            const cancelReasonText = hasCancelReason ? rawNote.replace("Lý do hủy đơn:", "").trim() : "";

                            return (
                                <div
                                    key={order.id}
                                    className={`group overflow-hidden rounded-2xl border transition-all duration-500 hover:shadow-md bg-white animate-in fade-in slide-in-from-bottom-4 ${isCancelled ? 'border-red-200' : 'border-[#E8D5B5]'}`}
                                    style={{ animationFillMode: 'both', animationDelay: `${idx * 100}ms` }}
                                >
                                    {/* Header Order */}
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
                                        <div className="flex items-center gap-3">{renderStatusBadge(order.status)}</div>
                                    </div>

                                    {/* HIỂN THỊ LÝ DO HỦY NGAY TRONG COMPONENT NÀY NẾU LÀ ĐƠN HỦY */}
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

                                    {/* Body Order */}
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

                                    {/* Footer Order */}
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E8D5B5] px-6 py-5 bg-gray-50/30">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium uppercase tracking-wider" style={{ color: '#6B4F3E' }}>Tổng giá trị:</span>
                                            <span className="text-2xl font-black" style={{ color: '#D96C39' }}>
                                                {formatCurrency(Number(order.totalPrice || order.total))}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                            {order.status === "pending" && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => openCancelModal(order.id)}
                                                    className="flex-1 sm:flex-none border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 font-bold h-11 rounded-xl transition-all"
                                                >
                                                    <XCircle size={18} className="mr-1.5" /> Hủy đơn
                                                </Button>
                                            )}

                                            {/* Sửa lại Link để trỏ đúng vào account/orders/[id] */}
                                            <Link href={`/account/orders/${order.id}`} className="flex-1 sm:flex-none">
                                                <Button className="w-full sm:w-auto text-white font-bold h-11 rounded-xl shadow-md hover:bg-black hover:shadow-lg transition-all" style={{ backgroundColor: '#3F2E23' }}>
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

            {/* --- MODAL HỦY ĐƠN HÀNG XỊN SÒ --- */}
            {cancelModalData.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-[#E8D5B5] overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="bg-red-50 p-5 flex items-center justify-between border-b border-red-100 shrink-0">
                            <h3 className="font-bold flex items-center gap-2 text-red-700 text-lg">
                                <AlertTriangle size={22} className="text-red-600" /> Lý do hủy đơn #{cancelModalData.orderId}
                            </h3>
                            <button onClick={closeCancelModal} disabled={isCancelling} className="text-gray-400 hover:text-red-600 transition bg-white rounded-full p-1.5 shadow-sm border border-gray-200">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <p className="text-sm font-medium text-[#6B4F3E] mb-4">Vui lòng cho chúng tôi biết lý do bạn muốn hủy đơn hàng này nhé:</p>
                            
                            <div className="space-y-3">
                                {CANCEL_REASONS.map((reason, idx) => (
                                    <label key={idx} className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedReason === reason ? 'border-red-500 bg-red-50/50' : 'border-[#E8D5B5] hover:bg-gray-50'}`}>
                                        <input
                                            type="radio"
                                            name="cancelReason"
                                            value={reason}
                                            checked={selectedReason === reason}
                                            onChange={(e) => setSelectedReason(e.target.value)}
                                            className="mt-0.5 w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300 cursor-pointer"
                                            disabled={isCancelling}
                                        />
                                        <span className={`ml-3 text-sm font-medium ${selectedReason === reason ? 'text-red-800 font-bold' : 'text-[#3F2E23]'}`}>
                                            {reason}
                                        </span>
                                    </label>
                                ))}
                            </div>

                            {/* Textarea nhập lý do Khác */}
                            {selectedReason === "Khác" && (
                                <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                                    <label className="block text-xs font-bold text-[#6B4F3E] uppercase tracking-wider mb-2">Nhập lý do cụ thể <span className="text-red-500">*</span></label>
                                    <textarea
                                        value={customReason}
                                        onChange={(e) => setCustomReason(e.target.value)}
                                        placeholder="Ví dụ: Nghệ nhân yêu cầu hủy đơn, thay đổi phương thức thanh toán..."
                                        rows={3}
                                        className="w-full rounded-xl border border-red-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-[#3F2E23]"
                                        disabled={isCancelling}
                                    />
                                </div>
                            )}

                            <div className="mt-5 p-3 bg-orange-50 border border-orange-100 rounded-lg flex gap-2">
                                <span className="text-sm">💡</span>
                                <p className="text-xs text-orange-800 leading-relaxed font-medium">Lưu ý: Thao tác này không thể hoàn tác. Nếu bạn đã thanh toán, tiền sẽ được hoàn về theo chính sách của Trạm Hồn.</p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-5 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 shrink-0">
                            <Button variant="outline" onClick={closeCancelModal} disabled={isCancelling} className="border-gray-300 text-[#3F2E23] font-bold rounded-xl h-11">
                                Quay lại
                            </Button>
                            <Button onClick={performCancellation} disabled={isCancelling || !selectedReason} className="bg-red-600 hover:bg-red-700 text-white min-w-[140px] font-bold rounded-xl h-11 shadow-md">
                                {isCancelling ? <Loader2 className="animate-spin h-5 w-5" /> : 'Đồng ý hủy đơn'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}