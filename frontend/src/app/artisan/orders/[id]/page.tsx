'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
    Package, MapPin, CreditCard, Calendar, ChevronLeft,
    CheckCircle2, XCircle, Clock, Truck, FileText, User, Phone, AlertCircle, Loader2, AlertTriangle, X
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import useAxiosAuth from '@/hooks/useAxiosAuth';
import { RawOrderDetail } from '@/types/apiTypes';
import type { StoredOrder } from '@/lib/ordersStorage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import toast, { Toaster } from 'react-hot-toast';
import type { PaymentMethod } from '@/types';

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

// Cập nhật bộ trạng thái chuẩn
const statusConfig: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
    PENDING_PICKUP: { label: 'Đang chờ lấy hàng', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: Clock },
    PACKAGING: { label: 'Đang đóng gói hàng', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Package },
    SHIPPING: { label: 'Đang giao hàng', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: Truck },
    DELIVERED: { label: 'Đã nhận hàng', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2 },
    COMPLETED: { label: 'Hoàn thành', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle2 },
    CANCELLED: { label: 'Đã hủy', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle },
    REFUNDED: { label: 'Đã hoàn tiền', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: XCircle },
};

const paymentLabels: Record<string, string> = {
    cod: 'Thanh toán khi nhận hàng (COD)',
    bank_transfer: 'Chuyển khoản ngân hàng',
    credit_card: 'Thẻ tín dụng / Ghi nợ',
};

