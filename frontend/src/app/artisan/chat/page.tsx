// frontend/src/app/artisan/chat/page.tsx
"use client";

import React from "react";
import useAllChats from "@/hooks/useAllChats";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./column";
import { Loader2 } from "lucide-react";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";

// --- THEME CONSTANTS ---
const THEME = {
    textPrimary: '#3F2E23',   
    textSecondary: '#6B4F3E', 
    border: '#E8D5B5',        
    bgLight: '#FFF8F0',       
    bgWhite: '#ffffff',       
};

export default function ArtisanChatManagementPage() {
    const { chatDataDetails, isLoading, error } = useAllChats();

    return (
        <div className="flex-col h-full min-h-screen" style={{ backgroundColor: THEME.bgWhite }}>
            <div className="flex-1 space-y-4 p-8 pt-6">

                {/* --- HEADER --- */}
                <div className="flex items-center justify-between">
                    <div style={{ color: THEME.textPrimary }}>
                        <Heading
                            title={`Quản lý Chat (${chatDataDetails?.length || 0})`}
                            description="Theo dõi và phản hồi tất cả các yêu cầu tùy chỉnh của khách hàng."
                        />
                    </div>
                </div>

                <Separator style={{ backgroundColor: THEME.border }} />

                {/* --- CONTENT --- */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader2 className="h-12 w-12 animate-spin mb-4" style={{ color: '#D96C39' }} />
                        <p className="font-medium animate-pulse" style={{ color: THEME.textSecondary }}>
                            Đang tải dữ liệu hội thoại...
                        </p>
                    </div>
                ) : error ? (
                    <div className="p-6 border rounded-xl flex items-center justify-center gap-3 bg-red-50/50 border-red-200 text-red-700 shadow-sm mx-auto max-w-lg mt-10">
                        <span className="text-2xl">⚠️</span>
                        <span className="font-medium">{error}</span>
                    </div>
                ) : (
                    <div className="rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: THEME.border }}>
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