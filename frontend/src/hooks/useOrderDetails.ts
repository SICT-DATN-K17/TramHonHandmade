'use client';

import { useState, useEffect, useCallback } from "react";
import useAxiosAuth from "@/hooks/useAxiosAuth";
import { RawOrderDetail } from "@/types/apiTypes";


// --- Main Hook ---
const useOrderDetails = (orderId: string | number) => {
    const axiosAuth = useAxiosAuth(); // Sử dụng instance axios đã có token
    const [order, setOrder] = useState<RawOrderDetail | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Hàm lấy chi tiết đơn hàng
    const fetchOrder = useCallback(async () => {
        if (!orderId) return;

        setIsLoading(true);
        setError(null);

        try {
            // Gọi API: GET /orders/{id}
            const response = await axiosAuth.get<RawOrderDetail>(`/orders/${orderId}`);
            setOrder(response.data);
        } catch (err: any) {
            console.error("Lỗi tải đơn hàng:", err);
            // Lấy message từ server hoặc fallback text
            const msg = err.response?.data?.message || "Không thể tải thông tin đơn hàng.";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [orderId, axiosAuth]);

    // Hàm hủy đơn hàng
    const cancelOrderApi = async () => {
        try {
            // Gọi API: PUT /orders/{id}/cancel
            // (Tuỳ backend của bạn là PUT hay POST/PATCH)
            await axiosAuth.put(`/orders/${orderId}/cancel`);

            // Sau khi hủy thành công, reload lại dữ liệu để cập nhật status mới
            await fetchOrder();
            return true;
        } catch (err: any) {
            const msg = err.response?.data?.message || "Lỗi khi hủy đơn hàng";
            throw new Error(msg); // Ném lỗi ra để component hiển thị Toast
        }
    };

    // Tự động gọi API khi component mount hoặc orderId đổi
    useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);

    return {
        order,
        isLoading,
        error,
        cancelOrderApi,
        refetch: fetchOrder // Export thêm hàm này nếu muốn nút "Reload" thủ công
    };
};

export default useOrderDetails;