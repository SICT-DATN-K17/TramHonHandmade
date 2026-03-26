"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import useMyChats from "@/hooks/useMyChats";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, Calendar, ChevronRight, PlusCircle } from "lucide-react";
import { Header, Footer } from "@/components/common";

// --- HELPER XỬ LÝ ẢNH THUMBNAIL ---
const getThumbnailUrl = (productImage?: string | null, referenceImage?: string | null) => {
    // Ưu tiên ảnh sản phẩm (nếu đã chốt đơn), không có thì dùng ảnh tham khảo (lúc mới tạo yêu cầu)
    const path = productImage || referenceImage;
    if (!path) return '/tramhon-logo.png'; // Fallback nếu không có cả 2
    if (path.startsWith('//')) return `https:${path}`;
    return path;
};

export default function MyChatsPage() {
    const { chatDataDetails, isLoading, error } = useMyChats();

    const renderStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; className: string }> = {
            PENDING: {
                label: "Đang chờ",
                className: "bg-gray-100 text-gray-800 border-gray-200"
            },
            NEGOTIATING: {
                label: "Đang thương lượng",
                className: "bg-orange-100 text-orange-800 border-orange-200"
            },
            ORDER_CREATED: {
                label: "Đơn hàng đã được tạo",
                className: "bg-blue-50 text-blue-700 border-blue-200"
            },
            CLOSED: {
                label: "Đã hoàn thành",
                className: "bg-green-50 text-green-700 border-green-200"
            },
        };
        const config = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border shadow-sm ${config.className}`}>
                {config.label}
            </span>
        );
    };

    return (
        <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: '#F7F1E8', color: '#3F2E23' }}>
            <Header />

            <main className="flex-grow container mx-auto px-4 py-12">
                {/* Phần Header của trang */}
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-bold mb-3" style={{ color: '#3F2E23' }}>💬 Yêu cầu tùy chỉnh</h1>
                    <div className="h-1 w-24 mx-auto rounded-full mb-4" style={{ backgroundColor: '#D96C39' }}></div>
                    <p className="text-lg mb-6" style={{ color: '#6B4F3E' }}>Quản lý các cuộc trò chuyện và yêu cầu đặt làm riêng</p>

                    {/* --- NÚT BẤM MỚI --- */}
                    <Link href="/custom-request/new">
                        <Button
                            className="inline-flex items-center rounded-full px-6 py-6 shadow-lg hover:scale-105 transition-transform font-semibold text-white"
                            style={{ backgroundColor: '#D96C39' }}
                        >
                            <PlusCircle size={20} className="mr-2" />
                            Tạo yêu cầu thiết kế mới
                        </Button>
                    </Link>
                    {/* ------------------- */}
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin mb-4" style={{ color: '#D96C39' }} />
                        <p className="text-lg font-medium animate-pulse" style={{ color: '#6B4F3E' }}>Đang tải tin nhắn...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-16 rounded-xl border border-dashed border-red-200 bg-red-50 mx-auto max-w-2xl">
                        <h3 className="text-xl font-bold text-red-700 mb-2">Có lỗi xảy ra</h3>
                        <p className="text-red-600 mb-6">{error}</p>
                        <Button onClick={() => window.location.reload()} className="bg-white text-red-600 border border-red-200">Thử lại</Button>
                    </div>
                ) : chatDataDetails.length === 0 ? (
                    <div className="text-center py-20 rounded-xl border-2 border-dashed" style={{ borderColor: '#E8D5B5', backgroundColor: '#FFF8F0' }}>
                        <div className="text-8xl mb-6">✉️</div>
                        <h3 className="text-2xl font-semibold mb-3">Bạn chưa có yêu cầu nào</h3>
                        <p className="mb-8" style={{ color: '#6B4F3E' }}>Hãy chọn một sản phẩm hoặc tạo yêu cầu mới để bắt đầu.</p>

                        <div className="flex justify-center gap-4">
                            <Link href="/shop/products">
                                <Button variant="outline" className="px-6 py-5 rounded-full border-stone-300">Khám phá sản phẩm</Button>
                            </Link>
                            <Link href="/custom-request/new">
                                <Button className="px-6 py-5 rounded-full text-white" style={{ backgroundColor: '#D96C39' }}>Tạo yêu cầu mới</Button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 max-w-5xl mx-auto">
                        {chatDataDetails.map((chatDetail, idx) => (
                            <div
                                key={chatDetail.chat.id}
                                className="group overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-md bg-white"
                                style={{ borderColor: '#E8D5B5', animation: `fadeInUp 0.5s ease-out ${idx * 0.1}s backwards` }}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4" style={{ backgroundColor: '#FFF8F0', borderColor: '#E8D5B5' }}>
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-full bg-orange-100">
                                            <MessageSquare size={20} style={{ color: '#D96C39' }} />
                                        </div>
                                        <div>
                                            <span className="font-bold text-lg" style={{ color: '#3F2E23' }}>
                                                Yêu cầu #{chatDetail.chat.id}
                                            </span>
                                            <div className="flex items-center gap-2 text-xs mt-1" style={{ color: '#6B4F3E' }}>
                                                <Calendar size={14} /> {formatDate(chatDetail.chat.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                    <div>{renderStatusBadge(chatDetail.chat.status)}</div>
                                </div>

                                <div className="p-6">
                                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                                        
                                        {/* --- ẢNH SẢN PHẨM / THAM KHẢO --- */}
                                        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border bg-gray-50" style={{ borderColor: '#E8D5B5' }}>
                                            <Image
                                                src={getThumbnailUrl(chatDetail.product?.image, chatDetail.chat?.reference_image)}
                                                alt="Thumbnail"
                                                fill
                                                className="object-cover"
                                                sizes="96px"
                                            />
                                        </div>

                                        {/* Nội dung text */}
                                        <div className="flex-1 w-full">
                                            <h4 className="font-bold text-xl mb-1" style={{ color: '#3F2E23' }}>
                                                {chatDetail.chat?.title || "Yêu cầu tùy chỉnh"}
                                            </h4>
                                            <p className="text-sm font-semibold mb-2" style={{ color: '#D96C39' }}>
                                                {chatDetail.product?.name || "Thiết kế riêng theo yêu cầu"}
                                            </p>

                                            {chatDetail.chat?.description && (
                                                <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
                                                    <p className="text-sm line-clamp-2" style={{ color: '#6B4F3E', fontStyle: 'italic' }}>
                                                        &ldquo;{chatDetail.chat.description}&rdquo;
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Nút bấm Desktop */}
                                        <div className="hidden md:block text-right">
                                            <Link href={`/chat/${chatDetail.chat.id}`}>
                                                <Button className="rounded-full text-white shadow-md hover:scale-105 transition-transform" style={{ backgroundColor: '#3F2E23' }}>
                                                    Tiếp tục chat
                                                    <ChevronRight size={18} className="ml-1" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Nút bấm Mobile */}
                                    <div className="md:hidden mt-4">
                                        <Link href={`/chat/${chatDetail.chat.id}`}>
                                            <Button className="w-full text-white" style={{ backgroundColor: '#3F2E23' }}>
                                                Mở cuộc trò chuyện
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
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