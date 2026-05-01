"use client";

import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

// --- THEME CONSTANTS ---
const THEME = {
    textPrimary: '#3F2E23',   
    textSecondary: '#6B4F3E', 
    border: '#E8D5B5',        
    bgLight: '#FFF8F0',       
};

const getProductImageUrl = (imagePath?: string | null) => {
    if (!imagePath) return '/tramhon-logo.png';
    if (imagePath.startsWith('//')) return `https:${imagePath}`;
    if (imagePath.startsWith('http')) return imagePath;
    const apiUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || '';
    return `${apiUrl}${imagePath}`;
};

export const columns: ColumnDef<any>[] = [
    {
        accessorKey: "chat.id",
        header: () => <div style={{ color: THEME.textSecondary }}>ID</div>,
        cell: ({ row }) => (
            <span className="font-semibold" style={{ color: THEME.textPrimary }}>#{row.original.chat.id}</span>
        ),
    },
    {
        id: "productImage",
        header: () => <div style={{ color: THEME.textSecondary }}>Ảnh</div>,
        cell: ({ row }) => {
            const product = row.original.product || row.original.chat?.product;
            const refImage = row.original.chat?.referenceImage || row.original.chat?.reference_image;
            const imagePath = product?.image || refImage;

            return (
                <div
                    className="h-12 w-12 relative rounded-md overflow-hidden border shadow-sm"
                    style={{ borderColor: THEME.border, backgroundColor: THEME.bgLight }}
                >
                    <Image
                        src={getProductImageUrl(imagePath)}
                        alt="Thumbnail"
                        fill
                        className="object-cover hover:scale-110 transition-transform duration-300"
                        sizes="48px" 
                    />
                </div>
            );
        },
    },
    {
        id: "title",
        header: () => <div style={{ color: THEME.textSecondary }}>Tiêu đề yêu cầu</div>,
        cell: ({ row }) => (
            <div className="flex flex-col max-w-[220px]">
                <span className="truncate font-bold" style={{ color: THEME.textPrimary }}>
                    {row.original.chat.title || "Yêu cầu không tên"}
                </span>
                <span className="truncate text-[11px] mt-0.5" style={{ color: THEME.textSecondary }}>
                    {row.original.product?.name || row.original.chat?.product?.name || "Thiết kế theo yêu cầu"}
                </span>
            </div>
        ),
    },
    {
        id: "customer",
        header: () => <div style={{ color: THEME.textSecondary }}>Khách hàng</div>,
        cell: ({ row }) => (
            <div className="flex flex-col">
                <span className="text-sm font-semibold" style={{ color: THEME.textPrimary }}>
                    {row.original.customer?.name || "N/A"}
                </span>
                <span className="text-xs" style={{ color: THEME.textSecondary }}>
                    {row.original.customer?.email}
                </span>
            </div>
        ),
    },
    {
        id: "status",
        header: () => <div style={{ color: THEME.textSecondary }}>Trạng thái</div>,
        cell: ({ row }) => {
            const status = row.original.chat.status?.toUpperCase() || 'PENDING';

            // --- BỘ TRẠNG THÁI ĐÃ ĐỒNG BỘ LUỒNG MỚI ---
            const statusMap: Record<string, { label: string; className: string }> = {
                PENDING: {
                    label: "Đang chờ",
                    className: "bg-yellow-50 text-yellow-700 border-yellow-200"
                },
                NEGOTIATING: { 
                    label: "Đang thương lượng",
                    className: "bg-blue-50 text-blue-700 border-blue-200"
                },
                ORDER_CREATED: { 
                    label: "Đã tạo báo giá",
                    className: "bg-indigo-50 text-indigo-700 border-indigo-200"
                },
                CLOSED: { 
                    label: "Hoàn thành",
                    className: "bg-green-50 text-green-700 border-green-200"
                }
            };

            const config = statusMap[status] || {
                label: status,
                className: "bg-gray-100 text-gray-600 border-gray-200"
            };

            return (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-sm ${config.className}`}>
                    {config.label}
                </span>
            );
        },
    },
    {
        id: "createdAt",
        header: () => <div style={{ color: THEME.textSecondary }}>Ngày tạo</div>,
        cell: ({ row }) => (
            <span className="text-sm font-medium" style={{ color: THEME.textSecondary }}>
                {formatDate(row.original.chat.created_at || row.original.chat.createdAt)}
            </span>
        ),
    },
    {
        id: "actions",
        header: "",
        cell: ({ row }) => (
            <Link href={`/artisan/chat/${row.original.chat.id}`}>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 transition-colors shadow-sm border hover:bg-[#FFF8F0]"
                    style={{ backgroundColor: '#fff', borderColor: THEME.border }}
                >
                    <ChevronRight className="h-4 w-4" style={{ color: THEME.textPrimary }} />
                </Button>
            </Link>
        ),
    },
];