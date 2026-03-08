'use client';

import {useState, useEffect, useRef, useCallback} from 'react';
import {useParams, useRouter} from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {toast} from 'react-hot-toast';
import {useSession} from 'next-auth/react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Client} from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type {Chat, ChatMessage, Artisan, User} from '@/types';
import type {RawChatDataResponse, RawChatMessage} from '@/types/apiTypes';
import {mapChatDetails, mapToChatMessage} from '@/utils/chatMapper';
import useAxiosAuth from '@/hooks/useAxiosAuth';
import {ProductWithCategory} from "@/utils/ProductMapper";
import {isProductOutOfStock} from "@/lib/inventory";
import { useCart } from '@/contexts/CartContext';

const API_URL = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// Helper function để lấy full URL
const getFullImageUrl = (path: string | null | undefined) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    // Prepend /uploads/ if path doesn't have it (for media files from backend)
    const normalizedPath = path.startsWith('/uploads/') ? path : `/uploads/${path}`;
    return `${API_URL}${normalizedPath}`;
};

// Helper format tiền tệ
const formatCurrency = (amount: number | string | undefined) => {
    if (!amount) return 'Thỏa thuận';
    const num = Number(amount);
    if (isNaN(num)) return 'Thỏa thuận';
    return new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(num);
};

