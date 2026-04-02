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
import { Eye, Loader2, FileText } from 'lucide-react';
import {
    type StoredOrder,
    type StoredOrderStatus,
} from '@/lib/ordersStorage';
import type { PaymentMethod } from '@/types';
import useAxiosAuth from '@/hooks/useAxiosAuth';
import { mapFrontendToBackendStatus, mapBackendToFrontendStatus } from '@/utils/orderStatusMapper';
import toast, { Toaster } from 'react-hot-toast';
import type { RawArtisanOrderList } from '@/types/apiTypes';

const statusConfig: Partial<Record<
    StoredOrderStatus,
    { label: string; badgeClass: string; description: string }
>> = {
    pending: {
        label: 'Chờ xử lý',
        badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        description: 'Đơn hàng mới, chờ xác nhận',
    },
    processing: {
        label: 'Đang xử lý',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
        description: 'Đang đóng gói / chuẩn bị giao',
    },
    delivered: {
        label: 'Đã giao',
        badgeClass: 'bg-green-100 text-green-800 border-green-200',
        description: 'Giao hàng thành công',
    },
    cancelled: {
        label: 'Đã hủy',
        badgeClass: 'bg-red-100 text-red-800 border-red-200',
        description: 'Đơn hàng đã bị hủy',
    },
    confirmed: {
        label: 'Đã xác nhận',
        badgeClass: 'bg-blue-100 text-blue-700 border-transparent',
        description: 'Đã xác nhận, chuẩn bị xử lý',
    },
    shipped: {
        label: 'Đã giao cho DVVC',
        badgeClass: 'bg-purple-100 text-purple-700 border-transparent',
        description: 'Đang vận chuyển',
    },
};

const paymentLabels: Record<PaymentMethod, string> = {
    cod: 'Thanh toán khi nhận hàng (COD)',
    bank_transfer: 'Chuyển khoản ngân hàng',
    credit_card: 'Thẻ tín dụng/Ghi nợ',
};

const formatCurrency = (value: number) => `₫${value.toLocaleString('vi-VN')}`;

const mapArtisanOrderToStoredOrder = (rawOrder: RawArtisanOrderList): StoredOrder => {
    const mapBackendPaymentMethodToFrontend = (backendMethod: string): PaymentMethod => {
        switch (backendMethod) {
            case 'COD':
                return 'cod';
            case 'ONLINE':
                return 'bank_transfer';
            default:
                return 'cod';
        }
    };

    const normalizeStatus = (status: StoredOrderStatus): StoredOrderStatus => {
        if (status === 'confirmed') return 'pending';
        if (status === 'shipped') return 'processing';
        return status;
    };

    return {
        id: rawOrder.id,
        orderNumber: rawOrder.orderNumber,
        customerName: rawOrder.customerName,
        phone: rawOrder.phone,
        status: normalizeStatus(mapBackendToFrontendStatus(rawOrder.status)),
        createdAt: rawOrder.createdAt,
        subtotal: Number(rawOrder.subtotal),
        shippingFee: Number(rawOrder.shippingFee || 0),
        total: Number(rawOrder.total),
        paymentMethod: mapBackendPaymentMethodToFrontend(rawOrder.paymentMethod),
        shippingAddress: {
            fullName: rawOrder.customerName,
            phone: rawOrder.phone,
            email: '',
            address: rawOrder.shippingAddress,
            note: rawOrder.note || undefined, 
        },
        items: rawOrder.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: Number(item.price),
            image: item.image || undefined,
        })),
    };
};

const ArtisanOrdersPage = () => {
    const [orders, setOrders] = useState<StoredOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const axiosAuth = useAxiosAuth();

    const fetchOrders = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await axiosAuth.get<RawArtisanOrderList[]>('/orders/artisan/all');
            const mappedOrders = response.data.map(mapArtisanOrderToStoredOrder);
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

    const totalRevenue = useMemo(
        () => orders
            .filter(order => order.status !== 'cancelled')
            .reduce((sum, order) => sum + order.total, 0),
        [orders]
    );

    const handleStatusChange = async (orderId: number, status: StoredOrderStatus) => {
        try {
            const backendStatus = mapFrontendToBackendStatus(status);

            await axiosAuth.put(`/orders/${orderId}/status/`, null, {
                params: {
                    status: backendStatus
                }
            });

            await fetchOrders();
            toast.success('Cập nhật trạng thái đơn hàng thành công');
            
        } catch (error: unknown) {
            console.error('Error updating order status:', error);
            const err = error as any;
            const msg = err.response?.data?.message || err.message || 'Không thể cập nhật trạng thái';
            toast.error(msg);
        }
    };

    const renderEmptyState = () => (
        <div className="rounded-lg border border-dashed border-[#E8D5B5] bg-white p-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-[#FFF8F0] rounded-full flex items-center justify-center text-[#D96C39] mb-4">
                <FileText size={28} />
            </div>
            <p className="text-lg font-semibold" style={{ color: '#3F2E23' }}>
                Chưa có đơn hàng nào
            </p>
            <p className="mt-2 text-sm" style={{ color: '#6B4F3E' }}>
                Khi có đơn mới, hệ thống sẽ lưu vào đây tự động.
            </p>
        </div>
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
                        Xem, cập nhật trạng thái và chi tiết đơn hàng.
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
                            {orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length}
                        </p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[#E8D5B5] bg-white shadow-sm">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20 flex-col gap-3" style={{ color: '#6B4F3E' }}>
                            <Loader2 className="h-8 w-8 animate-spin text-[#D96C39]" />
                            <span className="font-medium">Đang tải dữ liệu đơn hàng...</span>
                        </div>
                    ) : orders.length === 0 ? (
                        renderEmptyState()
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
                                {orders.map((order) => (
                                    <TableRow key={order.id} className="border-[#E8D5B5] hover:bg-gray-50/50">
                                        <TableCell className="font-black text-[#D96C39]">{order.orderNumber}</TableCell>
                                        <TableCell className="font-medium text-[#3F2E23]">{order.customerName}</TableCell>
                                        <TableCell className="text-[#6B4F3E]">{order.phone}</TableCell>
                                        <TableCell className="font-bold text-[#3F2E23]">{formatCurrency(order.total)}</TableCell>
                                        <TableCell className="text-xs font-medium text-[#6B4F3E]">{paymentLabels[order.paymentMethod]}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`${statusConfig[order.status]?.badgeClass} border shadow-sm px-2.5 py-0.5 font-bold`}>
                                                {statusConfig[order.status]?.label || order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-[#6B4F3E] text-sm">
                                            {new Date(order.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                                                <div className="flex items-center gap-2">
                                                    <Link href={`/artisan/orders/${order.id}`}>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-[#E8D5B5] text-[#3F2E23] hover:bg-[#FFF8F0] shadow-sm font-semibold"
                                                        >
                                                            <Eye className="mr-2 h-4 w-4 text-[#D96C39]" /> Xem
                                                        </Button>
                                                    </Link>
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => handleStatusChange(order.id, e.target.value as StoredOrderStatus)}
                                                        className="rounded-md border border-[#E8D5B5] bg-white px-3 py-1.5 text-sm font-medium text-[#3F2E23] shadow-sm focus:ring-[#D96C39] focus:border-[#D96C39] cursor-pointer"
                                                        disabled={order.status === 'cancelled' || order.status === 'delivered'}
                                                    >
                                                        {(['pending', 'processing', 'delivered', 'cancelled'] as StoredOrderStatus[]).map((status) => (
                                                            <option key={status} value={status}>
                                                                {statusConfig[status]?.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>
        </>
    );
};

export default ArtisanOrdersPage;