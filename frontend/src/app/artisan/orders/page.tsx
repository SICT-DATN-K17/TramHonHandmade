'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Loader2, FileText, Filter } from 'lucide-react';
import type { PaymentMethod } from '@/types';
import useAxiosAuth from '@/hooks/useAxiosAuth';
import toast, { Toaster } from 'react-hot-toast';
import type { RawArtisanOrderList } from '@/types/apiTypes';

// Định nghĩa lại Interface cho chuẩn với data mới
interface MappedOrder {
    id: number;
    orderNumber: string;
    customerName: string;
    phone: string;
    status: string;
    createdAt: string;
    subtotal: number;
    shippingFee: number;
    total: number;
    paymentMethod: PaymentMethod;
}

// BỘ STATUS CHUẨN ĐỒNG BỘ VỚI BACKEND VÀ ODOO
const statusConfig: Record<string, { label: string; badgeClass: string }> = {
    PENDING_PICKUP: { label: 'Đang chờ lấy hàng', badgeClass: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    PACKAGING: { label: 'Đang đóng gói hàng', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
    SHIPPING: { label: 'Đang giao hàng', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' },
    DELIVERED_AWAITING: { label: 'Chờ khách xác nhận', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    DELIVERED: { label: 'Đã giao hàng', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    COMPLETED: { label: 'Hoàn thành', badgeClass: 'bg-green-50 text-green-700 border-green-200' },
    CANCELLED: { label: 'Đã hủy', badgeClass: 'bg-red-50 text-red-700 border-red-200' },
    REFUNDED: { label: 'Đã hoàn tiền', badgeClass: 'bg-gray-50 text-gray-700 border-gray-200' },
};

const paymentLabels: Record<PaymentMethod, string> = {
    cod: 'Thanh toán khi nhận hàng (COD)',
    bank_transfer: 'Chuyển khoản ngân hàng',
    credit_card: 'Thẻ tín dụng/Ghi nợ',
};

const formatCurrency = (value: number) => `₫${value.toLocaleString('vi-VN')}`;

const mapArtisanOrder = (rawOrder: RawArtisanOrderList): MappedOrder => {
    const mapBackendPaymentMethodToFrontend = (backendMethod: string): PaymentMethod => {
        switch (backendMethod) {
            case 'COD': return 'cod';
            case 'ONLINE': return 'bank_transfer';
            default: return 'cod';
        }
    };

    return {
        id: rawOrder.id,
        orderNumber: rawOrder.orderNumber,
        customerName: rawOrder.customerName,
        phone: rawOrder.phone,
        status: rawOrder.status?.toUpperCase() || 'PENDING_PICKUP',
        createdAt: rawOrder.createdAt,
        subtotal: Number(rawOrder.subtotal),
        shippingFee: Number(rawOrder.shippingFee || 0),
        total: Number(rawOrder.total),
        paymentMethod: mapBackendPaymentMethodToFrontend(rawOrder.paymentMethod),
    };
};

const ArtisanOrdersPage = () => {
    const [orders, setOrders] = useState<MappedOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // State mới cho bộ lọc[cite: 18]
    const [filterStatus, setFilterStatus] = useState<string>('ALL');

    const axiosAuth = useAxiosAuth();

    const fetchOrders = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await axiosAuth.get<RawArtisanOrderList[]>('/orders/artisan/all');
            const mappedOrders = response.data.map(mapArtisanOrder);
            setOrders(mappedOrders);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            toast.error('Không thể tải danh sách đơn hàng');
            setOrders([]);
        } finally {
            setIsLoading(false);
        }
    }, [axiosAuth]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Logic lọc đơn hàng[cite: 18]
    const filteredOrders = useMemo(() => {
        if (filterStatus === 'ALL') return orders;
        return orders.filter(order => order.status === filterStatus);
    }, [orders, filterStatus]);

    // Doanh thu vẫn tính trên tổng số đơn không bị hủy (Global Stats)[cite: 18]
    const totalRevenue = useMemo(
        () => orders
            .filter(order => !['CANCELLED', 'REFUNDED'].includes(order.status))
            .reduce((sum, order) => sum + order.total, 0),
        [orders]
    );

    const processingOrdersCount = useMemo(
        () => orders.filter((o) => !['DELIVERED_AWAITING', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED'].includes(o.status)).length,
        [orders]
    );

    return (
        <>
            <Toaster position="top-right" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: '#3F2E23' }}>
                        Quản lý đơn hàng
                    </h1>
                    <p className="mt-1 text-sm" style={{ color: '#6B4F3E' }}>
                        Xem chi tiết và theo dõi đơn hàng của bạn.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-[#E8D5B5] bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#6B4F3E' }}>Tổng đơn</p>
                        <p className="text-3xl font-black mt-2" style={{ color: '#3F2E23' }}>{orders.length}</p>
                    </div>
                    <div className="rounded-2xl border border-[#E8D5B5] bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#6B4F3E' }}>Doanh thu dự kiến</p>
                        <p className="text-3xl font-black mt-2 text-[#D96C39]">{formatCurrency(totalRevenue)}</p>
                    </div>
                    <div className="rounded-2xl border border-[#E8D5B5] bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#6B4F3E' }}>Đang xử lý</p>
                        <p className="text-3xl font-black mt-2 text-blue-600">
                            {processingOrdersCount}
                        </p>
                    </div>
                </div>

                {/* BỘ LỌC TRẠNG THÁI (Tabs Filter) */}
                <div className="flex flex-wrap gap-2 pb-2">
                    <Button
                        variant={filterStatus === 'ALL' ? 'default' : 'outline'}
                        onClick={() => setFilterStatus('ALL')}
                        className={`rounded-full px-4 h-9 font-bold transition-all ${filterStatus === 'ALL'
                                ? 'bg-[#3F2E23] text-white shadow-md'
                                : 'border-[#E8D5B5] text-[#6B4F3E] hover:bg-[#FFF8F0]'
                            }`}
                    >
                        Tất cả ({orders.length})
                    </Button>
                    {Object.entries(statusConfig).map(([key, config]) => {
                        const count = orders.filter(o => o.status === key).length;
                        if (count === 0 && filterStatus !== key) return null;

                        const isActive = filterStatus === key;
                        return (
                            <Button
                                key={key}
                                variant={isActive ? 'default' : 'outline'}
                                onClick={() => setFilterStatus(key)}
                                className={`rounded-full px-4 h-9 font-bold transition-all border-2 ${isActive
                                        ? `${config.badgeClass} shadow-md border-current`
                                        : 'border-[#E8D5B5] text-[#6B4F3E] hover:bg-[#FFF8F0] border-transparent'
                                    }`}
                            >
                                {config.label} ({count})
                            </Button>
                        );
                    })}
                </div>

                <div className="overflow-hidden rounded-2xl border border-[#E8D5B5] bg-white shadow-sm">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20 flex-col gap-3" style={{ color: '#6B4F3E' }}>
                            <Loader2 className="h-8 w-8 animate-spin text-[#D96C39]" />
                            <span className="font-medium">Đang tải dữ liệu đơn hàng...</span>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="py-20 flex flex-col items-center">
                            <Filter size={40} className="text-[#E8D5B5] mb-3" />
                            <p className="font-bold text-[#3F2E23]">Không tìm thấy đơn hàng nào khớp bộ lọc</p>
                            <Button variant="link" onClick={() => setFilterStatus('ALL')} className="text-[#D96C39]">Xem tất cả đơn hàng</Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-[#FFF8F0]">
                                <TableRow className="border-[#E8D5B5]">
                                    <TableHead className="font-bold text-[#3F2E23]">Mã đơn</TableHead>
                                    <TableHead className="font-bold text-[#3F2E23]">Khách hàng</TableHead>
                                    <TableHead className="font-bold text-[#3F2E23]">Điện thoại</TableHead>
                                    <TableHead className="font-bold text-[#3F2E23]">Tổng tiền</TableHead>
                                    <TableHead className="font-bold text-[#3F2E23]">Thanh toán</TableHead>
                                    <TableHead className="font-bold text-[#3F2E23]">Trạng thái</TableHead>
                                    <TableHead className="font-bold text-[#3F2E23]">Ngày tạo</TableHead>
                                    <TableHead className="text-right font-bold text-[#3F2E23]">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.map((order) => {
                                    const statusObj = statusConfig[order.status] || { label: order.status, badgeClass: 'bg-gray-100 text-gray-800' };

                                    return (
                                        <TableRow key={order.id} className="border-[#E8D5B5] hover:bg-gray-50/50">
                                            <TableCell className="font-black text-[#D96C39]">{order.orderNumber}</TableCell>
                                            <TableCell className="font-medium text-[#3F2E23]">{order.customerName}</TableCell>
                                            <TableCell className="text-[#6B4F3E]">{order.phone}</TableCell>
                                            <TableCell className="font-bold text-[#3F2E23]">{formatCurrency(order.total)}</TableCell>
                                            <TableCell className="text-xs font-medium text-[#6B4F3E]">{paymentLabels[order.paymentMethod]}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`${statusObj.badgeClass} border shadow-sm px-2.5 py-0.5 font-bold`}>
                                                    {statusObj.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-[#6B4F3E] text-sm">
                                                {new Date(order.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/artisan/orders/${order.id}`}>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-[#E8D5B5] text-[#3F2E23] hover:bg-[#FFF8F0] shadow-sm font-semibold"
                                                    >
                                                        <Eye className="mr-2 h-4 w-4 text-[#D96C39]" /> Xem
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>
        </>
    );
};

export default ArtisanOrdersPage;