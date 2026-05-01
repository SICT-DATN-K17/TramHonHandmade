'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Header, Footer } from '@/components/common';
import { Button } from '@/components/ui/button';
import { 
    Package, MapPin, CreditCard, Calendar, ChevronLeft, 
    CheckCircle2, XCircle, Clock, Truck, FileText, Store, AlertTriangle, X, Loader2
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import useAxiosAuth from '@/hooks/useAxiosAuth';
import useMyOrders from '@/hooks/useMyOrders'; 
import { RawOrderDetail, RawOrderDetailItem, MappedOrder, OrderStatusType } from '@/types/apiTypes';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const CANCEL_REASONS = [
    "Muốn thay đổi địa chỉ giao hàng",
    "Muốn thay đổi sản phẩm/số lượng",
    "Tìm thấy giá rẻ hơn ở nơi khác",
    "Đổi ý không muốn mua nữa",
    "Thời gian giao hàng quá lâu",
    "Khác"
];

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

const statusConfig: Record<string, { label: string; bg: string; text: string; border: string; icon: React.ElementType }> = {
    PENDING_PICKUP: { label: 'Đang chờ lấy hàng', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: Clock },
    PACKAGING: { label: 'Đang đóng gói hàng', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Package },
    SHIPPING: { label: 'Đang giao hàng', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: Truck },
    DELIVERED_AWAITING: { label: 'Đang giao hàng', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: Truck },
    DELIVERED: { label: 'Đã giao hàng', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2 },
    COMPLETED: { label: 'Hoàn thành', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle2 },
    CANCELLED: { label: 'Đã hủy', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle },
    REFUNDED: { label: 'Đã hoàn tiền', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: XCircle },
};

const paymentLabels: Record<string, string> = {
    cod: 'Thanh toán khi nhận hàng (COD)',
    bank_transfer: 'Chuyển khoản ngân hàng',
    credit_card: 'Thẻ tín dụng / Ghi nợ',
};

export default function CustomerOrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const axiosAuth = useAxiosAuth();
    const { cancelOrder, refetch } = useMyOrders();
    
    const orderId = Number(params.id);
    const [order, setOrder] = useState<MappedOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [selectedReason, setSelectedReason] = useState<string>("");
    const [customReason, setCustomReason] = useState<string>("");
    const [isCancelling, setIsCancelling] = useState(false);
    
    const [isConfirming, setIsConfirming] = useState(false);

    useEffect(() => {
        if (!orderId || isNaN(orderId)) {
            setError("Mã đơn hàng không hợp lệ.");
            setLoading(false);
            return;
        }

        const fetchOrder = async () => {
            try {
                const response = await axiosAuth.get<RawOrderDetail>(`/orders/${orderId}`);
                const orderData = response.data;

                const mapBackendStatus = (s: string): OrderStatusType => {
                    const valid = ['PENDING_PICKUP', 'PACKAGING', 'SHIPPING', 'DELIVERED_AWAITING', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED'];
                    const upper = s?.toUpperCase();
                    return valid.includes(upper) ? (upper as OrderStatusType) : 'PENDING_PICKUP';
                };

                const mapBackendPayment = (m: string) => {
                    switch (m) {
                        case 'COD': return 'cod';
                        case 'ONLINE':
                        case 'BANK_TRANSFER': return 'bank_transfer';
                        default: return 'cod';
                    }
                };

                const subtotal = Number(orderData.totalPrice || 0);

                const mappedOrder: MappedOrder = {
                    id: orderData.id,
                    orderNumber: `ART-${orderData.id}`,
                    customerName: orderData.customerName,
                    phone: orderData.customerPhone,
                    status: mapBackendStatus(orderData.status),
                    createdAt: orderData.orderDate,
                    subtotal: subtotal,
                    shippingFee: 0, 
                    total: subtotal, 
                    paymentMethod: mapBackendPayment(orderData.paymentMethod),
                    artisanId: orderData.artisanId,
                    artisanName: orderData.artisanName,
                    shippingAddress: {
                        fullName: orderData.customerName,
                        phone: orderData.customerPhone,
                        email: '',
                        address: orderData.shippingAddress,
                        note: orderData.note || undefined,
                    },
                    items: orderData.items.map((item: RawOrderDetailItem) => ({
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

        fetchOrder();
    }, [orderId, axiosAuth]);

    const closeCancelModal = () => {
        if (!isCancelling) {
            setIsCancelModalOpen(false);
            setSelectedReason("");
            setCustomReason("");
        }
    };

    const confirmDelivery = async () => {
        const toastId = toast.loading('Đang cập nhật trạng thái...');
        setIsConfirming(true);
        try {
            await axiosAuth.put(`/orders/${orderId}/confirm-delivery/`);
            toast.success(<b>Đã xác nhận nhận hàng! Cảm ơn bạn.</b>, { id: toastId });
            
            setOrder(prev => prev ? { ...prev, status: 'DELIVERED' } : null);
            if (refetch) refetch(); 
        } catch (err: any) {
            toast.error(<b>{err.response?.data?.message || 'Có lỗi xảy ra khi xác nhận.'}</b>, { id: toastId });
        } finally {
            setIsConfirming(false);
        }
    };

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
            await cancelOrder(orderId, cancelNoteText);
            toast.success(<b>Đã hủy đơn hàng #{orderId} thành công!</b>, { id: toastId });
            
            setOrder(prev => prev ? { ...prev, status: 'CANCELLED', shippingAddress: { ...prev.shippingAddress, note: (prev.shippingAddress.note ? prev.shippingAddress.note + " | " : "") + cancelNoteText } } : null);
            
            closeCancelModal();
        } catch (err: any) {
            toast.error(<b>{err.message || 'Lỗi khi hủy đơn'}</b>, { id: toastId });
        } finally {
            setIsCancelling(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
                <Header />
                <main className="flex-grow flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#E8D5B5] border-t-[#D96C39]"></div>
                </main>
                <Footer />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
                <Header />
                <main className="flex-grow container mx-auto px-4 py-12 flex items-center justify-center">
                    <div className="text-center bg-white p-8 rounded-2xl border border-[#E8D5B5] shadow-sm max-w-sm w-full">
                        <div className="text-4xl mb-4">🔍</div>
                        <h1 className="text-lg font-bold text-[#3F2E23] mb-2">Không tìm thấy đơn hàng</h1>
                        <p className="text-sm text-[#6B4F3E] mb-6">{error}</p>
                        <Link href="/account/orders" className="inline-flex items-center justify-center bg-[#3F2E23] text-white px-6 py-2 rounded-lg font-bold hover:bg-black transition-colors w-full text-sm">
                            Về danh sách
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const StatusIcon = statusConfig[order.status]?.icon || Package;
    const isCancelled = order.status === 'CANCELLED';
    
    const rawNote = order.shippingAddress.note || "";
    const hasCancelReason = rawNote.includes("Lý do hủy đơn:");
    const cancelReasonText = hasCancelReason ? rawNote.replace("Lý do hủy đơn:", "").trim() : "";
    const normalNoteText = hasCancelReason ? "" : rawNote;

    const displayArtisanName = order.artisanName || 'Gian Hàng Chế Tác';
    const canCancel = !['DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED'].includes(order.status);
    const canConfirmDelivery = ['SHIPPING', 'DELIVERED_AWAITING'].includes(order.status);

    return (
        <div className="min-h-screen font-sans text-[#3F2E23] bg-[#FDFBF7] flex flex-col">
            <Toaster position="top-center" />
            <Header />

            <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
                <button 
                    onClick={() => router.push('/account/orders')}
                    className="flex items-center gap-1.5 text-sm text-[#6B4F3E] hover:text-[#D96C39] font-bold mb-4 transition-colors w-max"
                >
                    <ChevronLeft size={18} /> Quay lại danh sách
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-[#3F2E23] flex items-center gap-2">
                            Đơn hàng {order.orderNumber}
                        </h1>
                        <p className="text-xs text-[#6B4F3E] font-medium mt-1 flex items-center gap-1.5">
                            <Calendar size={14} /> {formatDate(order.createdAt)}
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        {!isCancelled && statusConfig[order.status] && (
                            <div className={`px-3 py-1.5 rounded-full border ${statusConfig[order.status].bg} ${statusConfig[order.status].border} ${statusConfig[order.status].text} text-sm font-bold flex items-center gap-1.5 shadow-sm w-max`}>
                                <StatusIcon size={16} /> {statusConfig[order.status].label}
                            </div>
                        )}
                        {canConfirmDelivery && (
                            <Button 
                                onClick={confirmDelivery}
                                disabled={isConfirming}
                                className="text-white font-bold h-9 px-4 rounded-xl shadow-md transition-all hover:-translate-y-0.5" 
                                style={{ backgroundColor: '#10B981' }} 
                            >
                                {isConfirming ? (
                                    <Loader2 className="animate-spin h-4 w-4" />
                                ) : (
                                    <><CheckCircle2 size={16} className="mr-1.5" /> Đã nhận được hàng</>
                                )}
                            </Button>
                        )}
                        {canCancel && (
                            <Button
                                variant="outline"
                                onClick={() => setIsCancelModalOpen(true)}
                                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 font-bold h-9 rounded-xl transition-all"
                            >
                                <XCircle size={16} className="mr-1.5" /> Hủy đơn
                            </Button>
                        )}
                    </div>
                </div>

                {isCancelled && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm animate-in fade-in">
                        <div className="bg-white p-2 rounded-full shrink-0 border border-red-100 shadow-sm">
                            <XCircle className="text-red-600 w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-base font-bold text-red-700">Đơn hàng đã bị hủy</h2>
                            {hasCancelReason ? (
                                <p className="text-sm text-red-600 mt-0.5">Lý do: <span className="font-semibold">{cancelReasonText}</span></p>
                            ) : (
                                <p className="text-sm text-red-600 mt-0.5">Vui lòng liên hệ hỗ trợ nếu cần tư vấn thêm.</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 space-y-6">
                        <div className="bg-white rounded-2xl border border-[#E8D5B5] shadow-sm overflow-hidden flex flex-col">
                            <div className="px-5 py-3.5 border-b border-[#E8D5B5] bg-[#FFF8F0] flex items-center justify-between">
                                <h3 className="font-bold text-[#3F2E23] flex items-center gap-2 text-sm">
                                    <Package size={16} className="text-[#D96C39]" /> Sản phẩm ({order.items.length})
                                </h3>
                                {order.artisanId ? (
                                    <Link href={`/shop/artisan/${order.artisanId}`} className="text-[11px] font-bold bg-white px-2.5 py-1 rounded border border-[#E8D5B5] text-[#D96C39] flex items-center gap-1 hover:bg-orange-50 transition-colors shadow-sm">
                                        <Store size={12} /> {displayArtisanName}
                                    </Link>
                                ) : (
                                    <span className="text-[11px] font-bold bg-white px-2.5 py-1 rounded border border-[#E8D5B5] text-[#6B4F3E] flex items-center gap-1 shadow-sm">
                                        <Store size={12} /> {displayArtisanName}
                                    </span>
                                )}
                            </div>
                            <div className="p-5 space-y-4 flex-grow">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4 pb-4 border-b border-dashed border-[#E8D5B5] last:border-0 last:pb-0">
                                        <Link href={`/shop/id/${item.productId}`} className="relative w-16 h-16 rounded-lg overflow-hidden bg-[#F7F1E8] border border-[#E8D5B5] shrink-0 block hover:opacity-80 transition-opacity">
                                            <Image src={getProductImageUrl(item.image)} alt={item.productName} fill className="object-cover" />
                                        </Link>
                                        <div className="flex-1 min-w-0">
                                            <Link href={`/shop/id/${item.productId}`}>
                                                <h4 className="font-bold text-sm text-[#3F2E23] line-clamp-2 leading-snug hover:text-[#D96C39] transition-colors">{item.productName}</h4>
                                            </Link>
                                            <p className="text-xs text-[#6B4F3E] mt-1 font-medium">SL: {item.quantity}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-bold text-[#D96C39] text-base">{formatCurrency(item.price * item.quantity)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="bg-[#FDFBF7] p-5 border-t border-[#E8D5B5]">
                                <div className="space-y-2 text-sm text-[#6B4F3E] font-medium">
                                    <div className="flex justify-between items-center">
                                        <span>Tạm tính</span>
                                        <span className="text-[#3F2E23] font-semibold">{formatCurrency(order.subtotal)}</span>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-dashed border-[#E8D5B5] flex justify-between items-center">
                                    <span className="text-sm font-bold text-[#3F2E23]">Tổng cộng</span>
                                    <span className="text-xl font-black text-[#D96C39]">{formatCurrency(order.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl border border-[#E8D5B5] shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-[#E8D5B5] bg-[#FFF8F0]">
                                <h3 className="font-bold text-[#3F2E23] flex items-center gap-2 text-sm">
                                    <MapPin size={16} className="text-[#D96C39]" /> Địa chỉ nhận hàng
                                </h3>
                            </div>
                            <div className="p-5 space-y-3.5">
                                <div>
                                    <p className="text-[10px] font-bold text-[#6B4F3E] uppercase tracking-wider mb-0.5">Người nhận</p>
                                    <p className="font-bold text-[#3F2E23] text-sm">{order.shippingAddress.fullName} - {order.shippingAddress.phone}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-[#6B4F3E] uppercase tracking-wider mb-0.5">Địa chỉ giao hàng</p>
                                    <p className="font-medium text-[#3F2E23] leading-relaxed text-sm">{order.shippingAddress.address}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-[#E8D5B5] shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-[#E8D5B5] bg-[#FFF8F0]">
                                <h3 className="font-bold text-[#3F2E23] flex items-center gap-2 text-sm">
                                    <CreditCard size={16} className="text-[#D96C39]" /> Phương thức thanh toán
                                </h3>
                            </div>
                            <div className="p-5">
                                <p className="font-bold text-[#3F2E23] text-sm">{paymentLabels[order.paymentMethod] || order.paymentMethod}</p>
                                {order.paymentMethod === 'bank_transfer' && !isCancelled && (
                                    <div className="mt-3 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 font-medium">
                                        💡 Vui lòng chuyển <strong>{formatCurrency(order.total)}</strong> với nội dung <strong>{order.orderNumber}</strong>.
                                    </div>
                                )}
                            </div>
                        </div>

                        {normalNoteText && !isCancelled && (
                            <div className="bg-white rounded-2xl border border-[#E8D5B5] shadow-sm overflow-hidden">
                                <div className="px-5 py-3.5 border-b border-[#E8D5B5] bg-[#FFF8F0]">
                                    <h3 className="font-bold text-[#3F2E23] flex items-center gap-2 text-sm">
                                        <FileText size={16} className="text-[#D96C39]" /> Ghi chú đơn hàng
                                    </h3>
                                </div>
                                <div className="p-5">
                                    <p className="font-medium text-[#D96C39] italic text-sm">&quot;{normalNoteText}&quot;</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* --- MODAL HỦY ĐƠN HÀNG XỊN SÒ --- */}
            {isCancelModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-[#E8D5B5] overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-red-50 p-5 flex items-center justify-between border-b border-red-100 shrink-0">
                            <h3 className="font-bold flex items-center gap-2 text-red-700 text-lg">
                                <AlertTriangle size={22} className="text-red-600" /> Lý do hủy đơn #{orderId}
                            </h3>
                            <button onClick={closeCancelModal} disabled={isCancelling} className="text-gray-400 hover:text-red-600 transition bg-white rounded-full p-1.5 shadow-sm border border-gray-200">
                                <X size={18} />
                            </button>
                        </div>

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