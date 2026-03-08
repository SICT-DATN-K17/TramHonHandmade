// frontend/src/app/admin/chat/page.tsx
"use client";

import React from "react";
import useAllChats from "@/hooks/useAllChats";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./column";
import { Loader2 } from "lucide-react";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";

// --- THEME CONSTANTS (Đồng bộ với trang chi tiết) ---
const THEME = {
    textPrimary: '#3F2E23',   // Nâu đậm
    textSecondary: '#6B4F3E', // Nâu vừa
    border: '#E8D5B5',        // Be
    bgLight: '#FFF8F0',       // Kem nhạt
    bgWhite: '#ffffff',       // Trắng
};

export default function AdminChatManagementPage() {
    const { chatDataDetails, isLoading, error } = useAllChats();

    return (
        <div
            className="flex-col h-full min-h-screen"
            style={{ backgroundColor: THEME.bgWhite }}
        >
            <div className="flex-1 space-y-4 p-8 pt-6">

                {/* --- HEADER --- */}
                <div className="flex items-center justify-between">
                    {/* Bọc Heading để áp dụng màu text */}
                    <div style={{ color: THEME.textPrimary }}>
                        <Heading
                            title={`Quản lý Chat (${chatDataDetails?.length || 0})`}
                            description="Theo dõi và phản hồi tất cả các yêu cầu tùy chỉnh của khách hàng."
                        />
                    </div>
                </div>

                {/* --- SEPARATOR --- */}
                <Separator style={{ backgroundColor: THEME.border }} />

                {/* --- CONTENT --- */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2
                            className="h-10 w-10 animate-spin mb-4"
                            style={{ color: THEME.textSecondary }}
                        />
                        <p style={{ color: THEME.textSecondary }}>
                            Đang tải dữ liệu hội thoại...
                        </p>
                    </div>
                ) : error ? (
                    <div
                        className="p-4 border rounded-lg flex items-center gap-3"
                        style={{
                            backgroundColor: THEME.bgLight,
                            borderColor: '#ef4444', // Giữ màu đỏ nhẹ cảnh báo nhưng nền kem
                            color: '#7f1d1d'
                        }}
                    >
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                ) : (
                    <div
                        className="rounded-md border overflow-hidden"
                        style={{ borderColor: THEME.border }}
                    >
                        {/* Lưu ý: DataTable bên trong có thể cần CSS global
                           hoặc props style để đổi màu header table nếu muốn đồng bộ hoàn toàn.
                           Ở đây tôi bọc nó trong border màu Be để hợp tone.
                        */}
                        <DataTable
                            columns={columns}
                            data={chatDataDetails}
                            searchKey="title"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}