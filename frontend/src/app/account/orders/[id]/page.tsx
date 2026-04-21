'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Header, Footer } from '@/components/common';
import { 
    Package, MapPin, CreditCard, Calendar, ChevronLeft, 
    CheckCircle2, XCircle, Clock, Truck, FileText, Store, AlertCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import useAxiosAuth from '@/hooks/useAxiosAuth';
import { RawOrderDetail } from '@/types/apiTypes';
import type { StoredOrder } from '@/lib/ordersStorage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
const FREE_SHIP_THRESHOLD = 200000;
const SHIPPING_FEE = 20000;

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
    pending_pickup: { label: 'Đang chờ lấy hàng', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: Clock },
    packaging: { label: 'Đang đóng gói hàng', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Package },
    shipping: { label: 'Đang giao hàng', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: Truck },
    delivered: { label: 'Đã nhận hàng', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2 },
    completed: { label: 'Hoàn thành', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle2 },
    cancelled: { label: 'Đã hủy', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle },
    refunded: { label: 'Đã hoàn tiền', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: XCircle },
};

const paymentLabels: Record<string, string> = {
    cod: 'Thanh toán khi nhận hàng (COD)',
    bank_transfer: 'Chuyển khoản ngân hàng',
    credit_card: 'Thẻ tín dụng / Ghi nợ',
};

type OrderWithArtisan = StoredOrder & { 
    artisanId?: number; 
    artisanName?: string;
};

export default function CustomerOrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const axiosAuth = useAxiosAuth();
    
    const orderId = Number(params.id);
    const [order, setOrder] = useState<OrderWithArtisan | null>(null);
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
                const response = await axiosAuth.get<RawOrderDetail & { artisanId?: number, artisanName?: string }>(`/orders/${orderId}`);
                const orderData = response.data;

                const mapBackendStatus = (s: string) => {
                    switch (s) {
                        case 'PENDING_PICKUP': return 'pending_pickup';
                        case 'PACKAGING': return 'packaging';
                        case 'SHIPPING': return 'shipping';
                        case 'DELIVERED': return 'delivered';
                        case 'COMPLETED': return 'completed';
                        case 'CANCELLED': return 'cancelled';
                        case 'REFUNDED': return 'refunded';
                        default: return 'pending_pickup';
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

                const subtotal = Number(orderData.totalPrice || 0);
                const shippingFee = subtotal >= FREE_SHIP_THRESHOLD ? 0 : SHIPPING_FEE;

                const mappedOrder: OrderWithArtisan = {
                    id: orderData.id,
                    orderNumber: `ART-${orderData.id}`,
                    customerName: orderData.customerName,
                    phone: orderData.customerPhone,
                    status: mapBackendStatus(orderData.status),
                    createdAt: orderData.orderDate,
                    subtotal: subtotal,
                    shippingFee: shippingFee,
                    total: subtotal + shippingFee,
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

    const StatusIcon = statusConfig[order.status].icon;
    const isCancelled = order.status === 'cancelled';
    
    const rawNote = order.shippingAddress.note || "";
    const hasCancelReason = rawNote.includes("Lý do hủy đơn:");
    const cancelReasonText = hasCancelReason ? rawNote.replace("Lý do hủy đơn:", "").trim() : "";
    const normalNoteText = hasCancelReason ? "" : rawNote;

    const displayArtisanName = order.artisanName || 'Gian Hàng Chế Tác';

    return (
        <div className="min-h-screen font-sans text-[#3F2E23] bg-[#FDFBF7] flex flex-col">
            <Header />

            <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
                <button 
                    onClick={() => router.push('/account/orders')}
                    className="flex items-center gap-1.5 text-sm text-[#6B4F3E] hover:text-[#D96C39] font-bold mb-4 transition-colors w-max"
                >
                    <ChevronLeft size={18} /> Quay lại danh sách
                </button>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-[#3F2E23] flex items-center gap-2">
                            Đơn hàng {order.orderNumber}
                        </h1>
                        <p className="text-xs text-[#6B4F3E] font-medium mt-1 flex items-center gap-1.5">
                            <Calendar size={14} /> {formatDate(order.createdAt)}
                        </p>
                    </div>
                    {!isCancelled && (
                        <div className={`px-3 py-1.5 rounded-full border ${statusConfig[order.status].bg} ${statusConfig[order.status].border} ${statusConfig[order.status].text} text-sm font-bold flex items-center gap-1.5 shadow-sm w-max`}>
                            <StatusIcon size={16} /> {statusConfig[order.status].label}
                        </div>
                    )}
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
                                    <div className="flex justify-between items-center">
                                        <span>Phí vận chuyển</span>
                                        <span>{order.shippingFee === 0 ? <span className="text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded text-[11px]">Miễn phí</span> : formatCurrency(order.shippingFee)}</span>
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
                                    <p className="font-medium text-[#D96C39] italic text-sm">"{normalNoteText}"</p>
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