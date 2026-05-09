'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import Header from '@/components/common/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Store, Upload, X, Loader2, Send, MessageSquare } from 'lucide-react';
import type { Chat, ChatMessage, Artisan, User } from '@/types';
import type { RawChatDataResponse, RawChatMessage } from '@/types/apiTypes';
import { mapChatDetails, mapToChatMessage } from '@/utils/chatMapper';
import useAxiosAuth from '@/hooks/useAxiosAuth';
import { isProductOutOfStock } from "@/lib/inventory";
import { useCart } from '@/contexts/CartContext';
import { uploadToCloudinary } from '@/lib/cloudinary';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const normalizeChatImageUrl = (raw: string): string => {
    let s = raw.trim();
    const junkInPath =
        /^(https:\/\/res\.cloudinary\.com\/[^/]+\/)image\/upload\/(v\d+\/)?https:\/+res\.cloudinary\.com\/[^/]+\/(.+)$/.exec(s);
    if (junkInPath) {
        s = `${junkInPath[1]}image/upload/${junkInPath[2] || ''}${junkInPath[3]}`;
    }
    const dup = /^https?:\/\/[^/]+\/https:\/+(.+)$/.exec(s);
    if (dup) {
        s = `https://${dup[1].replace(/^\/+/, '')}`;
    }
    const dupFull = /^https?:\/\/[^/]+\/(https:\/\/res\.cloudinary\.com\/.+)$/.exec(s);
    if (dupFull) {
        s = dupFull[1];
    }
    if (s.startsWith('https:/') && !s.startsWith('https://')) {
        s = `https://${s.slice('https:/'.length).replace(/^\/+/, '')}`;
    }
    if (s.startsWith('http:/') && !s.startsWith('http://')) {
        s = `http://${s.slice('http:/'.length).replace(/^\/+/, '')}`;
    }
    return s;
};

const getFullImageUrl = (path: string | null | undefined) => {
    if (!path) return '';
    const normalized = normalizeChatImageUrl(String(path));
    if (normalized.startsWith('http')) return normalized;
    const normalizedPath = normalized.startsWith('/uploads/')
        ? normalized
        : `/uploads/${normalized.replace(/^\/+/, '')}`;
    return `${API_URL}${normalizedPath}`;
};

const formatCurrency = (amount: number | string | undefined) => {
    if (!amount) return 'Thỏa thuận';
    const num = Number(amount);
    if (isNaN(num)) return 'Thỏa thuận';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
};

