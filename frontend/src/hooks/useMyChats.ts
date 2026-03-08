"use client";
import { useState, useEffect } from "react";
import useAxiosAuth from "@/hooks/useAxiosAuth";
import { RawChatDataResponse } from "@/types/apiTypes";
import { mapChatDetails } from "@/utils/chatMapper";

export default function useMyChats() {
    const [chatDataDetails, setChats] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const axiosAuth = useAxiosAuth();

    const fetchChats = async () => {
        try {
            setIsLoading(true);
            const response = await axiosAuth.get<RawChatDataResponse[]>("/chat/my-chats");
            const mappedData = response.data.map(mapChatDetails);
            console.log(">>> Chats data:", mappedData);
            setChats(mappedData);
        } catch (err: any) {
            setError(err.response?.data?.message || "Không thể tải danh sách chat");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchChats();
    }, []);

    return { chatDataDetails: chatDataDetails, isLoading, error, refresh: fetchChats };
}