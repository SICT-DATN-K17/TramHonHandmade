"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import useMyChats from "@/hooks/useMyChats";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, Calendar, ChevronRight, Store, Filter } from "lucide-react";
import { Header, Footer } from "@/components/common";
import { axiosClient } from "@/lib/axios";
import { User } from "@/types";

const getThumbnailUrl = (productImage?: string | null, referenceImage?: string | null) => {
    const path = productImage || referenceImage;
    if (!path) return '/tramhon-logo.png'; 
    if (path.startsWith('//')) return `https:${path}`;
    if (!path.startsWith('http') && !path.startsWith('/')) return `http://127.0.0.1:8000/${path}`;
    return path;
};

export default function MyChatsPage() {
    const { chatDataDetails, isLoading, error } = useMyChats();
    const [artisans, setArtisans] = useState<User[]>([]);
    
    // Thêm State quản lý bộ lọc
    const [filterStatus, setFilterStatus] = useState<string>('ALL');

    useEffect(() => {
        const fetchArtisans = async () => {
            try {
                const res = await axiosClient.get('/users/?role=ARTISAN');
                setArtisans(res.data.slice(0, 4));
            } catch (err) {
                console.error("Không lấy được danh sách nghệ nhân", err);
            }
        };
        fetchArtisans();
    }, []);

    // Logic lọc danh sách Chat
    const filteredChats = useMemo(() => {
        if (filterStatus === 'ALL') return chatDataDetails;
        return chatDataDetails.filter(c => (c.chat?.status?.toUpperCase() || 'PENDING') === filterStatus);
    }, [chatDataDetails, filterStatus]);

    const renderStatusBadge = (status: string) => {
        const upperStatus = status?.toUpperCase() || 'PENDING';
        
        const statusMap: Record<string, { label: string; className: string }> = {
            PENDING: { label: "Đang chờ", className: "bg-yellow-50 text-yellow-800 border-yellow-200" },
            NEGOTIATING: { label: "Đang thương lượng", className: "bg-blue-50 text-blue-800 border-blue-200" },
            ORDER_CREATED: { label: "Có báo giá mới!", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
            CLOSED: { label: "Đã chốt đơn", className: "bg-green-50 text-green-700 border-green-200" },
        };
        
        const config = statusMap[upperStatus] || { label: status, className: "bg-gray-100 text-gray-800" };
        
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border shadow-sm ${config.className}`}>
                {config.label}
            </span>
        );
    };

    const renderArtisanListHorizontal = () => {
        if (artisans.length === 0) return null;

        return (
            <div className="mt-16 pt-12 border-t border-[#E8D5B5] animate-in fade-in duration-700">
                <h3 className="text-2xl font-bold text-center text-[#3F2E23] mb-8 relative inline-block left-1/2 -translate-x-1/2">
                    Gợi ý thêm các gian hàng tiêu biểu
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-1 w-12 rounded-full bg-[#D96C39]"></div>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
                    {artisans.map(artisan => (
                        <Link href={`/shop/artisan/${artisan.id}`} key={artisan.id}>
                            <div className="bg-white p-6 rounded-2xl border border-[#E8D5B5] shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-2 text-center group h-full flex flex-col items-center justify-center">
                                <div className="w-20 h-20 mx-auto rounded-full bg-[#FFF8F0] border-4 border-white shadow-md text-[#D96C39] flex items-center justify-center text-3xl font-extrabold mb-4 group-hover:scale-110 group-hover:border-[#D96C39] transition-all duration-300">
                                    {artisan.name.charAt(0).toUpperCase()}
                                </div>
                                <h4 className="font-bold text-lg text-[#3F2E23] mb-1 group-hover:text-[#D96C39] transition-colors">{artisan.name}</h4>
                                <p className="text-xs font-medium text-[#6B4F3E] flex items-center justify-center gap-1.5 bg-[#F7F1E8] px-3 py-1.5 rounded-full mt-auto">
                                    <Store size={14} className="text-[#D96C39]" /> Gian hàng thủ công
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: '#F7F1E8', color: '#3F2E23' }}>
            <Header />

            <main className="flex-grow container mx-auto px-4 py-12">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-bold mb-3" style={{ color: '#3F2E23' }}>💬 Yêu cầu tùy chỉnh</h1>
                    <div className="h-1 w-24 mx-auto rounded-full mb-4" style={{ backgroundColor: '#D96C39' }}></div>
                    <p className="text-lg mb-6" style={{ color: '#6B4F3E' }}>Quản lý các cuộc trò chuyện và tiến độ đơn hàng làm riêng của bạn</p>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin mb-4" style={{ color: '#D96C39' }} />
                        <p className="text-lg font-medium animate-pulse" style={{ color: '#6B4F3E' }}>Đang tải dữ liệu...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-16 rounded-xl border border-dashed border-red-200 bg-red-50 mx-auto max-w-2xl">
                        <h3 className="text-xl font-bold text-red-700 mb-2">Có lỗi xảy ra</h3>
                        <p className="text-red-600 mb-6">{error}</p>
                        <Button onClick={() => window.location.reload()} className="bg-white text-red-600 border border-red-200">Thử lại</Button>
                    </div>
                ) : chatDataDetails.length === 0 ? (
                    
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                        
                        <div className="text-center lg:text-left py-12 px-8 md:px-12 rounded-3xl border border-[#E8D5B5] bg-white shadow-sm flex flex-col justify-center animate-in fade-in slide-in-from-left-4 duration-500">
                            <div className="text-6xl mb-6 transform hover:scale-110 transition-transform duration-300 inline-block">🛍️</div>
                            <h3 className="text-3xl font-bold mb-4 text-[#3F2E23]">Bạn chưa có yêu cầu làm riêng nào</h3>
                            <p className="mb-8 text-[#6B4F3E] text-base leading-relaxed">
                                Để bắt đầu, hãy dạo quanh các gian hàng, chọn một sản phẩm bạn yêu thích và nhấn nút <strong>"Yêu cầu tùy chỉnh"</strong> để biến nó thành của riêng bạn nhé!
                            </p>
                            <div className="flex justify-center lg:justify-start">
                                <Link href="/shop/products">
                                    <Button className="px-8 py-6 rounded-full text-white font-bold shadow-md hover:shadow-lg hover:-translate-y-1 transition-all text-base w-full sm:w-auto" style={{ backgroundColor: '#D96C39' }}>
                                        Khám phá sản phẩm ngay
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl border border-[#E8D5B5] p-8 shadow-sm flex flex-col justify-center animate-in fade-in slide-in-from-right-4 duration-500">
                            <h3 className="text-xl font-bold text-[#3F2E23] mb-6 relative inline-block">
                                Hoặc ghé qua các gian hàng tiêu biểu
                                <div className="absolute -bottom-2 left-0 h-1 w-12 rounded-full bg-[#D96C39]"></div>
                            </h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {artisans.map(artisan => (
                                    <Link href={`/shop/artisan/${artisan.id}`} key={artisan.id}>
                                        <div className="bg-[#FFF8F0] p-4 rounded-2xl border border-[#E8D5B5]/50 hover:border-[#D96C39] hover:shadow-md transition-all duration-300 flex items-center gap-4 group h-full">
                                            <div className="w-14 h-14 rounded-full bg-white border-2 border-white shadow-sm text-[#D96C39] flex items-center justify-center text-xl font-extrabold group-hover:scale-105 transition-transform flex-shrink-0">
                                                {artisan.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-[#3F2E23] group-hover:text-[#D96C39] transition-colors line-clamp-1">{artisan.name}</h4>
                                                <p className="text-[11px] font-medium text-[#6B4F3E] flex items-center gap-1 mt-1">
                                                    <Store size={12} className="text-[#D96C39]" /> Gian hàng thủ công
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                ) : (
                    <div className="max-w-5xl mx-auto">
                        {/* BỘ LỌC TRẠNG THÁI */}
                        <div className="flex flex-wrap gap-2 mb-8 justify-center sm:justify-start">
                            <Button
                                variant={filterStatus === 'ALL' ? 'default' : 'outline'}
                                onClick={() => setFilterStatus('ALL')}
                                className={`rounded-full px-5 h-10 font-bold transition-all ${filterStatus === 'ALL'
                                        ? 'bg-[#3F2E23] text-white shadow-md hover:bg-[#2A1F17]'
                                        : 'border-[#E8D5B5] text-[#6B4F3E] hover:bg-[#FFF8F0] bg-white'
                                    }`}
                            >
                                Tất cả ({chatDataDetails.length})
                            </Button>
                            {Object.entries({
                                PENDING: { label: "Đang chờ", className: "bg-yellow-50 text-yellow-800 border-yellow-200" },
                                NEGOTIATING: { label: "Đang thương lượng", className: "bg-blue-50 text-blue-800 border-blue-200" },
                                ORDER_CREATED: { label: "Có báo giá mới", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
                                CLOSED: { label: "Đã chốt đơn", className: "bg-green-50 text-green-700 border-green-200" }
                            }).map(([key, config]) => {
                                const count = chatDataDetails.filter(c => (c.chat?.status?.toUpperCase() || 'PENDING') === key).length;
                                // Ẩn nút nếu trạng thái đó không có đoạn chat nào (trừ khi đang được chọn)
                                if (count === 0 && filterStatus !== key) return null;

                                const isActive = filterStatus === key;
                                return (
                                    <Button
                                        key={key}
                                        variant={isActive ? 'default' : 'outline'}
                                        onClick={() => setFilterStatus(key)}
                                        className={`rounded-full px-5 h-10 font-bold transition-all border-2 ${isActive
                                                ? `${config.className} shadow-md border-current`
                                                : 'border-[#E8D5B5] text-[#6B4F3E] hover:bg-[#FFF8F0] border-transparent bg-white'
                                            }`}
                                    >
                                        {config.label} ({count})
                                    </Button>
                                );
                            })}
                        </div>

                        {/* DANH SÁCH CHAT ĐÃ LỌC */}
                        {filteredChats.length === 0 ? (
                            <div className="py-20 flex flex-col items-center bg-white rounded-3xl border border-[#E8D5B5] shadow-sm">
                                <Filter size={40} className="text-[#E8D5B5] mb-4" />
                                <p className="font-bold text-[#3F2E23] text-lg">Không tìm thấy yêu cầu nào khớp bộ lọc</p>
                                <Button variant="link" onClick={() => setFilterStatus('ALL')} className="text-[#D96C39] mt-2">
                                    Xem tất cả yêu cầu
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {filteredChats.map((chatDetail, idx) => {
                                    // Xử lý lấy tên nghệ nhân linh hoạt từ data
                                    const artisanName = chatDetail.artisan?.name || chatDetail.chat?.artisan?.name || chatDetail.chat?.artisan_name || "Gian hàng thủ công";

                                    return (
                                        <div
                                            key={chatDetail.chat.id}
                                            className="group overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-md bg-white"
                                            style={{ borderColor: '#E8D5B5', animation: `fadeInUp 0.5s ease-out ${idx * 0.1}s backwards` }}
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4" style={{ backgroundColor: '#FFF8F0', borderColor: '#E8D5B5' }}>
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2.5 rounded-full bg-orange-100 shadow-sm">
                                                        <MessageSquare size={20} style={{ color: '#D96C39' }} />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-lg" style={{ color: '#3F2E23' }}>
                                                            Yêu cầu #{chatDetail.chat.id}
                                                        </span>
                                                        <div className="flex items-center gap-2 text-xs mt-1 font-medium" style={{ color: '#6B4F3E' }}>
                                                            {/* HIỂN THỊ TÊN NGHỆ NHÂN */}
                                                            <Store size={14} className="text-[#D96C39]" /> 
                                                            <span>{artisanName}</span>
                                                            <span className="opacity-50 px-1">|</span>
                                                            <Calendar size={14} className="text-[#D96C39]" /> 
                                                            <span>{formatDate(chatDetail.chat.createdAt)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>{renderStatusBadge(chatDetail.chat.status)}</div>
                                            </div>

                                            <div className="p-6">
                                                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                                                    
                                                    <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border bg-gray-50 shadow-sm" style={{ borderColor: '#E8D5B5' }}>
                                                        <Image
                                                            src={getThumbnailUrl(chatDetail.product?.image, chatDetail.chat?.referenceImage)}
                                                            alt="Thumbnail"
                                                            fill
                                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                            sizes="96px"
                                                        />
                                                    </div>

                                                    <div className="flex-1 w-full">
                                                        <h4 className="font-bold text-xl mb-1 group-hover:text-[#D96C39] transition-colors" style={{ color: '#3F2E23' }}>
                                                            {chatDetail.chat?.title || "Yêu cầu tùy chỉnh"}
                                                        </h4>
                                                        <p className="text-sm font-bold mb-2 flex items-center gap-1.5" style={{ color: '#D96C39' }}>
                                                            <span className="text-[#6B4F3E] font-medium">Mẫu tham khảo:</span> {chatDetail.product?.name || "Thiết kế riêng"}
                                                        </p>

                                                        {chatDetail.chat?.description && (
                                                            <div className="bg-[#F7F1E8] p-3 rounded-lg border border-[#E8D5B5]/50">
                                                                <p className="text-sm line-clamp-2" style={{ color: '#6B4F3E', fontStyle: 'italic' }}>
                                                                    &ldquo;{chatDetail.chat.description}&rdquo;
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="hidden md:block text-right">
                                                        <Link href={`/chat/${chatDetail.chat.id}`}>
                                                            <Button className="rounded-full text-white shadow-md hover:shadow-lg hover:-translate-y-1 transition-all px-6 py-5" style={{ backgroundColor: '#3F2E23' }}>
                                                                Tiếp tục chat
                                                                <ChevronRight size={18} className="ml-1" />
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </div>

                                                <div className="md:hidden mt-5">
                                                    <Link href={`/chat/${chatDetail.chat.id}`}>
                                                        <Button className="w-full text-white py-6 rounded-xl font-bold" style={{ backgroundColor: '#3F2E23' }}>
                                                            Tiếp tục trò chuyện
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {renderArtisanListHorizontal()}
                    </div>
                )}
            </main>
            <Footer />
            <style jsx global>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}