export default function ChatPage() {
    const {data: session} = useSession();
    const axiosAuth = useAxiosAuth();
    const params = useParams();
    const router = useRouter();
    const { buyNow } = useCart();
    const chatId = Array.isArray(params.chatId) ? Number(params.chatId[0]) : Number(params.chatId);

    const [chat, setChat] = useState<Chat | null>(null);
    const [artisan, setArtisan] = useState<Artisan | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [messageText, setMessageText] = useState('');

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const stompClientRef = useRef<Client | null>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    useEffect(() => {
        if (!chatId || Number.isNaN(chatId)) {
            toast.error('ID cuộc trò chuyện không hợp lệ');
            setLoading(false);
            return;
        }

        const loadChatData = async () => {
            try {
                const rawData = await axiosAuth.get<RawChatDataResponse>(`/chat/${chatId}/`);
                const mappedData = mapChatDetails(rawData.data);
                setChat(mappedData.chat);
                setMessages(mappedData.messages);
                setArtisan(mappedData.artisan);
                setCurrentUser(mappedData.customer);

                console.log( mappedData)
            } catch (error) {
                toast.error('Có lỗi xảy ra khi tải dữ liệu');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        loadChatData();
    }, [chatId]);

    useEffect(() => {
        if (!chatId) {
            console.log('[WS] Skipping: no chatId');
            return;
        }
        
        if (!session?.user?.apiAccessToken) {
            console.log('[WS] Skipping: no token yet');
            return;
        }

        // Use native WebSocket to connect directly to ASGI consumer
        const token = session.user.apiAccessToken;
        const wsProtocol = API_URL.startsWith('https') ? 'wss' : 'ws';
        const wsUrl = `${wsProtocol}://${(API_URL.replace(/^https?:\/\//, '')).replace(/\/$/, '')}/ws/chat/${chatId}/?token=${token}`;
        
        console.log('[WS] Attempting to connect to', wsUrl);
        let reconnectTimeout: NodeJS.Timeout;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('[WS] Customer WebSocket connected');
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
        };

        ws.onmessage = (ev) => {
            console.log('[WS] Message received. Raw data:', ev.data);
            try {
                const rawMsg: RawChatMessage = JSON.parse(ev.data);
                console.log('[WS] Parsed message:', rawMsg);
                const newMsg = mapToChatMessage(rawMsg, chatId);
                console.log('[WS] Mapped message:', newMsg);
                setMessages((prev) => {
                    const exists = prev.some(m => m.id === newMsg.id);
                    console.log(`[WS] Checking dedup: message id=${newMsg.id}, exists=${exists}`);
                    if (exists) {
                        console.log('[WS] Message already exists, skipping');
                        return prev;
                    }
                    console.log('[WS] Adding new message to state');
                    return [...prev, newMsg];
                });
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
                }, 100);
            } catch (e) {
                console.error('[WS] Lỗi parse tin nhắn socket:', e, 'Raw:', ev.data);
            }
        };
        
        ws.onclose = () => {
            console.log('[WS] Customer WebSocket closed');
        };

        stompClientRef.current = ws as any;

        return () => {
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            try { ws.close(); } catch(e) {}
        };
    }, [chatId, session?.user?.apiAccessToken]);


    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file hình ảnh');
            return;
        }
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const removeImagePreview = () => {
        setImagePreview(null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSendMessage = async () => {
        if ((!messageText.trim() && !selectedFile) || !chat || !currentUser) return;
        setSending(true);
        try {
            const formData = new FormData();
            // Backend derives sender and chat from authenticated user and URL, only send expected keys
            formData.append('message', messageText.trim());
            if (selectedFile) formData.append('image', selectedFile);

            const resp = await axiosAuth.post(`/chat/${chatId}/send-message/`, formData);
            // WebSocket will deliver the message via onmessage handler
            // No need for optimistic update, it causes duplicate key errors
            setMessageText('');
            removeImagePreview();
        } catch (error) {
            toast.error('Gửi tin nhắn thất bại');
            console.error(error);
        } finally {
            setSending(false);
        }
    };

    const handleBuyNow = (e: React.MouseEvent, product: ProductWithCategory) => {
        e.preventDefault();
        e.stopPropagation();

        console.log(product);

        if (isProductOutOfStock(product)) {
            toast.error('Sản phẩm đã hết hàng');
            return;
        }


        buyNow({
            id: product.id,
            productName: product.name,
            price: product.price,
            image: product.image || '/tramhon-logo.png',
            stockQuantity: product.stock_quantity,
            quantity: 1,
            chatId: chatId
        });

        router.push('/checkout');
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const isChatClosed = chat?.status === 'CLOSED';

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-4 w-4 bg-gray-300 rounded-full mb-2"></div>
                <div>Đang tải...</div>
            </div>
        </div>
    );

    if (!chat) return null;

    // @ts-ignore: Giả sử Chat type có trường reference_image
    const hasReferenceImage = !!chat.reference_image;

    return (
        <div className="min-h-screen font-sans text-gray-800 bg-white flex flex-col">
            <Header/>

            <main className="flex-1 flex flex-col container mx-auto px-4 py-6 max-w-4xl h-[calc(100vh-140px)]">

                {/* -------------------- HEADER CHAT -------------------- */}
                <div className="bg-white border-b border-gray-200 pb-4 mb-4 flex-shrink-0">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                            <Link href={`/custom-request/`} className="text-gray-600 hover:text-[#0f172a] mt-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                                     viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                                </svg>
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold flex flex-wrap items-center gap-2 text-[#0f172a]">
                                    {chat.title}
                                    <span
                                        className="text-xs font-normal px-2 py-0.5 bg-gray-100 rounded-full text-gray-500 border border-gray-200">
                                        ID: {chatId}
                                    </span>
                                </h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <div
                                        className={`w-2 h-2 rounded-full ${isChatClosed ? 'bg-gray-400' : 'bg-green-500 animate-pulse'}`}/>
                                    <span className="text-sm font-medium text-gray-600">
                                        {isChatClosed ? 'Đã đóng' : 'Đang hoạt động'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm shadow-sm">
                        <div className="flex flex-col md:flex-row gap-6">

                            {/* --- CỘT 1: ẢNH THAM KHẢO --- */}
                            {/* FIX: Set độ rộng cố định (md:w-64) và bỏ md:h-full để tránh tràn */}
                            {hasReferenceImage && (
                                <div className="md:w-64 flex-shrink-0">
                                    <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500"
                                             fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                        </svg>
                                        Ảnh tham khảo:
                                    </h3>
                                    {/* FIX: Dùng aspect-video hoặc set height cụ thể (h-40 md:h-44) */}
                                    <div
                                        className="relative w-full h-40 md:h-44 rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm group">
                                        {/* @ts-ignore */}
                                        <Image
                                            src={getFullImageUrl(chat.reference_image)}
                                            alt="Reference Image"
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                                            onClick={() => window.open(getFullImageUrl(chat.reference_image), '_blank')}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* --- CỘT 2: MÔ TẢ & NGÂN SÁCH --- */}
                            <div
                                className={`flex-1 flex flex-col justify-between gap-4 ${hasReferenceImage ? 'md:border-l md:border-gray-200 md:pl-6' : ''}`}>
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-1 flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500"
                                             fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M4 6h16M4 12h16M4 18h7"/>
                                        </svg>
                                        Mô tả yêu cầu:
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap line-clamp-4 hover:line-clamp-none transition-all">
                                        {chat.description || "Không có mô tả chi tiết."}
                                    </p>
                                </div>

                                <div
                                    className="flex items-center justify-between md:justify-end border-t pt-3 md:border-t-0 md:pt-0">
                                    <h3 className="font-semibold text-gray-700 flex items-center gap-1 mr-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500"
                                             fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                        </svg>
                                        <span className="md:hidden">Ngân sách:</span>
                                        <span className="hidden md:inline">Ngân sách mong muốn:</span>
                                    </h3>
                                    <div
                                        className="text-base font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg border border-green-100">
                                        {/* @ts-ignore */}
                                        {formatCurrency(chat.budget)}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
                {/* -------------------- END HEADER CHAT -------------------- */}

                {/* List Tin Nhắn */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 px-2 custom-scrollbar">
                    {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-gray-400 flex-col">
                            <p>Chưa có tin nhắn nào. Hãy bắt đầu!</p>
                        </div>
                    ) : (

                        messages.map((message) => {
                            const isCustomer = message.sender_type === 'CUSTOMER';
                            const isMe = isCustomer && message.sender_id === currentUser?.id;

                            // Logic xử lý riêng cho ORDER_PROPOSAL
                            if (message.type === 'ORDER_PROPOSAL') {
                                let proposalData = null;
                                try {
                                    proposalData = JSON.parse(message.content);
                                } catch (e) {
                                    console.error("Lỗi parse proposal data", e);
                                }

                                return (
                                    <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in zoom-in-95 duration-200 mb-4`}>
                                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[60%]`}>
                                            <div className="bg-white border-2 border-yellow-400 rounded-xl overflow-hidden shadow-md">
                                                {/* Header của thẻ đề xuất */}
                                                <div className="bg-yellow-50 px-4 py-2 border-b border-yellow-200 flex items-center justify-between">
                        <span className="text-xs font-bold text-yellow-800 uppercase tracking-wider flex items-center gap-1">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
                                  viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                       d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                             </svg>
                             Đề xuất đơn hàng
                        </span>
                                                </div>

                                                {/* Nội dung đơn hàng */}
                                                <div className="p-4">
                                                    <div className="flex gap-4">
                                                        {/* Ảnh sản phẩm (nếu có) */}
                                                        {proposalData?.image && (
                                                            <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-100">
                                                                <Image
                                                                    src={getFullImageUrl(proposalData.image)}
                                                                    alt="Product"
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            </div>
                                                        )}

                                                        <div className="flex flex-col justify-between">
                                                            <div>
                                                                <h4 className="font-semibold text-gray-800 text-sm line-clamp-2">
                                                                    {proposalData?.productName || "Sản phẩm thủ công theo yêu cầu"}
                                                                </h4>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    Mô tả: {proposalData?.description || "N/A"}
                                                                </p>
                                                            </div>
                                                            <div className="text-red-600 font-bold text-lg mt-1">
                                                                {formatCurrency(proposalData?.price || 0)}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* --- SỬA ĐỔI TẠI ĐÂY: Chỉ hiện nút khi chat chưa đóng --- */}
                                                    {!isChatClosed && (
                                                        <div className="mt-4 pt-3 border-t border-gray-100">
                                                            <Button
                                                                className="w-full bg-[#0f172a] hover:bg-slate-800 text-white font-medium py-2 rounded-lg transition-all shadow-sm hover:shadow active:scale-95"
                                                                onClick={(e) => handleBuyNow(e, proposalData)}
                                                            >
                                                                Thanh toán ngay
                                                            </Button>
                                                        </div>
                                                    )}

                                                    {/* (Optional) Có thể hiện thông báo thay thế nếu muốn */}
                                                    {isChatClosed && (
                                                        <div className="mt-4 pt-3 border-t border-gray-100 text-center text-xs text-gray-500 italic">
                                                            Đơn hàng đã được xử lý hoặc hủy bỏ
                                                        </div>
                                                    )}
                                                    {/* -------------------------------------------------------- */}

                                                </div>
                                            </div>

                                            <span className="text-[10px] text-gray-400 mt-1 px-1">
                    {new Date(message.created_at).toLocaleTimeString('vi-VN', {
                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                </span>
                                        </div>
                                    </div>
                                );
                            }

                            // Logic cũ cho tin nhắn thường và ảnh
                            return (
                                <div key={message.id}
                                     className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in zoom-in-95 duration-200`}>
                                    {/* ... (Giữ nguyên code hiển thị tin nhắn Text/Image cũ của bạn ở đây) ... */}
                                    <div
                                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                                        <div
                                            className={`rounded-2xl px-4 py-2 shadow-sm ${isMe ? 'bg-[#0f172a] text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                                            {message.is_image ? (
                                                <div
                                                    className="relative w-full min-w-[200px] h-48 rounded-lg overflow-hidden mb-2 bg-gray-300">
                                                    <Image src={getFullImageUrl(message.content)}
                                                           alt="Message image" fill className="object-cover"
                                                           onClick={() => window.open(getFullImageUrl(message.content), '_blank')}/>
                                                </div>
                                            ) : (
                                                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-gray-400 mt-1 px-1">
                    {new Date(message.created_at).toLocaleTimeString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </span>
                                    </div>
                                </div>
                            );
                        })

                    )}
                    <div ref={messagesEndRef}/>
                </div>

                {/* Input Area */}
                <div className="border-t border-gray-200 pt-4 bg-white flex-shrink-0">
                    {isChatClosed ? (
                        <div
                            className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500 text-sm">Cuộc
                            trò chuyện này đã kết thúc.</div>
                    ) : (
                        <>
                            {imagePreview && (
                                <div className="relative mb-2 inline-block">
                                    <div
                                        className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                                        <Image src={imagePreview} alt="Preview" fill className="object-cover"/>
                                    </div>
                                    <button onClick={removeImagePreview}
                                            className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center hover:bg-red-500 text-xs shadow-sm">✕
                                    </button>
                                </div>
                            )}
                            <div className="flex gap-2 items-end">
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect}
                                       className="hidden" disabled={sending}/>
                                <Button type="button" variant="outline" size="icon"
                                        onClick={() => fileInputRef.current?.click()} disabled={sending}
                                        className="rounded-full shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500"
                                         fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                    </svg>
                                </Button>
                                <div className="flex-1 relative">
                                    <Input type="text" value={messageText}
                                           onChange={(e) => setMessageText(e.target.value)} onKeyPress={handleKeyPress}
                                           placeholder="Nhập tin nhắn..." disabled={sending}
                                           className="rounded-full pr-10 focus-visible:ring-slate-900"/>
                                </div>
                                <Button type="button" onClick={handleSendMessage}
                                        disabled={sending || (!messageText.trim() && !imagePreview)}
                                        className="bg-[#0f172a] text-white hover:bg-slate-800 rounded-full w-10 h-10 p-0 shrink-0">
                                    {sending ? <div
                                            className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"/> :
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-0.5"
                                             viewBox="0 0 20 20" fill="currentColor">
                                            <path
                                                d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                                        </svg>}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </main>
            <Footer/>
        </div>
    );
}