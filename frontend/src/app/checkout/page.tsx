'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Store, MapPin, Phone, Mail, FileText, CheckCircle2, CreditCard, Banknote, ChevronRight, Loader2 } from 'lucide-react';
import type { ShippingAddress, PaymentMethod } from '@/types';
import useAxiosAuth from "@/hooks/useAxiosAuth";
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';

function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const axiosAuth = useAxiosAuth();
    const { items, clearCart } = useCart();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // --- LỌC ITEM DỰA TRÊN URL PARAMS ---
    const idsParam = searchParams.get('ids');
    const selectedIds = idsParam ? idsParam.split(',').map(Number) : [];
    
    // Chỉ lấy những items có ID nằm trong URL Params
    const checkoutItems = items.filter(item => selectedIds.includes(item.id));

    const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
        fullName: '',
        phone: '',
        email: '',
        address: '',
        note: '',
    });

    const [showSuccessNotification, setShowSuccessNotification] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');

    // Tính tổng chỉ cho các món được thanh toán
    const subtotal = checkoutItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
    const shippingFee = 0;
    const total = subtotal + shippingFee;

    useEffect(() => {
        // Nếu không có món nào để thanh toán và không phải đang báo thành công
        if (checkoutItems.length === 0 && !showSuccessNotification) {
            router.push('/cart');
        }
    }, [checkoutItems.length, showSuccessNotification, router]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!shippingAddress.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ và tên';
        if (!shippingAddress.phone.trim()) newErrors.phone = 'Vui lòng nhập số điện thoại';
        else if (!/^0\d{9}$/.test(shippingAddress.phone.replace(/\s/g, ''))) newErrors.phone = 'Số điện thoại không hợp lệ';
        if (!shippingAddress.email.trim()) newErrors.email = 'Vui lòng nhập email';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingAddress.email)) newErrors.email = 'Email không hợp lệ';
        if (!shippingAddress.address.trim()) newErrors.address = 'Vui lòng nhập địa chỉ';
        else if (shippingAddress.address.trim().length < 10) newErrors.address = 'Địa chỉ phải chi tiết hơn (tối thiểu 10 ký tự)';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Vui lòng kiểm tra lại thông tin giao hàng!");
            return;
        }

        const currentArtisanId = checkoutItems[0]?.artisanId; 
        if (!currentArtisanId) {
            toast.error("Lỗi hệ thống: Không xác định được Gian hàng của sản phẩm này.");
            return;
        }

        setIsSubmitting(true);
        const loadingToast = toast.loading("Đang xử lý đơn hàng...");

        try {
            const backendPaymentMethod = paymentMethod === 'cod' ? 'COD' : 'ONLINE';
            const phoneNumber = shippingAddress.phone.replace(/\s/g, '');

            const orderItems = checkoutItems.map((item) => ({
                productId: item.id,
                quantity: item.quantity,
            }));

            const orderData = {
                artisanId: currentArtisanId, 
                chatId: checkoutItems[0]?.chatId || null,
                phoneNumber: phoneNumber,
                address: shippingAddress.address.trim(),
                note: shippingAddress.note?.trim() || "",
                paymentMethod: backendPaymentMethod,
                items: orderItems,
            };

            const response = await axiosAuth.post('/orders/create/', orderData);
            const orderId = response.data.id;
            const orderNumber = `ART-${orderId}`;

            clearCart(); // Clear luôn giỏ nếu muốn, hoặc chỉ xóa những món vừa mua
            toast.dismiss(loadingToast);
            setShowSuccessNotification(true);

            setTimeout(() => {
                router.push(`/checkout/success?orderId=${orderId}&orderNumber=${orderNumber}`);
            }, 1500);

        } catch (error: any) {
            toast.dismiss(loadingToast);
            console.error('Order submission error:', error);
            if (error.response && error.response.status === 400 && error.response.data) {
                toast.error("Thông tin không hợp lệ. Vui lòng kiểm tra lại.");
            } else {
                toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đặt hàng.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (field: keyof ShippingAddress, value: string) => {
        setShippingAddress((prev) => ({...prev, [field]: value}));
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = {...prev};
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    if (checkoutItems.length === 0) return null;

    const currentArtisanId = checkoutItems[0]?.artisanId;

    return (
        <div className="min-h-screen font-sans text-[#3F2E23] bg-[#FDFBF7]">
            <Header/>
            <Toaster position="top-center" />

            {showSuccessNotification && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white px-8 py-10 rounded-2xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300 min-w-[320px] border border-[#E8D5B5]">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-2">
                            <CheckCircle2 size={40} />
                        </div>
                        <p className="text-2xl font-bold text-[#3F2E23]">Đặt hàng thành công!</p>
                        <p className="text-[#6B4F3E] text-center">Hệ thống đang chuyển hướng...</p>
                        <div className="mt-4 w-8 h-8 border-4 border-[#D96C39] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </div>
            )}

            <main className="container mx-auto px-6 py-12 max-w-6xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-[#3F2E23] mb-2 flex items-center gap-3">
                        Thanh toán đơn hàng
                    </h1>
                    <div className="h-1 w-16 bg-[#D96C39] rounded-full"></div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* LEFT COLUMN: Form */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Shipping Information */}
                            <div className="bg-white rounded-2xl shadow-sm border border-[#E8D5B5] p-6 md:p-8">
                                <h2 className="text-xl font-bold text-[#3F2E23] mb-6 flex items-center gap-2 border-b border-[#E8D5B5] pb-4">
                                    <MapPin className="text-[#D96C39]" size={24} /> Thông tin giao hàng
                                </h2>
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-[#3F2E23] mb-2">Họ và tên <span className="text-red-500">*</span></label>
                                        <Input type="text" value={shippingAddress.fullName} onChange={(e) => handleInputChange('fullName', e.target.value)} className={`h-12 bg-gray-50 focus-visible:ring-[#D96C39] ${errors.fullName ? 'border-red-500' : 'border-[#E8D5B5]'}`} placeholder="Nhập họ và tên người nhận" />
                                        {errors.fullName && <p className="text-red-500 text-sm mt-1 font-medium">{errors.fullName}</p>}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-bold text-[#3F2E23] mb-2 flex items-center gap-1"><Phone size={14}/> Số điện thoại <span className="text-red-500">*</span></label>
                                            <Input type="tel" value={shippingAddress.phone} onChange={(e) => handleInputChange('phone', e.target.value)} className={`h-12 bg-gray-50 focus-visible:ring-[#D96C39] ${errors.phone ? 'border-red-500' : 'border-[#E8D5B5]'}`} placeholder="0123456789" />
                                            {errors.phone && <p className="text-red-500 text-sm mt-1 font-medium">{errors.phone}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-[#3F2E23] mb-2 flex items-center gap-1"><Mail size={14}/> Email <span className="text-red-500">*</span></label>
                                            <Input type="email" value={shippingAddress.email} onChange={(e) => handleInputChange('email', e.target.value)} className={`h-12 bg-gray-50 focus-visible:ring-[#D96C39] ${errors.email ? 'border-red-500' : 'border-[#E8D5B5]'}`} placeholder="email@example.com" />
                                            {errors.email && <p className="text-red-500 text-sm mt-1 font-medium">{errors.email}</p>}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#3F2E23] mb-2">Địa chỉ giao hàng <span className="text-red-500">*</span></label>
                                        <textarea value={shippingAddress.address} onChange={(e) => handleInputChange('address', e.target.value)} rows={3} className={`flex w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D96C39] resize-none ${errors.address ? 'border-red-500' : 'border-[#E8D5B5]'}`} placeholder="Nhập địa chỉ chi tiết" />
                                        {errors.address && <p className="text-red-500 text-sm mt-1 font-medium">{errors.address}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#3F2E23] mb-2 flex items-center gap-1"><FileText size={14}/> Ghi chú (Tùy chọn)</label>
                                        <textarea value={shippingAddress.note} onChange={(e) => handleInputChange('note', e.target.value)} rows={2} className="flex w-full rounded-xl border border-[#E8D5B5] bg-gray-50 px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D96C39] resize-none" placeholder="Ghi chú thêm..." />
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="bg-white rounded-2xl shadow-sm border border-[#E8D5B5] p-6 md:p-8">
                                <h2 className="text-xl font-bold text-[#3F2E23] mb-6 flex items-center gap-2 border-b border-[#E8D5B5] pb-4">
                                    <CreditCard className="text-[#D96C39]" size={24} /> Phương thức thanh toán
                                </h2>
                                <div className="space-y-4">
                                    <label className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-[#D96C39] bg-[#FFF8F0]' : 'border-[#E8D5B5] hover:bg-gray-50'}`}>
                                        <div className="flex items-center h-6">
                                            <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className="w-5 h-5 text-[#D96C39] focus:ring-[#D96C39] border-gray-300 mt-0.5" />
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <div className="font-bold text-[#3F2E23] flex items-center gap-2"><Banknote size={18} className="text-[#D96C39]" /> Thanh toán khi nhận hàng (COD)</div>
                                            <div className="text-sm text-[#6B4F3E] mt-1">Khách hàng thanh toán bằng tiền mặt khi bưu tá giao hàng tới.</div>
                                        </div>
                                    </label>
                                    <label className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'bank_transfer' ? 'border-[#D96C39] bg-[#FFF8F0]' : 'border-[#E8D5B5] hover:bg-gray-50'}`}>
                                        <div className="flex items-center h-6">
                                            <input type="radio" name="paymentMethod" value="bank_transfer" checked={paymentMethod === 'bank_transfer'} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className="w-5 h-5 text-[#D96C39] focus:ring-[#D96C39] border-gray-300 mt-0.5" />
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <div className="font-bold text-[#3F2E23] flex items-center gap-2"><CreditCard size={18} className="text-[#D96C39]" /> Chuyển khoản ngân hàng</div>
                                            <div className="text-sm text-[#6B4F3E] mt-1">Thông tin chuyển khoản sẽ được hiển thị ở màn hình tiếp theo.</div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-md border border-[#E8D5B5] p-6 sticky top-24">
                                <h2 className="text-lg font-bold text-[#3F2E23] mb-4 flex items-center justify-between border-b border-[#E8D5B5] pb-4">
                                    <span>Đơn hàng của bạn</span>
                                    <span className="text-sm font-medium bg-[#FFF8F0] text-[#D96C39] px-2 py-1 rounded-md border border-[#E8D5B5]">{checkoutItems.length} món</span>
                                </h2>

                                {currentArtisanId ? (
                                    <Link href={`/shop/artisan/${currentArtisanId}`} className="mb-4 bg-[#F7F1E8] border border-[#E8D5B5] p-3 rounded-lg flex items-center justify-between group hover:bg-[#FFF8F0] hover:border-[#D96C39] transition-all">
                                        <div className="flex items-center gap-2">
                                            <Store size={16} className="text-[#D96C39]" />
                                            <span className="text-xs font-bold text-[#6B4F3E] uppercase tracking-wider group-hover:text-[#D96C39] transition-colors">Xem gian hàng chế tác</span>
                                        </div>
                                        <ChevronRight size={16} className="text-[#6B4F3E] group-hover:text-[#D96C39] transition-colors" />
                                    </Link>
                                ) : (
                                    <div className="mb-4 bg-[#F7F1E8] border border-[#E8D5B5] p-3 rounded-lg flex items-center gap-2">
                                        <Store size={16} className="text-[#D96C39]" />
                                        <span className="text-xs font-bold text-[#6B4F3E] uppercase tracking-wider">Từ Gian Hàng</span>
                                    </div>
                                )}

                                <div className="space-y-4 mb-6 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                                    {checkoutItems.map((item) => {
                                        let imageUrl = item.image || '/tramhon-logo.png';
                                        if (imageUrl.startsWith('//')) imageUrl = `https:${imageUrl}`;
                                        else if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) imageUrl = `/${imageUrl}`;

                                        return (
                                            <div key={item.id} className="flex gap-3 bg-[#FFF8F0] p-3 rounded-xl border border-[#E8D5B5]/50">
                                                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white border border-[#E8D5B5] flex-shrink-0">
                                                    <Image src={imageUrl} alt={item.productName} fill className="object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    <h3 className="text-sm font-bold text-[#3F2E23] line-clamp-2 leading-snug">{item.productName}</h3>
                                                    <div className="flex items-center justify-between mt-1.5">
                                                        <p className="text-xs font-semibold text-[#6B4F3E] bg-[#E8D5B5]/30 px-1.5 py-0.5 rounded">SL: {item.quantity}</p>
                                                        <p className="text-lg font-black text-[#D96C39]">
                                                            ₫{(Number(item.price) * item.quantity).toLocaleString('vi-VN')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="border-t border-[#E8D5B5] pt-4 space-y-3">
                                    <div className="flex justify-between text-sm font-medium text-[#6B4F3E]">
                                        <span>Tạm tính:</span>
                                        <span>₫{subtotal.toLocaleString('vi-VN')}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-medium text-[#6B4F3E]">
                                        <span>Phí vận chuyển:</span>
                                        <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded font-bold">Miễn phí</span>
                                    </div>
                                    <div className="border-t border-[#E8D5B5] pt-3 mt-3 flex justify-between items-center">
                                        <span className="text-base font-bold text-[#3F2E23]">Tổng cộng:</span>
                                        <span className="text-2xl font-black text-[#D96C39]">₫{total.toLocaleString('vi-VN')}</span>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full mt-6 bg-[#3F2E23] hover:bg-black text-white font-bold h-14 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 text-base"
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={20}/> Đang xử lý...</span>
                                    ) : 'XÁC NHẬN ĐẶT HÀNG'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </main>

            <Footer/>
        </div>
    );
}

// Bọc bằng Suspense để dùng được useSearchParams
export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#D96C39]" size={40} /></div>}>
            <CheckoutContent />
        </Suspense>
    );
}