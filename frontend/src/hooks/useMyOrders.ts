"use client";

import { useState, useEffect, useCallback } from "react";
import useAxiosAuth from "@/hooks/useAxiosAuth";
import { RawOrderResponse } from "@/types/apiTypes";

const useMyOrders = () => {
    const axiosAuth = useAxiosAuth();
    const [orders, setOrders] = useState<RawOrderResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await axiosAuth.get<RawOrderResponse[]>("/orders/my-orders");
            setOrders(response.data);
            setError(null);
        } catch (err) {
            console.error("Lỗi tải đơn hàng:", err);
            setError("Không thể tải lịch sử đơn hàng.");
        } finally {
            setIsLoading(false);
        }
    }, [axiosAuth]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const cancelOrder = useCallback(async (orderId: number, note?: string) => {
        try {
            // Gửi note lên trong body (request.data)
            const res = await axiosAuth.put(`/orders/${orderId}/cancel/`, { note: note });

            // Update lại state local để UI phản ứng ngay lập tức
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
            return res.data;
        } catch (err: any) {
            throw new Error(err.response?.data?.message || 'Không thể hủy đơn hàng');
        }
    }, [axiosAuth]);

    return { orders, isLoading, error, cancelOrder, refetch: fetchOrders };
};

export default useMyOrders;