'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import type { StoredOrder } from '@/lib/ordersStorage';
import { RawOrderDetail } from '@/types/apiTypes';
import useAxiosAuth from "@/hooks/useAxiosAuth";
import { CheckCircle2, Copy, FileText, ShoppingBag, Home } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

function LoadingState() {
    return (
        <div className="min-h-screen font-sans text-[#3F2E23] bg-[#FDFBF7] flex flex-col">
            <Header />
            <main className="container mx-auto px-6 py-24 flex-grow flex items-center justify-center">
                <div className="max-w-2xl mx-auto text-center flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E8D5B5] border-t-[#D96C39] mx-auto mb-6"></div>
                    <p className="text-xl font-bold text-[#3F2E23]">Đang gói ghém thông tin đơn hàng...</p>
                    <p className="text-[#6B4F3E] mt-2">Vui lòng đợi một chút nhé</p>
                </div>
            </main>
            <Footer />
        </div>
    );
}

function CheckoutSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const axiosAuth = useAxiosAuth();

    const orderId = searchParams.get('orderId');
    const [order, setOrder] = useState<StoredOrder | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orderId) {
            router.push('/cart');
            return;
        }

        const fetchOrder = async () => {
            try {
                const response = await axiosAuth.get<RawOrderDetail>(`/orders/${orderId}`);
                const orderData = response.data;

                const mapBackendStatusToFrontend = (backendStatus: string): StoredOrder['status'] => {
                    switch (backendStatus) {
                        case 'PENDING': return 'pending';
                        case 'IN_PROGRESS': return 'processing';
                        case 'SHIPPED': return 'shipped';
                        case 'COMPLETED': return 'delivered';
                        case 'CANCELLED': return 'cancelled';
                        default: return 'pending';
                    }
                };

                const mapBackendPaymentMethodToFrontend = (backendMethod: string): StoredOrder['paymentMethod'] => {
                    switch (backendMethod) {
                        case 'COD': return 'cod';
                        case 'ONLINE':
                        case 'BANK_TRANSFER': return 'bank_transfer';
                        case 'CREDIT_CARD': return 'credit_card';
                        default: return 'bank_transfer';
                    }
                };

                const mappedOrder: StoredOrder = {
                    id: orderData.id,
                    orderNumber: `ART-${orderData.id}`,
                    customerName: orderData.customerName,
                    phone: orderData.customerPhone,
                    status: mapBackendStatusToFrontend(orderData.status),
                    createdAt: orderData.orderDate,
                    subtotal: Number(orderData.totalPrice || 0),
                    shippingFee: Number(orderData.shippingFee || 0),
                    total: Number(orderData.finalTotal || orderData.totalPrice || 0),
                    paymentMethod: mapBackendPaymentMethodToFrontend(orderData.paymentMethod),
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
            } catch (error: any) {
                console.error('Error fetching order:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId, router, axiosAuth]);

    if (loading) {
        return <LoadingState />;
    }

    if (!order) {
        return (
            <div className="min-h-screen font-sans text-[#3F2E23] bg-[#FDFBF7] flex flex-col">
                <Header />
                <main className="container mx-auto px-6 py-24 flex-grow">
                    <div className="max-w-2xl mx-auto text-center bg-white p-12 rounded-3xl border border-[#E8D5B5] shadow-sm">
                        <div className="text-6xl mb-6">🔍</div>
                        <h1 className="text-3xl font-extrabold text-[#3F2E23] mb-4">Không tìm thấy đơn hàng</h1>
                        <p className="text-[#6B4F3E] mb-8 text-lg">Đơn hàng không tồn tại hoặc bạn không có quyền xem đơn hàng này.</p>
                        <Link
                            href="/shop/products"
                            className="inline-flex items-center gap-2 bg-[#D96C39] text-white px-8 py-4 rounded-full font-bold shadow-md hover:bg-[#C25B2D] hover:-translate-y-1 transition-all"
                        >
                            <ShoppingBag size={20} /> Về cửa hàng
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const getPaymentMethodName = (method: string) => {
        switch (method) {
            case 'cod': return 'Thanh toán khi nhận hàng (COD)';
            case 'bank_transfer': return 'Chuyển khoản ngân hàng';
            case 'credit_card': return 'Thẻ tín dụng/Ghi nợ';
            default: return method;
        }
    };

    const getStatusName = (status: string) => {
        switch (status) {
            case 'pending': return 'Đang chờ xác nhận';
            case 'confirmed': return 'Đã xác nhận';
            case 'processing': return 'Đang chế tác / Chuẩn bị';
            case 'shipped': return 'Đang giao hàng';
            case 'delivered': return 'Đã nhận hàng';
            case 'cancelled': return 'Đã hủy';
            default: return status;
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Đã copy vào khay nhớ tạm!");
    };

    return (
        <div className="min-h-screen font-sans text-[#3F2E23] bg-[#FDFBF7]">
            <Header />
            <Toaster position="top-center" />
            <main className="container mx-auto px-4 py-12">
                <div className="max-w-3xl mx-auto">
                    {/* Success Header */}
                    <div className="text-center mb-10 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 text-green-500 rounded-full mb-6 border-4 border-white shadow-lg">
                            <CheckCircle2 size={50} />
                        </div>
                        <h1 className="text-4xl font-black text-[#3F2E23] mb-4">Tuyệt vời! Đặt hàng thành công</h1>
                        <p className="text-lg text-[#6B4F3E] mb-2 max-w-xl mx-auto">
                            Cảm ơn bạn đã tin tưởng những đôi tay tài hoa. Đơn hàng của bạn đang được các nghệ nhân chuẩn bị!
                        </p>
                        <p className="text-sm text-[#3F2E23] font-medium bg-[#FFF8F0] inline-block px-4 py-2 rounded-full border border-[#E8D5B5] mt-2">
                            Mã đơn hàng: <span className="font-extrabold text-[#D96C39] ml-1">{order.orderNumber}</span>
                        </p>
                    </div>

                    {/* Order Details Card */}
                    <div className="bg-white rounded-3xl shadow-sm border border-[#E8D5B5] p-6 md:p-10 mb-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#D96C39] to-orange-400"></div>
                        
                        <h2 className="text-2xl font-bold text-[#3F2E23] mb-6 flex items-center gap-2 border-b border-[#E8D5B5] pb-4">
                            <FileText className="text-[#D96C39]" /> Thông tin đơn hàng
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-[#6B4F3E] uppercase tracking-wider mb-1">Mã đơn hàng</p>
                                    <p className="font-extrabold text-[#3F2E23] text-lg">{order.orderNumber}</p>
                                </div>
                                {/* ĐÃ XÓA TRẠNG THÁI "ĐANG CHỜ..." VÀ THAY BẰNG LỜI NHẮN THÂN THIỆN */}
                                <div>
                                    <p className="text-xs font-bold text-[#6B4F3E] uppercase tracking-wider mb-1">Tiến độ</p>
                                    <p className="font-medium text-[#D96C39] bg-[#FFF8F0] inline-block px-3 py-1.5 rounded-md border border-[#E8D5B5] text-sm flex items-center gap-1.5">
                                        <CheckCircle2 size={16} /> Đã tiếp nhận đơn hàng thành công!
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-[#6B4F3E] uppercase tracking-wider mb-1">Ngày đặt hàng</p>
                                    <p className="font-bold text-[#3F2E23]">
                                        {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-[#6B4F3E] uppercase tracking-wider mb-1">Phương thức thanh toán</p>
                                    <p className="font-bold text-[#3F2E23]">{getPaymentMethodName(order.paymentMethod)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Instructions for Bank Transfer */}
                        {order.paymentMethod === 'bank_transfer' && (
                            <div className="bg-[#FFF8F0] rounded-2xl border-2 border-dashed border-[#D96C39] p-6 md:p-8 mb-8 text-center relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#D96C39] rounded-full opacity-10"></div>
                                <h3 className="font-black text-xl text-[#3F2E23] mb-4">Thông tin chuyển khoản</h3>
                                <p className="text-sm text-[#6B4F3E] mb-6">Vui lòng chuyển khoản đúng số tiền và nội dung để hệ thống tự động xác nhận đơn hàng của bạn.</p>
                                
                                <div className="bg-white p-6 rounded-xl shadow-sm inline-block text-left w-full max-w-md border border-[#E8D5B5]">
                                    <div className="flex justify-between items-center mb-3">
                                        <p className="text-sm text-[#6B4F3E]">Ngân hàng</p>
                                        <p className="font-bold text-[#3F2E23]">Vietcombank</p>
                                    </div>
                                    <div className="flex justify-between items-center mb-3">
                                        <p className="text-sm text-[#6B4F3E]">Chủ tài khoản</p>
                                        <p className="font-bold text-[#3F2E23]">TRAMHON HANDMADE</p>
                                    </div>
                                    <div className="flex justify-between items-center mb-3">
                                        <p className="text-sm text-[#6B4F3E]">Số tài khoản</p>
                                        <div className="flex items-center gap-2">
                                            <p className="font-extrabold text-xl text-[#D96C39] tracking-wider">1234567890</p>
                                            <button onClick={() => copyToClipboard('1234567890')} className="text-gray-400 hover:text-[#D96C39]"><Copy size={16} /></button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mb-3">
                                        <p className="text-sm text-[#6B4F3E]">Số tiền</p>
                                        <div className="flex items-center gap-2">
                                            <p className="font-extrabold text-xl text-[#D96C39]">₫{order.total.toLocaleString('vi-VN')}</p>
                                            <button onClick={() => copyToClipboard(order.total.toString())} className="text-gray-400 hover:text-[#D96C39]"><Copy size={16} /></button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t border-dashed border-[#E8D5B5]">
                                        <p className="text-sm text-[#6B4F3E]">Nội dung CK</p>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-[#3F2E23] bg-gray-100 px-2 py-1 rounded">{order.orderNumber}</p>
                                            <button onClick={() => copyToClipboard(order.orderNumber)} className="text-gray-400 hover:text-[#D96C39]"><Copy size={16} /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Shipping Address */}
                            <div>
                                <h3 className="text-sm font-bold text-[#6B4F3E] uppercase tracking-wider mb-3 pb-2 border-b border-[#E8D5B5]">Giao hàng đến</h3>
                                <div className="bg-[#FDFBF7] p-5 rounded-xl border border-[#E8D5B5] space-y-2">
                                    <div className="flex justify-between text-sm font-medium text-[#6B4F3E]">
                                        <span>Tạm tính:</span>
                                        <span>₫{order.subtotal.toLocaleString('vi-VN')}</span>
                                    </div>
                                    <div className="flex justify-between items-end pt-3 mt-3 border-t border-[#E8D5B5] border-dashed">
                                        <span className="font-bold text-[#3F2E23]">Tổng cộng:</span>
                                        <span className="text-2xl font-black text-[#D96C39]">₫{order.total.toLocaleString('vi-VN')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Order Summary & Items */}
                            <div>
                                <h3 className="text-sm font-bold text-[#6B4F3E] uppercase tracking-wider mb-3 pb-2 border-b border-[#E8D5B5]">Sản phẩm ({order.items.length})</h3>
                                <div className="space-y-3 mb-6 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                                    {order.items.map((item) => {
                                        let imageUrl = item.image || '/tramhon-logo.png';
                                        if (imageUrl.startsWith('//')) imageUrl = `https:${imageUrl}`;
                                        else if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) imageUrl = `/${imageUrl}`;

                                        return (
                                            <div key={item.productId} className="flex gap-3 bg-[#FFF8F0] p-2 rounded-xl border border-[#E8D5B5]/50">
                                                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white border border-[#E8D5B5] flex-shrink-0">
                                                    <Image src={imageUrl} alt={item.productName} fill className="object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    <h4 className="text-sm font-bold text-[#3F2E23] line-clamp-1">{item.productName}</h4>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <p className="text-xs font-semibold text-[#6B4F3E] bg-[#E8D5B5]/30 px-1.5 py-0.5 rounded">SL: {item.quantity}</p>
                                                        <p className="text-sm font-extrabold text-[#D96C39]">
                                                            ₫{(item.price * item.quantity).toLocaleString('vi-VN')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="bg-[#FDFBF7] p-5 rounded-xl border border-[#E8D5B5] space-y-2">
                                    <div className="flex justify-between text-sm font-medium text-[#6B4F3E]">
                                        <span>Tạm tính:</span>
                                        <span>₫{order.subtotal.toLocaleString('vi-VN')}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-medium text-[#6B4F3E]">
                                        <span>Phí vận chuyển:</span>
                                        <span>{order.shippingFee === 0 ? <span className="text-green-600">Miễn phí</span> : `₫${order.shippingFee.toLocaleString('vi-VN')}`}</span>
                                    </div>
                                    <div className="flex justify-between items-end pt-3 mt-3 border-t border-[#E8D5B5] border-dashed">
                                        <span className="font-bold text-[#3F2E23]">Tổng cộng:</span>
                                        <span className="text-2xl font-black text-[#D96C39]">₫{order.total.toLocaleString('vi-VN')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row justify-center gap-4 animate-in fade-in duration-700 delay-300">
                        <Link href="/shop/products" className="inline-flex justify-center items-center gap-2 bg-[#3F2E23] text-white px-8 py-4 rounded-full font-bold shadow-lg hover:bg-black hover:-translate-y-1 transition-all">
                            <ShoppingBag size={20} /> Tiếp tục khám phá
                        </Link>
                        <Link href="/" className="inline-flex justify-center items-center gap-2 border-2 border-[#3F2E23] text-[#3F2E23] px-8 py-4 rounded-full font-bold hover:bg-[#FDFBF7] transition-all">
                            <Home size={20} /> Về trang chủ
                        </Link>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={<LoadingState />}>
            <CheckoutSuccessContent />
        </Suspense>
    );
}