export default function ArtisanOrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const axiosAuth = useAxiosAuth();

    const orderId = Number(params.id);
    const [order, setOrder] = useState<StoredOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State cho Modal Hủy đơn
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);

    const fetchOrder = async () => {
        try {
            const response = await axiosAuth.get<RawOrderDetail>(`/orders/${orderId}/`);
            const orderData = response.data;

            const mapBackendPayment = (m: string): PaymentMethod => {
                switch (m) {
                    case 'COD': return 'cod';
                    case 'ONLINE':
                    case 'BANK_TRANSFER': return 'bank_transfer';
                    default: return 'cod';
                }
            };

            const mappedOrder: any = {
                id: orderData.id,
                orderNumber: `ART-${orderData.id}`,
                customerName: orderData.customerName,
                phone: orderData.customerPhone,
                status: orderData.status?.toUpperCase() || 'PENDING_PICKUP',
                createdAt: orderData.orderDate,
                subtotal: Number(orderData.totalPrice || 0),
                shippingFee: Number(orderData.shippingFee || 0),
                total: Number(orderData.finalTotal || orderData.totalPrice || 0),
                paymentMethod: mapBackendPayment(orderData.paymentMethod),
                shippingAddress: {
                    fullName: orderData.customerName,
                    phone: orderData.customerPhone,
                    email: '',
                    address: orderData.shippingAddress,
                    note: orderData.note || undefined,
                },
                items: orderData.items.map((item) => ({
                    productId: item.productId,
                    productName: item.productName,
                    quantity: Number(item.quantity || 0),
                    price: Number(item.priceOrder || item.price || 0),
                    image: item.productImage || undefined,
                })),
            };

            setOrder(mappedOrder);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Không thể tải chi tiết đơn hàng.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!orderId || isNaN(orderId)) {
            setError("Mã đơn hàng không hợp lệ.");
            setLoading(false);
            return;
        }
        fetchOrder();
    }, [orderId, axiosAuth]);

    const handleCancelOrder = async () => {
        if (!cancelReason.trim()) {
            toast.error('Vui lòng nhập lý do hủy đơn hàng!');
            return;
        }

        setIsCancelling(true);
        try {
            await axiosAuth.put(`/orders/${orderId}/cancel/`, {
                note: `Lý do hủy đơn: ${cancelReason.trim()}`
            });
            toast.success('Đã hủy đơn hàng thành công!');
            setIsCancelModalOpen(false);
            setCancelReason('');
            await fetchOrder(); // Refresh lại data
        } catch (error: any) {
            console.error('Error cancelling order:', error);
            const msg = error.response?.data?.message || 'Không thể hủy đơn hàng lúc này';
            toast.error(msg);
        } finally {
            setIsCancelling(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#E8D5B5] border-t-[#D96C39]"></div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="text-center bg-white p-8 rounded-2xl border border-[#E8D5B5] shadow-sm max-w-sm w-full">
                    <div className="text-4xl mb-4">🔍</div>
                    <h1 className="text-lg font-bold text-[#3F2E23] mb-2">Không tìm thấy đơn hàng</h1>
                    <p className="text-sm text-[#6B4F3E] mb-6">{error}</p>
                    <Button onClick={() => router.push('/artisan/orders')} className="w-full bg-[#3F2E23] hover:bg-black">
                        Về danh sách
                    </Button>
                </div>
            </div>
        );
    }

    const currentStatusConfig = statusConfig[order.status] || { label: order.status, bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: Package };
    const StatusIcon = currentStatusConfig.icon;

    // Check xem đơn có nằm trong nhóm trạng thái cho phép hủy không
    const canCancel = !['DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED'].includes(order.status);
    const isCancelled = order.status === 'CANCELLED';

    const rawNote = order.shippingAddress.note || "";
    const hasCancelReason = rawNote.includes("Lý do hủy đơn:");
    const cancelReasonText = hasCancelReason ? rawNote.split("Lý do hủy đơn:").pop()?.trim() : "";
    const normalNoteText = hasCancelReason ? rawNote.split("Lý do hủy đơn:")[0].replace("---", "").trim() : rawNote;

    return (
        <div className="space-y-6 pb-10">
            <Toaster position="top-right" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Button
                    variant="outline"
                    onClick={() => router.push('/artisan/orders')}
                    className="w-max border-[#E8D5B5] text-[#3F2E23] hover:bg-[#FFF8F0] shadow-sm"
                >
                    <ChevronLeft size={16} className="mr-1.5" /> Quay lại danh sách
                </Button>

                <div className="flex items-center gap-3">
                    {/* Chỉ hiện nút Hủy đơn nếu đơn hàng ở trạng thái hợp lệ */}
                    {canCancel && (
                        <Button
                            onClick={() => setIsCancelModalOpen(true)}
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 shadow-sm"
                        >
                            <XCircle size={16} className="mr-1.5" /> Từ chối / Hủy đơn
                        </Button>
                    )}
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#E8D5B5] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#3F2E23] flex items-center gap-2">
                        Đơn hàng {order.orderNumber}
                    </h1>
                    <p className="text-sm text-[#6B4F3E] font-medium mt-1 flex items-center gap-1.5">
                        <Calendar size={14} /> {formatDate(order.createdAt)}
                    </p>
                </div>
                {/* Trạng thái giờ chỉ hiển thị, không được phép chọn nữa */}
                <div className={`px-4 py-2 rounded-full border ${currentStatusConfig.bg} ${currentStatusConfig.border} ${currentStatusConfig.text} text-sm font-bold flex items-center gap-1.5 shadow-sm`}>
                    <StatusIcon size={16} /> {currentStatusConfig.label}
                </div>
            </div>

            {isCancelled && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm animate-in fade-in">
                    <div className="bg-white p-2.5 rounded-full shrink-0 border border-red-100 shadow-sm">
                        <XCircle className="text-red-600 w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-base font-bold text-red-700">Đơn hàng đã bị hủy</h2>
                        {cancelReasonText && (
                            <p className="text-sm text-red-600 mt-1">Lý do: <span className="font-bold">{cancelReasonText}</span></p>
                        )}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white rounded-2xl border border-[#E8D5B5] shadow-sm overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-[#E8D5B5] bg-[#FFF8F0] flex items-center justify-between">
                            <h3 className="font-bold text-[#3F2E23] flex items-center gap-2 text-sm">
                                <Package size={18} className="text-[#D96C39]" /> Thông tin sản phẩm ({order.items.length})
                            </h3>
                        </div>
                        <div className="p-5 space-y-4 flex-grow">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 pb-4 border-b border-dashed border-[#E8D5B5] last:border-0 last:pb-0">
                                    <Link href={`/shop/id/${item.productId}`} className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#F7F1E8] border border-[#E8D5B5] shrink-0 block hover:opacity-80 transition-opacity">
                                        <Image src={getProductImageUrl(item.image)} alt={item.productName} fill className="object-cover" />
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/shop/id/${item.productId}`}>
                                            <h4 className="font-bold text-sm text-[#3F2E23] line-clamp-2 leading-snug hover:text-[#D96C39] transition-colors">{item.productName}</h4>
                                        </Link>
                                        <p className="text-xs text-[#6B4F3E] mt-1.5 font-medium">SL: {item.quantity}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-bold text-[#D96C39] text-base">{formatCurrency(item.price * item.quantity)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-[#FDFBF7] p-5 border-t border-[#E8D5B5]">
                            <div className="space-y-2.5 text-sm text-[#6B4F3E] font-medium">
                                <div className="flex justify-between items-center">
                                    <span>Tạm tính</span>
                                    <span className="text-[#3F2E23] font-bold">{formatCurrency(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Phí vận chuyển</span>
                                    <span>{order.shippingFee === 0 ? <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded text-[11px]">Miễn phí</span> : formatCurrency(order.shippingFee)}</span>
                                </div>
                            </div>
                            <div className="mt-3.5 pt-3.5 border-t border-dashed border-[#E8D5B5] flex justify-between items-center">
                                <span className="text-base font-bold text-[#3F2E23]">Tổng cộng</span>
                                <span className="text-xl font-black text-[#D96C39]">{formatCurrency(order.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-[#E8D5B5] shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-[#E8D5B5] bg-[#FFF8F0]">
                            <h3 className="font-bold text-[#3F2E23] flex items-center gap-2 text-sm">
                                <User size={18} className="text-[#D96C39]" /> Thông tin khách hàng
                            </h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <p className="text-[10px] font-bold text-[#6B4F3E] uppercase tracking-wider mb-1">Người mua</p>
                                <p className="font-bold text-[#3F2E23] text-base">{order.customerName}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-[#6B4F3E] uppercase tracking-wider mb-1">Số điện thoại</p>
                                <p className="font-bold text-[#3F2E23] text-sm flex items-center gap-1.5"><Phone size={14} className="text-[#6B4F3E]" /> {order.phone}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-[#E8D5B5] shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-[#E8D5B5] bg-[#FFF8F0]">
                            <h3 className="font-bold text-[#3F2E23] flex items-center gap-2 text-sm">
                                <MapPin size={18} className="text-[#D96C39]" /> Thông tin giao hàng
                            </h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <p className="text-[10px] font-bold text-[#6B4F3E] uppercase tracking-wider mb-1">Người nhận hàng</p>
                                <p className="font-bold text-[#3F2E23] text-sm">{order.shippingAddress.fullName} - {order.shippingAddress.phone}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-[#6B4F3E] uppercase tracking-wider mb-1">Địa chỉ chi tiết</p>
                                <p className="font-medium text-[#3F2E23] leading-relaxed text-sm">{order.shippingAddress.address}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-[#E8D5B5] shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-[#E8D5B5] bg-[#FFF8F0]">
                            <h3 className="font-bold text-[#3F2E23] flex items-center gap-2 text-sm">
                                <CreditCard size={18} className="text-[#D96C39]" /> Phương thức thanh toán
                            </h3>
                        </div>
                        <div className="p-5">
                            <Badge variant="outline" className="bg-[#FFF8F0] border-[#D96C39] text-[#D96C39] px-3 py-1 font-bold">
                                {paymentLabels[order.paymentMethod] || order.paymentMethod}
                            </Badge>
                        </div>
                    </div>

                    {normalNoteText && !isCancelled && (
                        <div className="bg-white rounded-2xl border border-[#E8D5B5] shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-[#E8D5B5] bg-[#FFF8F0]">
                                <h3 className="font-bold text-[#3F2E23] flex items-center gap-2 text-sm">
                                    <FileText size={18} className="text-[#D96C39]" /> Ghi chú từ khách hàng
                                </h3>
                            </div>
                            <div className="p-5">
                                <p className="font-medium text-[#D96C39] italic text-sm">"{normalNoteText}"</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL HỦY ĐƠN */}
            {isCancelModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl scale-in-95 animate-in">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-red-50/50">
                            <h3 className="font-bold text-red-700 flex items-center gap-2 text-lg">
                                <AlertTriangle size={20} className="text-red-600" />
                                Xác nhận hủy đơn hàng
                            </h3>
                            <button
                                onClick={() => setIsCancelModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-[#3F2E23] mb-2">
                                    Lý do hủy đơn <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none h-28 transition-shadow"
                                    placeholder="Vui lòng nhập lý do (VD: Hết nguyên liệu, Khách yêu cầu hủy, ...)"
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl flex gap-2">
                                <span className="text-sm">💡</span>
                                <p className="text-xs text-orange-800 leading-relaxed font-medium">
                                    Lưu ý: Hủy đơn hàng sẽ tự động gửi thông báo cho khách hàng và trả lại tồn kho. Hành động này không thể hoàn tác!
                                </p>
                            </div>
                        </div>

                        <div className="p-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setIsCancelModalOpen(false)}
                                disabled={isCancelling}
                                className="border-gray-300 text-[#3F2E23] font-bold rounded-xl h-11"
                            >
                                Quay lại
                            </Button>
                            <Button
                                onClick={handleCancelOrder}
                                disabled={isCancelling || !cancelReason.trim()}
                                className="bg-red-600 hover:bg-red-700 text-white min-w-[140px] font-bold rounded-xl h-11 shadow-md"
                            >
                                {isCancelling ? <Loader2 className="animate-spin h-5 w-5" /> : 'Xác nhận Hủy đơn'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}