export default function ChatPage() {
    const { data: session } = useSession();
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
    const wsRef = useRef<WebSocket | null>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
            } catch (error) {
                toast.error('Có lỗi xảy ra khi tải dữ liệu');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        loadChatData();
    }, [chatId, axiosAuth]);

    useEffect(() => {
        if (!chatId || !session?.user?.apiAccessToken) return;

        const token = session.user.apiAccessToken;
        const wsProtocol = API_URL.startsWith('https') ? 'wss' : 'ws';
        const wsUrl = `${wsProtocol}://${(API_URL.replace(/^https?:\/\//, '')).replace(/\/$/, '')}/ws/chat/${chatId}/?token=${token}`;

        let reconnectTimeout: NodeJS.Timeout | undefined;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
        };

        ws.onmessage = (ev) => {
            try {
                const rawMsg: RawChatMessage = JSON.parse(ev.data);
                const newMsg = mapToChatMessage(rawMsg, chatId);
                setMessages((prev) => {
                    const exists = prev.some(m => m.id === newMsg.id);
                    if (exists) return prev;
                    return [...prev, newMsg];
                });
                // Nếu nhận được báo giá thì đổi trạng thái sang ORDER_CREATED cho realtime[cite: 26]
                if (newMsg.type === 'ORDER_PROPOSAL') {
                    setChat(prev => prev ? { ...prev, status: 'ORDER_CREATED' } : prev);
                }
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            } catch (e) {
                console.error('[WS] Lỗi parse tin nhắn socket:', e);
            }
        };

        wsRef.current = ws;

        return () => {
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            try { ws.close(); } catch { }
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
        const sendToast = toast.loading('Đang gửi...');

        try {
            let imageUrl: string | null = null;

            if (selectedFile) {
                toast.loading('Đang tải ảnh lên...', { id: sendToast });
                imageUrl = await uploadToCloudinary(selectedFile, 'chat');
            }

            toast.loading('Đang gửi tin nhắn...', { id: sendToast });
            const payload = {
                message: messageText.trim(),
                image: imageUrl,
            };

            await axiosAuth.post(`/chat/${chatId}/send-message/`, payload);

            setMessageText('');
            removeImagePreview();
            toast.dismiss(sendToast);
        } catch (error) {
            const err = error as { message?: string };
            const errorMessage = err.message || 'Gửi tin nhắn thất bại. Vui lòng thử lại.';
            toast.error(errorMessage, { id: sendToast });
            console.error('Send message error:', error);
        } finally {
            setSending(false);
        }
    };

    const handleBuyNow = (e: React.MouseEvent, product: Record<string, any>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!product) return;

        const productToCheck = { ...product, stockQuantity: product.stockQuantity || 1 } as any;

        if (isProductOutOfStock(productToCheck)) {
            toast.error('Sản phẩm đã hết hàng');
            return;
        }

        buyNow({
            id: product.id as number,
            productName: (product.name as string) || 'Sản phẩm Custom',
            price: (product.price as number) || 0,
            image: (product.image as string) || '/tramhon-logo.png',
            stockQuantity: (product.stockQuantity as number) || 1,
            quantity: 1,
            chatId: chatId,
            artisanId: artisan?.id || undefined
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
        <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
            <div className="animate-pulse flex flex-col items-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#D96C39] mb-4" />
                <div className="text-[#6B4F3E] font-medium">Đang tải...</div>
            </div>
        </div>
    );

    if (!chat) return null;

    const hasReferenceImage = !!chat.referenceImage;

    return (
        <div className="min-h-screen font-sans text-gray-800 bg-[#FDFBF7] flex flex-col">
            <Header />

            <main className="flex-1 flex flex-col container mx-auto px-4 py-6 max-w-4xl h-[calc(100vh-140px)]">

                {/* -------------------- 1. THANH ĐIỀU HƯỚNG (STICKY) -------------------- */}
                {/* Tui thêm pt-2 để nó không dính sát mép trên và pb-6 để đẩy khối dưới xuống xa hơn */}
                <div className="sticky top-0 z-20 bg-[#FDFBF7] pt-2 pb-6 flex-shrink-0">
                    <div className="bg-white rounded-2xl border border-[#E8D5B5] p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                        {/* Nút quay lại và Thông tin nghệ nhân */}
                        <div className="flex items-start gap-4">
                            <Link href={`/custom-request/`} className="text-[#6B4F3E] hover:text-[#D96C39] transition-colors mt-2 p-1.5 bg-[#FFF8F0] rounded-full hover:bg-[#F7F1E8]">
                                <ArrowLeft size={20} />
                            </Link>

                            <div className="flex gap-4">
                                <div className="w-14 h-14 rounded-full bg-[#FFF8F0] border-2 border-[#D96C39] shadow-sm flex items-center justify-center text-xl font-bold text-[#D96C39] flex-shrink-0">
                                    {artisan?.name?.charAt(0).toUpperCase() || 'A'}
                                </div>
                                <div className="flex flex-col justify-center">
                                    <h1 className="text-xl font-bold text-[#3F2E23] flex items-center gap-2 mb-1">
                                        {artisan?.name || 'Nghệ nhân'}
                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-[#FFF8F0] border border-[#E8D5B5] text-[#D96C39] rounded-md tracking-wider uppercase">
                                            Gian hàng
                                        </span>
                                    </h1>
                                    <p className="text-sm font-medium text-[#6B4F3E] flex items-center gap-2">
                                        {chat.title}
                                        <span className="opacity-50">•</span>
                                        <span className="text-xs">ID Yêu cầu: #{chatId}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Nút Xem gian hàng */}
                        <div className="flex items-center self-start md:self-center ml-12 md:ml-0">
                            {artisan?.id && (
                                <Link href={`/shop/artisan/${artisan.id}`}>
                                    <Button variant="outline" className="h-10 rounded-full border-[#D96C39] text-[#D96C39] hover:bg-[#D96C39] hover:text-white transition-colors flex items-center gap-2 text-sm font-semibold px-5">
                                        <Store size={16} />
                                        Xem gian hàng
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* -------------------- 2. THÔNG TIN MÔ TẢ & NGÂN SÁCH (CỐ ĐỊNH) -------------------- */}
                {/* Tui thêm mt-2 để tạo thêm một lớp khoảng cách nữa, tổng cộng sẽ rất thoáng */}
                <div className="bg-white rounded-2xl border border-[#E8D5B5] p-5 shadow-sm mb-8 mt-2 flex-shrink-0">
                    <div className="flex flex-col md:flex-row gap-6">
                        {hasReferenceImage && (
                            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#E8D5B5] shadow-sm flex-shrink-0">
                                <Image
                                    src={getFullImageUrl(chat.referenceImage)}
                                    alt="Reference Image"
                                    fill
                                    className="object-cover cursor-pointer hover:scale-105 transition-transform"
                                    onClick={() => window.open(getFullImageUrl(chat.referenceImage), '_blank')}
                                />
                            </div>
                        )}
                        <div className="flex-1">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B4F3E] mb-1">Mô tả yêu cầu</h3>
                            <p className="text-sm text-[#3F2E23] leading-relaxed line-clamp-2 hover:line-clamp-none transition-all">
                                {chat.description || "Không có chi tiết."}
                            </p>
                        </div>
                        <div className="md:border-l border-[#E8D5B5] md:pl-6 flex-shrink-0">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B4F3E] mb-1">Ngân sách dự kiến</h3>
                            <p className="text-lg font-extrabold text-[#D96C39]">{formatCurrency(chat.budget)}</p>
                        </div>
                    </div>
                </div>

                {/* List Tin Nhắn */}
                <div className="flex-1 overflow-y-auto space-y-5 mb-4 px-2 custom-scrollbar">
                    {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-[#6B4F3E] flex-col opacity-60">
                            <MessageSquare size={48} className="mb-4 text-[#E8D5B5]" />
                            <p className="font-medium">Chưa có tin nhắn nào. Hãy bắt đầu thương lượng!</p>
                        </div>
                    ) : (

                        messages.map((message) => {
                            const isCustomer = message.senderType === 'CUSTOMER';
                            const isMe = isCustomer && message.senderId === currentUser?.id;

                            if (message.type === 'ORDER_PROPOSAL') {
                                // Đã thay 'any' bằng Record<string, any>
                                let proposalData: Record<string, any> | null = null;
                                const safeParseJSON = (str: string) => {
                                    if (typeof str === 'object' && str !== null) return str;
                                    if (!str) return {};
                                    let cleaned = str.trim();
                                    if (!cleaned.startsWith('{')) cleaned = `{${cleaned}}`;
                                    try { return JSON.parse(cleaned); }
                                    catch {
                                        try {
                                            const fixedJSON = cleaned.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":');
                                            return JSON.parse(fixedJSON);
                                        } catch { return null; }
                                    }
                                };

                                proposalData = safeParseJSON(message.content);

                                return (
                                    <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in zoom-in-95 duration-200 mb-6`}>
                                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[70%] lg:max-w-[50%]`}>
                                            {!isMe && (
                                                <div className="flex items-center gap-2 mb-2 ml-1">
                                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 bg-[#FFF8F0] text-[#D96C39] border border-[#D96C39]">
                                                        {artisan?.name?.charAt(0).toUpperCase() || 'A'}
                                                    </div>
                                                    <span className="text-xs font-bold text-[#6B4F3E]">{artisan?.name}</span>
                                                </div>
                                            )}

                                            <div className="bg-white border border-[#E8D5B5] rounded-2xl overflow-hidden shadow-md w-full relative">
                                                {/* Header Proposal */}
                                                <div className="bg-gradient-to-r from-[#D96C39] to-orange-500 px-5 py-3 flex items-center justify-between">
                                                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                                        <Store size={14} />
                                                        Gian hàng gửi báo giá
                                                    </span>
                                                </div>

                                                <div className="p-5">
                                                    <div className="flex gap-4 items-center mb-4 pb-4 border-b border-gray-100">
                                                        {proposalData?.image ? (
                                                            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#E8D5B5] flex-shrink-0 bg-[#F7F1E8] shadow-sm">
                                                                <Image
                                                                    src={getFullImageUrl(proposalData.image)}
                                                                    alt="Product"
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-20 h-20 rounded-xl border border-[#E8D5B5] flex-shrink-0 bg-[#F7F1E8] flex items-center justify-center shadow-sm">
                                                                <Store className="text-[#E8D5B5]" size={32} />
                                                            </div>
                                                        )}

                                                        <div className="flex flex-col justify-center">
                                                            <h4 className="font-bold text-[#3F2E23] text-base line-clamp-2 leading-tight">
                                                                {proposalData?.name || "Sản phẩm thủ công theo yêu cầu"}
                                                            </h4>
                                                            <div className="text-[#D96C39] font-extrabold text-xl mt-2">
                                                                {formatCurrency(proposalData?.price || 0)}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {proposalData?.description && (
                                                        <div className="bg-[#FFF8F0] p-3 rounded-lg border border-[#E8D5B5]/50 mb-4">
                                                            {/* Đã sửa lỗi Unescaped entities */}
                                                            <p className="text-xs text-[#6B4F3E] italic line-clamp-3">
                                                                &quot;{proposalData.description}&quot;
                                                            </p>
                                                        </div>
                                                    )}

                                                    {!isChatClosed && (
                                                        <Button
                                                            className="w-full bg-[#3F2E23] hover:bg-black text-white font-bold py-6 rounded-xl transition-all shadow-sm hover:shadow-md"
                                                            onClick={(e) => handleBuyNow(e, proposalData as Record<string, any>)}
                                                        >
                                                            Thanh toán ngay để chốt đơn
                                                        </Button>
                                                    )}

                                                    {isChatClosed && (
                                                        <div className="text-center text-xs font-bold text-green-600 bg-green-50 py-2 rounded-lg border border-green-100">
                                                            Bạn đã thanh toán thành công!
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <span className="text-[10px] text-gray-400 mt-2 px-2 font-medium">
                                                {new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                                                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in zoom-in-95 duration-200 mb-2`}>
                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>

                                        {!isMe && (
                                            <div className="flex items-center gap-2 mb-1.5 ml-1">
                                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 bg-[#FFF8F0] text-[#D96C39] border border-[#D96C39]">
                                                    {artisan?.name?.charAt(0).toUpperCase() || 'A'}
                                                </div>
                                                <span className="text-[11px] font-bold text-[#6B4F3E]">{artisan?.name}</span>
                                            </div>
                                        )}

                                        <div
                                            className={`rounded-2xl px-5 py-3 shadow-sm text-sm ${isMe ? 'bg-[#3F2E23] text-white rounded-br-sm' : 'bg-white border border-[#E8D5B5] text-[#3F2E23] rounded-bl-sm'}`}>
                                            {message.isImage ? (
                                                <div className="relative w-full min-w-[200px] h-52 rounded-xl overflow-hidden border border-black/10">
                                                    <Image src={getFullImageUrl(message.content)}
                                                        alt="Message image" fill className="object-cover cursor-pointer hover:scale-105 transition-transform"
                                                        onClick={() => window.open(getFullImageUrl(message.content), '_blank')} />
                                                </div>
                                            ) : (
                                                <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-gray-400 mt-1 px-1 font-medium">
                                            {new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })

                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t border-[#E8D5B5] pt-4 flex-shrink-0 bg-[#FDFBF7]">
                    {isChatClosed ? (
                        <div className="bg-[#FFF8F0] border border-[#E8D5B5] rounded-xl p-4 text-center text-[#D96C39] text-sm font-bold flex items-center justify-center gap-2">
                            <X size={18} /> Đơn hàng này đã được xác nhận.
                        </div>
                    ) : (
                        <div className="bg-white p-2 rounded-2xl border border-[#E8D5B5] shadow-sm">
                            {imagePreview && (
                                <div className="relative mb-3 inline-block ml-2 mt-2">
                                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-[#D96C39] shadow-sm">
                                        <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                                    </div>
                                    <button onClick={removeImagePreview}
                                        className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full p-1 w-6 h-6 flex items-center justify-center hover:bg-red-50 border border-red-100 shadow-sm transition-colors">
                                        <X size={14} />
                                    </button>
                                </div>
                            )}

                            <div className="flex gap-2 items-end">
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" disabled={sending} />
                                <Button type="button" variant="ghost" size="icon"
                                    onClick={() => fileInputRef.current?.click()} disabled={sending}
                                    className="rounded-xl shrink-0 h-12 w-12 text-[#6B4F3E] hover:bg-[#FFF8F0] hover:text-[#D96C39]">
                                    <Upload size={22} />
                                </Button>

                                <div className="flex-1 relative">
                                    <Input type="text" value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)} onKeyPress={handleKeyPress}
                                        placeholder="Nhắn tin cho gian hàng..." disabled={sending}
                                        className="rounded-xl h-12 border-none bg-gray-50 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 text-[#3F2E23] placeholder:text-gray-400 font-medium" />
                                </div>

                                <Button type="button" onClick={handleSendMessage}
                                    disabled={sending || (!messageText.trim() && !imagePreview)}
                                    className="bg-[#D96C39] text-white hover:bg-[#C25B2D] rounded-xl h-12 w-12 p-0 shrink-0 shadow-sm transition-colors">
                                    {sending ? <Loader2 className="animate-spin h-5 w-5" /> : <Send size={20} className="ml-1" />}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}