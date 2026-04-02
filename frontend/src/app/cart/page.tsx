'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { Button } from '@/components/ui/button';
import { Store, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { axiosClient } from '@/lib/axios';

export default function CartPage() {
    const router = useRouter();
    const { items, removeItem, updateQuantity, clearCart } = useCart();
    const [isClearing, setIsClearing] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    
    // State lưu map ID -> Tên Nghệ nhân
    const [artisanMap, setArtisanMap] = useState<Record<string, string>>({});

    // Lấy danh sách Nghệ nhân để map tên
    useEffect(() => {
        const fetchArtisans = async () => {
            try {
                const res = await axiosClient.get('/users/?role=ARTISAN');
                const map: Record<string, string> = {};
                res.data.forEach((u: any) => {
                    map[u.id.toString()] = u.name;
                });
                setArtisanMap(map);
            } catch (error) {
                console.error('Failed to fetch artisans:', error);
            }
        };
        fetchArtisans();
    }, []);

    const handleClearCart = () => {
        if (window.confirm('Bạn có chắc chắn muốn xóa tất cả sản phẩm trong giỏ hàng?')) {
            setIsClearing(true);
            clearCart();
            setSelectedIds([]);
            setTimeout(() => setIsClearing(false), 300);
        }
    };

    const handleQuantityChange = (id: number, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeItem(id);
            setSelectedIds(prev => prev.filter(itemId => itemId !== id));
        } else {
            updateQuantity(id, newQuantity);
        }
    };

    const handleRemoveItem = (id: number) => {
        removeItem(id);
        setSelectedIds(prev => prev.filter(itemId => itemId !== id));
    };

    // --- LOGIC: CHỈ CHO PHÉP CHỌN SẢN PHẨM CỦA 1 SHOP TRONG 1 LẦN ---
    const handleToggleItem = (id: number, artisanId: number | undefined) => {
        const currentSelectedArtisanId = selectedIds.length > 0 
            ? items.find(i => i.id === selectedIds[0])?.artisanId 
            : null;
            
        // Nếu đã chọn shop khác, cảnh báo và tự động chuyển sang shop mới
        if (currentSelectedArtisanId && currentSelectedArtisanId !== artisanId && !selectedIds.includes(id)) {
            toast('Đã tự động chuyển sang gian hàng khác. (Chỉ thanh toán 1 gian hàng mỗi lần lên đơn)', { icon: '🔄' });
            setSelectedIds([id]);
            return;
        }

        setSelectedIds(prev => prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]);
    };

    const handleToggleShop = (shopItems: typeof items, artisanId: string) => {
        const shopItemIds = shopItems.map(i => i.id);
        const allSelected = shopItemIds.every(id => selectedIds.includes(id));
        
        if (allSelected) {
            setSelectedIds([]);
        } else {
            const currentSelectedArtisanId = selectedIds.length > 0 
                ? items.find(i => i.id === selectedIds[0])?.artisanId 
                : null;

            if (currentSelectedArtisanId && String(currentSelectedArtisanId) !== artisanId) {
                toast('Đã tự động chuyển sang gian hàng mới.', { icon: '🔄' });
            }
            setSelectedIds(shopItemIds); // Chỉ chọn toàn bộ của shop này, bỏ shop cũ
        }
    };

    // --- TÍNH TOÁN TỔNG TIỀN CHỈ CHO NHỮNG MÓN ĐÃ CHỌN ---
    const { selectedTotal, selectedCount } = useMemo(() => {
        const selectedItems = items.filter(item => selectedIds.includes(item.id));
        const total = selectedItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
        const count = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
        return { selectedTotal: total, selectedCount: count };
    }, [items, selectedIds]);

    const handleProceedToCheckout = () => {
        if (selectedIds.length === 0) {
            toast.error("Vui lòng chọn ít nhất một sản phẩm để thanh toán.");
            return;
        }
        router.push(`/checkout?ids=${selectedIds.join(',')}`);
    };

    // Nhóm sản phẩm theo từng artisanId
    const groupedItems = items.reduce((acc, item) => {
        const key = item.artisanId || 'unknown';
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {} as Record<string, typeof items>);

    return (
        <div className="min-h-screen font-sans text-[#3F2E23] bg-[#FDFBF7] flex flex-col">
            <Header />

            <main className="container mx-auto px-4 py-12 max-w-6xl flex-grow">
                <div className="flex items-center justify-between mb-8 border-b border-[#E8D5B5] pb-6">
                    <h1 className="text-3xl font-extrabold text-[#3F2E23] flex items-center gap-3">
                        <ShoppingBag className="text-[#D96C39]" size={32} /> Giỏ hàng của tôi
                    </h1>
                    {items.length > 0 && (
                        <button onClick={handleClearCart} className="text-sm text-red-500 hover:text-white border border-red-200 hover:bg-red-500 px-4 py-2 rounded-full font-bold transition-colors flex items-center gap-1.5 shadow-sm">
                            <Trash2 size={16} /> Làm sạch giỏ
                        </button>
                    )}
                </div>

                {items.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-[#E8D5B5] shadow-sm">
                        <div className="w-32 h-32 bg-[#FFF8F0] rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag size={48} className="text-[#E8D5B5]" />
                        </div>
                        <h2 className="text-2xl font-bold mb-3 text-[#3F2E23]">Giỏ hàng đang trống</h2>
                        <Link href="/shop/products" className="inline-flex items-center gap-2 bg-[#D96C39] text-white px-8 py-4 rounded-full font-bold shadow-md hover:bg-[#C25B2D] transition-all">
                            Khám phá ngay <ArrowRight size={18} />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        
                        <div className="lg:col-span-2 space-y-6">
                            {Object.entries(groupedItems).map(([artisanId, shopItems]) => {
                                const isShopAllSelected = shopItems.every(i => selectedIds.includes(i.id));
                                const artisanName = artisanMap[artisanId] || (artisanId !== 'unknown' ? `Nghệ nhân #${artisanId}` : 'Sản phẩm có sẵn');

                                return (
                                    <div key={artisanId} className={`bg-white rounded-2xl shadow-sm border overflow-hidden mb-6 transition-all ${isShopAllSelected ? 'border-[#D96C39]' : 'border-[#E8D5B5]'}`}>
                                        <div className="bg-[#FFF8F0] border-b border-[#E8D5B5] px-6 py-4 flex items-center justify-between">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <input 
                                                    type="checkbox" 
                                                    checked={isShopAllSelected}
                                                    onChange={() => handleToggleShop(shopItems, artisanId)}
                                                    className="w-5 h-5 rounded border-[#E8D5B5] text-[#D96C39] focus:ring-[#D96C39] cursor-pointer accent-[#D96C39]"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <Store size={18} className={isShopAllSelected ? "text-[#D96C39]" : "text-[#6B4F3E]"} />
                                                    <span className={`font-black group-hover:text-[#D96C39] transition-colors ${isShopAllSelected ? 'text-[#D96C39]' : 'text-[#3F2E23]'}`}>
                                                        {artisanName}
                                                    </span>
                                                </div>
                                            </label>

                                            {artisanId !== 'unknown' && (
                                                <Link href={`/shop/artisan/${artisanId}`} className="text-xs font-bold text-[#D96C39] hover:bg-orange-50 bg-white px-3 py-1.5 rounded-full border border-[#E8D5B5] shadow-sm">
                                                    Xem Shop
                                                </Link>
                                            )}
                                        </div>

                                        <div className="divide-y divide-[#E8D5B5]/50">
                                            {shopItems.map((item) => {
                                                const isSelected = selectedIds.includes(item.id);
                                                let imageUrl = item.image || '/tramhon-logo.png';
                                                if (imageUrl.startsWith('//')) imageUrl = `https:${imageUrl}`;
                                                else if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) imageUrl = `/${imageUrl}`;

                                                return (
                                                    <div key={item.id} className={`p-6 flex flex-col sm:flex-row gap-5 transition-colors ${isSelected ? 'bg-orange-50/20' : 'hover:bg-gray-50/50'}`}>
                                                        <div className="flex items-center pt-2 sm:pt-0">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={isSelected}
                                                                onChange={() => handleToggleItem(item.id, item.artisanId)}
                                                                className="w-5 h-5 rounded border-[#E8D5B5] text-[#D96C39] focus:ring-[#D96C39] cursor-pointer accent-[#D96C39]"
                                                            />
                                                        </div>

                                                        <Link href={`/shop/id/${item.id}`} className="flex-shrink-0 mx-auto sm:mx-0 block w-full sm:w-auto">
                                                            <div className="relative w-full sm:w-24 h-28 sm:h-24 rounded-xl overflow-hidden bg-[#F7F1E8] border border-[#E8D5B5] shadow-sm hover:shadow-md transition-shadow">
                                                                <Image src={imageUrl} alt={item.productName} fill className="object-cover" />
                                                            </div>
                                                        </Link>

                                                        <div className="flex-1 flex flex-col justify-between">
                                                            <div className="flex justify-between items-start gap-4">
                                                                <Link href={`/shop/id/${item.id}`}>
                                                                    <h3 className="text-base font-bold text-[#3F2E23] hover:text-[#D96C39] transition-colors line-clamp-2">
                                                                        {item.productName}
                                                                    </h3>
                                                                </Link>
                                                                <p className="text-lg font-black text-[#D96C39] whitespace-nowrap">
                                                                    ₫{(Number(item.price) || 0).toLocaleString('vi-VN')}
                                                                </p>
                                                            </div>

                                                            <div className="flex items-center justify-between mt-4">
                                                                <div className="flex items-center border border-[#E8D5B5] rounded-full overflow-hidden bg-white shadow-sm h-9">
                                                                    <button onClick={() => handleQuantityChange(item.id, item.quantity - 1)} className="w-9 h-full flex items-center justify-center bg-[#F7F1E8] hover:bg-[#E8D5B5] text-[#3F2E23] font-bold">-</button>
                                                                    <input type="number" inputMode="numeric" min={1} max={item.stockQuantity ?? 9999} value={item.quantity} onChange={(e) => { const newQty = parseInt(e.target.value, 10); if (!isNaN(newQty)) handleQuantityChange(item.id, newQty); }} className="w-12 text-center h-full outline-none text-sm font-bold text-[#3F2E23]" />
                                                                    <button onClick={() => handleQuantityChange(item.id, item.quantity + 1)} className="w-9 h-full flex items-center justify-center bg-[#F7F1E8] hover:bg-[#E8D5B5] text-[#3F2E23] font-bold" disabled={item.quantity >= (item.stockQuantity ?? 9999)}>+</button>
                                                                </div>

                                                                <button onClick={() => handleRemoveItem(item.id)} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors" title="Xóa khỏi giỏ">
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Order Summary Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-3xl shadow-sm border border-[#E8D5B5] p-6 md:p-8 sticky top-24">
                                <h2 className="text-xl font-extrabold text-[#3F2E23] mb-6 pb-4 border-b border-[#E8D5B5]">Tóm tắt đơn hàng</h2>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-sm font-medium text-[#6B4F3E]">
                                        <span>Đã chọn:</span>
                                        <span className="font-bold text-[#3F2E23]">{selectedCount} món</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-medium text-[#6B4F3E]">
                                        <span>Tạm tính:</span>
                                        <span className="font-bold text-[#3F2E23]">₫{selectedTotal.toLocaleString('vi-VN')}</span>
                                    </div>
                                    
                                    <div className="bg-[#FFF8F0] p-4 rounded-xl border border-[#D96C39]/20 flex justify-between items-center mt-4">
                                        <span className="font-bold text-[#3F2E23]">Tổng cộng:</span>
                                        <span className="text-2xl font-black text-[#D96C39]">₫{selectedTotal.toLocaleString('vi-VN')}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-[#E8D5B5]">
                                    <Button
                                        onClick={handleProceedToCheckout}
                                        disabled={selectedIds.length === 0}
                                        className="flex items-center justify-center gap-2 w-full bg-[#3F2E23] hover:bg-black text-white px-6 h-14 rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        MUA HÀNG ({selectedCount}) <ArrowRight size={18} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}