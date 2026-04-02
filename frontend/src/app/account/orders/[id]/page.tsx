'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Header, Footer } from '@/components/common';
import { 
    Package, MapPin, CreditCard, Calendar, ChevronLeft, 
    CheckCircle2, XCircle, Clock, Truck, FileText 
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import useAxiosAuth from '@/hooks/useAxiosAuth';
import { RawOrderDetail } from '@/types/apiTypes';
import type { StoredOrder } from '@/lib/ordersStorage';

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

const statusConfig: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
    pending: { label: 'Đang chờ xử lý', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: Clock },
    processing: { label: 'Đang chuẩn bị hàng', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Package },
    shipped: { label: 'Đang giao hàng', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: Truck },
    delivered: { label: 'Giao thành công', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle2 },
    cancelled: { label: 'Đã hủy', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle },
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
    
    const orderId = Number(params.id);
    const [order, setOrder] = useState<StoredOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

                const mapBackendStatus = (s: string) => {
                    switch (s) {
                        case 'PENDING': return 'pending';
                        case 'IN_PROGRESS': return 'processing';
                        case 'SHIPPED': return 'shipped';
                        case 'COMPLETED': return 'delivered';
                        case 'CANCELLED': return 'cancelled';
                        default: return 'pending';
                    }
                };

                const mapBackendPayment = (m: string) => {
                    switch (m) {
                        case 'COD': return 'cod';
                        case 'ONLINE':
                        case 'BANK_TRANSFER': return 'bank_transfer';
                        default: return 'cod';
                    }
                };

                const mappedOrder: StoredOrder = {
                    id: orderData.id,
                    orderNumber: `ART-${orderData.id}`,
                    customerName: orderData.customerName,
                    phone: orderData.customerPhone,
                    status: mapBackendStatus(orderData.status),
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
                    items: orderData.items.map((item: any) => ({
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

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
                <Header />
                <main className="flex-grow flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E8D5B5] border-t-[#D96C39]"></div>
                </main>
                <Footer />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
                <Header />
                <main className="flex-grow container mx-auto px-4 py-16 flex items-center justify-center">
                    <div className="text-center bg-white p-12 rounded-3xl border border-[#E8D5B5] shadow-sm max-w-lg w-full">
                        <div className="text-6xl mb-6">🔍</div>
                        <h1 className="text-2xl font-black text-[#3F2E23] mb-4">Không tìm thấy đơn hàng</h1>
                        <p className="text-[#6B4F3E] mb-8">{error || "Đơn hàng này không tồn tại hoặc bạn không có quyền xem."}</p>
                        <Link href="/orders" className="inline-flex items-center justify-center bg-[#3F2E23] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-black transition-colors w-full">
                            Về danh sách đơn hàng
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const StatusIcon = statusConfig[order.status].icon;
    const isCancelled = order.status === 'cancelled';
    
    // Tách lý do hủy đơn (nếu có) ra khỏi ghi chú
    const rawNote = order.shippingAddress.note || "";
    const hasCancelReason = rawNote.includes("Lý do hủy đơn:");
    const cancelReasonText = hasCancelReason ? rawNote.replace("Lý do hủy đơn:", "").trim() : "";
    const normalNoteText = hasCancelReason ? "" : rawNote;

    return (
        <div className="min-h-screen font-sans text-[#3F2E23] bg-[#FDFBF7] flex flex-col">
            <Header />

            {/* Mở rộng max-w lên 7xl để lấp đầy không gian */}
            <main className="flex-grow container mx-auto px-4 lg:px-8 py-10 max-w-7xl">
                {/* Back button */}
                <button 
                    onClick={() => router.push('/orders')}
                    className="flex items-center gap-2 text-[#6B4F3E] hover:text-[#D96C39] font-bold mb-6 transition-colors w-max"
                >
                    <ChevronLeft size={20} /> Quay lại danh sách đơn hàng
                </button>

                {/* --- HEADER ĐƠN HÀNG --- */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-[#3F2E23] flex items-center gap-3">
                            Đơn hàng {order.orderNumber}
                        </h1>
                        <p className="text-[#6B4F3E] font-medium mt-2 flex items-center gap-2">
                            <Calendar size={16} /> Đặt lúc: {formatDate(order.createdAt)}
                        </p>
                    </div>
                    {!isCancelled && (
                        <div className={`px-5 py-2.5 rounded-full border ${statusConfig[order.status].bg} ${statusConfig[order.status].border} ${statusConfig[order.status].text} font-bold flex items-center gap-2 shadow-sm w-max`}>
                            <StatusIcon size={20} /> {statusConfig[order.status].label}
                        </div>
                    )}
                </div>

                {isCancelled && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6 sm:p-8 mb-8 text-center flex flex-col items-center animate-in zoom-in-95 duration-300 w-full">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 shrink-0">
                            <XCircle className="text-red-600 w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-black text-red-700 mb-2">Đơn hàng đã bị hủy</h2>
                        <p className="text-red-600 font-medium">Vui lòng liên hệ hỗ trợ nếu đây là sự nhầm lẫn hoặc bạn cần tư vấn thêm.</p>
                    </div>
                )}

                {/* --- LƯỚI THÔNG TIN --- */}
                {/* Chia 3 cột (grid-cols-3) ở màn to, nếu bị hủy thì vẫn chia 3 cột nhưng đảo lại nội dung cho lấp đầy */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* CỘT TRÁI: Nếu hủy thì chiếm 2 cột (Sản phẩm), nếu ko hủy thì chiếm 2 cột (Sản phẩm) */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Danh sách sản phẩm */}
                        <div className="bg-white rounded-3xl border border-[#E8D5B5] shadow-sm overflow-hidden h-full flex flex-col">
                            <div className="px-6 py-5 border-b border-[#E8D5B5] bg-[#FFF8F0] flex items-center justify-between shrink-0">
                                <h3 className="font-bold text-[#3F2E23] flex items-center gap-2">
                                    <Package size={20} className="text-[#D96C39]" /> Sản phẩm ({order.items.length})
                                </h3>
                                <span className="text-xs font-bold bg-white px-2 py-1 rounded border border-[#E8D5B5] text-[#6B4F3E]">Từ Gian Hàng</span>
                            </div>
                            <div className="p-6 space-y-4 flex-grow">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4 border-b border-dashed border-[#E8D5B5] last:border-0 last:pb-0">
                                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[#F7F1E8] border border-[#E8D5B5] shrink-0">
                                            <Image src={getProductImageUrl(item.image)} alt={item.productName} fill className="object-cover" />
                                        </div>
                                        <div className="flex-1 w-full">
                                            <h4 className="font-bold text-[#3F2E23] line-clamp-2 leading-snug mb-1.5 text-lg">{item.productName}</h4>
                                            <span className="text-xs font-bold text-[#6B4F3E] bg-[#FFF8F0] px-2 py-1 rounded-md border border-[#E8D5B5]">SL: {item.quantity}</span>
                                        </div>
                                        <div className="text-right w-full sm:w-auto mt-2 sm:mt-0">
                                            <p className="font-black text-[#D96C39] text-xl">{formatCurrency(item.price * item.quantity)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Đưa tổng tiền vào dính liền khối sản phẩm cho đỡ rời rạc */}
                            <div className="bg-[#FFF8F0] p-6 border-t border-[#E8D5B5] shrink-0">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-[#6B4F3E] font-medium">
                                        <span>Tạm tính ({order.items.length} sản phẩm)</span>
                                        <span className="text-[#3F2E23]">{formatCurrency(order.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[#6B4F3E] font-medium">
                                        <span>Phí vận chuyển</span>
                                        <span>{order.shippingFee === 0 ? <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded font-bold">Miễn phí</span> : formatCurrency(order.shippingFee)}</span>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-dashed border-[#D96C39]/30 flex justify-between items-center">
                                    <span className="text-lg font-bold text-[#3F2E23]">Tổng cộng</span>
                                    <span className="text-3xl font-black text-[#D96C39]">{formatCurrency(order.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CỘT PHẢI (Nhỏ): Thông tin Khách, Thanh toán, Lý do hủy/Ghi chú */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        {/* LÝ DO HỦY ĐƠN ĐƯỢC CHUYỂN SANG CỘT PHẢI NẾU BỊ HỦY (Để lấp trống) */}
                        {isCancelled && hasCancelReason && (
                            <div className="bg-red-50 rounded-3xl border border-red-200 shadow-sm overflow-hidden animate-in fade-in">
                                <div className="px-6 py-4 border-b border-red-200 bg-red-100/50">
                                    <h3 className="font-bold text-red-800 flex items-center gap-2">
                                        <AlertCircle size={18} className="text-red-600" /> Lý do hủy đơn
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <p className="font-medium text-red-700 leading-relaxed italic">"{cancelReasonText}"</p>
                                </div>
                            </div>
                        )}

                        {/* Thông tin nhận hàng */}
                        <div className="bg-white rounded-3xl border border-[#E8D5B5] shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-[#E8D5B5] bg-[#FFF8F0]">
                                <h3 className="font-bold text-[#3F2E23] flex items-center gap-2">
                                    <MapPin size={18} className="text-[#D96C39]" /> Địa chỉ nhận hàng
                                </h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold text-[#6B4F3E] uppercase tracking-wider mb-1">Người nhận</p>
                                    <p className="font-bold text-[#3F2E23] text-base">{order.shippingAddress.fullName}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-[#6B4F3E] uppercase tracking-wider mb-1">Số điện thoại</p>
                                    <p className="font-bold text-[#3F2E23]">{order.shippingAddress.phone}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-[#6B4F3E] uppercase tracking-wider mb-1">Nơi giao</p>
                                    <p className="font-medium text-[#3F2E23] leading-relaxed">{order.shippingAddress.address}</p>
                                </div>
                            </div>
                        </div>

                        {/* Phương thức thanh toán */}
                        <div className="bg-white rounded-3xl border border-[#E8D5B5] shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-[#E8D5B5] bg-[#FFF8F0]">
                                <h3 className="font-bold text-[#3F2E23] flex items-center gap-2">
                                    <CreditCard size={18} className="text-[#D96C39]" /> Thông tin thanh toán
                                </h3>
                            </div>
                            <div className="p-6">
                                <p className="text-[10px] font-bold text-[#6B4F3E] uppercase tracking-wider mb-1">Phương thức</p>
                                <p className="font-bold text-[#3F2E23]">{paymentLabels[order.paymentMethod] || order.paymentMethod}</p>
                                
                                {order.paymentMethod === 'bank_transfer' && !isCancelled && (
                                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 font-medium leading-relaxed">
                                        💡 Nếu chưa chuyển khoản, vui lòng chuyển đúng <strong>{formatCurrency(order.total)}</strong> với nội dung <strong>{order.orderNumber}</strong> để đơn hàng được duyệt.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Ghi chú bình thường (chỉ hiện nếu note không phải là lý do hủy) */}
                        {normalNoteText && !isCancelled && (
                            <div className="bg-white rounded-3xl border border-[#E8D5B5] shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-[#E8D5B5] bg-[#FFF8F0]">
                                    <h3 className="font-bold text-[#3F2E23] flex items-center gap-2">
                                        <FileText size={18} className="text-[#D96C39]" /> Ghi chú đơn hàng
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <p className="font-medium text-[#D96C39] italic leading-relaxed">"{normalNoteText}"</p>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}