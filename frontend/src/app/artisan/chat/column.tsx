"use client";

import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

// --- THEME CONSTANTS (Đồng bộ với các trang khác) ---
const THEME = {
    textPrimary: '#3F2E23',   // Nâu đậm
    textSecondary: '#6B4F3E', // Nâu vừa
    border: '#E8D5B5',        // Be
    bgLight: '#FFF8F0',       // Kem nhạt
};

// Helper xử lý ảnh
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
        header: ({ column }) => (
            <div style={{ color: THEME.textSecondary }}>ID</div>
        ),
        cell: ({ row }) => (
            <span style={{ color: THEME.textPrimary }}>{row.original.chat.id}</span>
        ),
    },
    {
        id: "productImage",
        header: ({ column }) => (
            <div style={{ color: THEME.textSecondary }}>Ảnh</div>
        ),
        cell: ({ row }) => {
            // Lấy ảnh sản phẩm, nếu chưa có thì lấy ảnh tham khảo của chat
            const imagePath = row.original.product?.image || row.original.chat?.reference_image;

            return (
                <div
                    className="h-10 w-10 relative rounded overflow-hidden border bg-gray-50"
                    style={{ borderColor: THEME.border }}
                >
                    <Image
                        src={getProductImageUrl(imagePath)}
                        alt="Thumbnail"
                        fill
                        className="object-cover"
                        sizes="40px" // Tối ưu thêm sizes cho ảnh nhỏ
                    />
                </div>
            );
        },
    },
    {
        id: "title",
        header: ({ column }) => (
            <div style={{ color: THEME.textSecondary }}>Tiêu đề yêu cầu</div>
        ),
        cell: ({ row }) => (
            <div
                className="max-w-[200px] truncate font-medium"
                style={{ color: THEME.textPrimary }}
            >
                {row.original.chat.title}
            </div>
        ),
    },
    {
        id: "customer",
        header: ({ column }) => (
            <div style={{ color: THEME.textSecondary }}>Khách hàng</div>
        ),
        cell: ({ row }) => (
            <div className="flex flex-col">
                <span
                    className="text-sm font-semibold"
                    style={{ color: THEME.textPrimary }}
                >
                    {row.original.customer?.name || "N/A"}
                </span>
                <span
                    className="text-xs"
                    style={{ color: THEME.textSecondary }}
                >
                    {row.original.customer?.email}
                </span>
            </div>
        ),
    },
    {
        id: "status",
        header: ({ column }) => (
            <div style={{ color: THEME.textSecondary }}>Trạng thái</div>
        ),
        cell: ({ row }) => {
            const status = row.original.chat.status;

            // --- CẬP NHẬT STATUS MAP ---
            const statusMap: Record<string, { label: string; className: string; style: React.CSSProperties }> = {
                PENDING: {
                    label: "Đang chờ",
                    className: "bg-gray-100 text-gray-600 border-gray-200",
                    style: {}
                },
                NEGOTIATING: { // Thay thế cho IN_PROGRESS
                    label: "Đang thương lượng",
                    className: "bg-orange-100 text-orange-800 border-orange-200",
                    style: {}
                },
                ORDER_CREATED: { // Mới thêm: Khi Artisan gửi Proposal
                    label: "Đơn đã được tạo",
                    className: "bg-blue-50 text-blue-700 border-blue-200",
                    style: {}
                },
                CLOSED: { // Khi Customer thanh toán xong
                    label: "Đã hoàn thành",
                    className: "bg-green-50 text-green-700 border-green-200",
                    style: {}
                }
            };
            // ---------------------------

            const config = statusMap[status] || {
                label: status,
                className: "bg-gray-100",
                style: {}
            };

            return (
                <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${config.className}`}
                    style={config.style}
                >
                    {config.label}
                </span>
            );
        },
    },
    {
        id: "createdAt",
        header: ({ column }) => (
            <div style={{ color: THEME.textSecondary }}>Ngày tạo</div>
        ),
        cell: ({ row }) => (
            <span style={{ color: THEME.textSecondary }}>
                {formatDate(row.original.chat.created_at)}
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
                    className="h-8 w-8 p-0 hover:bg-[#FFF8F0]" // Hover background: bgLight
                >
                    <ChevronRight
                        className="h-4 w-4"
                        style={{ color: THEME.textPrimary }}
                    />
                </Button>
            </Link>
        ),
    },
];