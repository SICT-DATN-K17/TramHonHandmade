// frontend/src/hooks/useAllChats.ts
"use client";
import { useState, useEffect } from "react";
import useAxiosAuth from "@/hooks/useAxiosAuth";
import { RawChatDataResponse } from "@/types/apiTypes";
import { mapChatDetails } from "@/utils/chatMapper";

export default function useAllChats() {
    const [chatDataDetails, setChats] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const axiosAuth = useAxiosAuth();

    const fetchAllChats = async () => {
        try {
            setIsLoading(true);
            // Gọi endpoint lấy tất cả chat
            const response = await axiosAuth.get<RawChatDataResponse[]>("/chat/");
            const mappedData = response.data.map(mapChatDetails);
            setChats(mappedData);
            console.log(">>> All chats data:", mappedData);
        } catch (err: any) {
            setError(err.response?.data?.message || "Không thể tải danh sách chat hệ thống");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllChats();
    }, []);

    return { chatDataDetails, isLoading, error, refresh: fetchAllChats };
}