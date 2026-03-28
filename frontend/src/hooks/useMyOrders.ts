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

    const cancelOrder = async (orderId: number) => {
        try {
            await axiosAuth.put(`/orders/${orderId}/cancel/`);

            setOrders((prev) =>
                prev.map((order) =>
                    order.id === orderId ? { ...order, status: "CANCELLED" } : order
                )
            );
            return true;
        } catch (err: any) {
            const message = err?.response?.data?.message || "Lỗi khi hủy đơn hàng";
            throw new Error(message);
        }
    };

    return { orders, isLoading, error, cancelOrder, refetch: fetchOrders };
};

export default useMyOrders;