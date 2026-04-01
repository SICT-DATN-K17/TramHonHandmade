'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import {
    ArrowLeft,
    Send,
    Image as ImageIcon,
    X,
    Loader2,
    User,
    MapPin,
    Mail,
    FileText,
    DollarSign,
    Calendar
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import type { Chat, ChatMessage, User as UserType } from '@/types';
import type { RawChatDataResponse, RawChatMessage } from '@/types/apiTypes';
import { mapChatDetails, mapToChatMessage } from '@/utils/chatMapper';
import useAxiosAuth from '@/hooks/useAxiosAuth';
import { uploadToCloudinary } from '@/lib/cloudinary'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// --- HELPER FUNCTIONS ---
const getFullImageUrl = (path: string | null | undefined) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    let normalizedPath = path;
    if (!normalizedPath.startsWith('/')) {
        normalizedPath = '/' + normalizedPath;
    }
    if (normalizedPath.startsWith('/uploads/uploads/')) {
        normalizedPath = normalizedPath.replace('/uploads/uploads/', '/uploads/');
    } else if (!normalizedPath.startsWith('/uploads/')) {
        normalizedPath = '/uploads' + normalizedPath;
    }
    return `${API_URL}${normalizedPath}`;
};

const formatCurrency = (amount: number | string | undefined) => {
    if (!amount) return 'Thỏa thuận';
    const num = Number(amount);
    if (isNaN(num)) return 'Thỏa thuận';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
};

export default function ArtisanChatDetailPage() {
    const { data: session } = useSession();
    const axiosAuth = useAxiosAuth();
    const params = useParams();
    const router = useRouter();
    const chatId = Array.isArray(params.chatId) ? Number(params.chatId[0]) : Number(params.chatId);

    // --- STATE ---
    const [chat, setChat] = useState<Chat | null>(null);
    const [customer, setCustomer] = useState<UserType | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [messageText, setMessageText] = useState('');

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // --- STATE FOR PROPOSAL MODAL ---
    const [isProposalOpen, setIsProposalOpen] = useState(false);
    const [proposalPrice, setProposalPrice] = useState<string>('');
    const [proposalNote, setProposalNote] = useState('');

    // --- REFS ---
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const wsRef = useRef<WebSocket | null>(null); // Sửa thành chuẩn WebSocket

    // --- SCROLL TO BOTTOM ---
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // --- 1. FETCH DATA ---
    const fetchChatData = useCallback(async () => {
        if (!chatId || Number.isNaN(chatId)) {
            toast.error('ID cuộc trò chuyện không hợp lệ');
            router.push('/artisan/chat');
            return;
        }

        try {
            setIsLoading(true);
            const rawData = await axiosAuth.get<RawChatDataResponse>(`/chat/${chatId}/`);
            const mappedData = mapChatDetails(rawData.data);

            setChat(mappedData.chat);
            setMessages(mappedData.messages);
            setCustomer(mappedData.customer);
        } catch (error) {
            toast.error('Không thể tải dữ liệu cuộc trò chuyện');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [chatId, axiosAuth, router]);

    useEffect(() => {
        fetchChatData();
    }, [fetchChatData]);

    // --- 2. WEBSOCKET CONNECTION ---
    useEffect(() => {
        if (!chatId || !session?.user?.apiAccessToken) return;

        const token = session.user.apiAccessToken;
        const wsProtocol = API_URL.startsWith('https') ? 'wss' : 'ws';
        const wsUrl = `${wsProtocol}://${(API_URL.replace(/^https?:\/\//, '')).replace(/\/$/, '')}/ws/chat/${chatId}/?token=${token}`;
        
        let reconnectTimeout: NodeJS.Timeout | undefined; // Gán kiểu cho phép undefined
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
            } catch (e) {
                console.error('[WS] Lỗi parse tin nhắn socket:', e);
            }
        };

        wsRef.current = ws;

        return () => {
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            try { ws.close(); } catch { /* Bỏ qua lỗi catch rỗng */ }
        };
    }, [chatId, session?.user?.apiAccessToken]);

    // --- HANDLERS ---
    const handleSendProposal = async () => {
        if (!proposalPrice || isNaN(Number(proposalPrice))) {
            toast.error("Vui lòng nhập giá hợp lệ");
            return;
        }

        setIsSending(true);
        const proposalToast = toast.loading('Đang xử lý đề xuất...');
        
        try {
            const productPayload = {
                name: chat?.title || "Đơn hàng tùy chỉnh",
                price: Number(proposalPrice),
                description: proposalNote || chat?.description || "",
                status: "HIDDEN",
                stockQuantity: 20,
                image: chat?.referenceImage ? chat.referenceImage : undefined
            };
            
            toast.loading('Đang tạo sản phẩm...', { id: proposalToast });
            const customProduct = await axiosAuth.post('/products/', productPayload);
            
            toast.loading('Đang gửi qua Chat...', { id: proposalToast });
            const payload = {
                message: JSON.stringify(customProduct.data),
                type: 'ORDER_PROPOSAL',
            };

            await axiosAuth.post(`/chat/${chatId}/send-message/`, payload);

            toast.success("Đã gửi đề xuất đơn hàng!", { id: proposalToast });
            setIsProposalOpen(false);
            setProposalPrice('');
            setProposalNote('');
        } catch (error) {
            // Xử lý type error an toàn
            const err = error as { response?: { data?: string }, message?: string };
            const errorMsg = err.response?.data || err.message || 'Unknown error';
            toast.error('Gửi đề xuất thất bại.', { id: proposalToast });
            console.error('[Proposal] Error:', errorMsg);
        } finally {
            setIsSending(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file hình ảnh');
            return;
        }
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const removeImagePreview = () => {
        setImagePreview(null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSendMessage = async () => {
        if ((!messageText.trim() && !selectedFile) || !chat || !session?.user) return;
        
        setIsSending(true);
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
            const errorMessage = err?.message || 'Gửi tin nhắn thất bại';
            toast.error(errorMessage, { id: sendToast });
            console.error(error);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // --- RENDER ---
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-[#ffffff]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3F2E23] mx-auto"></div>
                    <p className="mt-4 text-[#6B4F3E]">Đang tải cuộc hội thoại...</p>
                </div>
            </div>
        );
    }

    if (!chat) return <div className="p-8 text-center text-[#3F2E23]">Không tìm thấy cuộc trò chuyện.</div>;

    const isChatClosed = chat.status === 'CLOSED';
    const hasReferenceImage = !!chat.referenceImage;

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] bg-white">
            {/* --- HEADER --- */}
            <div className="flex items-center justify-between border-b border-[#E8D5B5] px-6 py-4 shadow-sm flex-shrink-0 bg-white z-10">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.push('/artisan/chat')}
                        className="rounded-full border-[#E8D5B5] text-[#3F2E23] hover:bg-[#FFF8F0] hover:text-[#3F2E23]"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>

                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="font-bold text-xl text-[#3F2E23] flex items-center gap-2 flex-wrap">
                                {customer?.name || 'Khách hàng'}
                                <Badge variant="outline" className="border-[#E8D5B5] text-[#6B4F3E] bg-[#FFF8F0] font-normal">
                                    ID: {chatId}
                                </Badge>
                            </h1>
                            
                            <div className="flex items-center gap-2">
                                {isChatClosed ? (
                                    <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 font-medium">
                                        Đã kết thúc
                                    </Badge>
                                ) : (
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
                                        <span className="text-sm font-medium text-green-600">Hoạt động</span>
                                    </div>
                                )}
                                <span className="text-sm text-gray-400 hidden sm:inline ml-1">
                                    | {chat.title}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-right hidden md:block">
                    <p className="text-xs uppercase tracking-wide text-[#6B4F3E]">Ngân sách dự kiến</p>
                    <p className="text-lg font-bold text-[#3F2E23]">{formatCurrency(chat.budget)}</p>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="flex flex-1 overflow-hidden">
                {/* LEFT: CHAT AREA */}
                <div className="flex-1 flex flex-col relative bg-white">
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

                        {/* Request Info Block */}
                        <div className="mx-auto max-w-3xl rounded-xl border border-[#E8D5B5] p-4 shadow-sm bg-[#FFF8F0] mb-8">
                            <div className="flex gap-4">
                                {hasReferenceImage && (
                                    <div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden border border-[#E8D5B5] bg-white">
                                        <Image
                                            src={getFullImageUrl(chat.referenceImage)}
                                            alt="Reference"
                                            fill
                                            className="object-cover cursor-pointer hover:scale-105 transition"
                                            onClick={() => window.open(getFullImageUrl(chat.referenceImage), '_blank')}
                                        />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText size={16} className="text-[#6B4F3E]" />
                                        <h3 className="font-semibold text-sm uppercase text-[#6B4F3E]">Yêu cầu thiết kế</h3>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed text-[#3F2E23]">
                                        {chat.description || "Không có mô tả chi tiết."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Chat Bubbles */}
                        {messages.length === 0 ? (
                            <div className="text-center py-10 text-[#6B4F3E] opacity-70">
                                <p>Chưa có tin nhắn nào. Hãy gửi lời chào đến khách hàng!</p>
                            </div>
                        ) : (
                            messages.map((message) => {
                                const isMe = message.senderType === 'ARTISAN';
                                
                                return (
                                    <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2 mb-4`}>
                                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
                                            
                                            {!isMe && (
                                                <div className="flex items-end gap-2 mb-1">
                                                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 bg-slate-100 text-slate-700 border border-slate-200">
                                                        {customer?.name?.charAt(0) || 'K'}
                                                    </div>
                                                    <span className="text-[10px] text-gray-500 font-medium">{customer?.name}</span>
                                                </div>
                                            )}

                                            {message.type === 'ORDER_PROPOSAL' ? (
                                                (() => {
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

                                                    const productData = safeParseJSON(message.content);

                                                    if (!productData) {
                                                        return <div className="text-red-500 text-xs p-2 border border-red-200 bg-red-50 rounded">Lỗi dữ liệu đơn hàng</div>;
                                                    }

                                                    return (
                                                        <div className="border-2 border-[#D96C39] rounded-xl overflow-hidden bg-white shadow-md w-full max-w-sm my-1">
                                                            <div className="bg-[#FFF8F0] px-4 py-2 border-b border-[#E8D5B5] flex items-center gap-2">
                                                                <span className="text-xl">🛍️</span>
                                                                <span className="font-bold text-sm text-[#3F2E23] uppercase">Đề xuất bạn đã gửi</span>
                                                            </div>
                                                            <div className="p-4 space-y-2">
                                                                <h3 className="font-bold text-[#3F2E23] text-base leading-tight line-clamp-2">
                                                                    {productData.name || 'Sản phẩm thủ công'}
                                                                </h3>
                                                                <div className="flex justify-between items-center mt-2">
                                                                    <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                                        {productData.categoryName || 'Sản phẩm Custom'}
                                                                    </span>
                                                                    <span className="font-bold text-[#D96C39] text-lg">
                                                                        {productData.price ? Number(productData.price).toLocaleString('vi-VN') : 0} đ
                                                                    </span>
                                                                </div>
                                                                {productData.description && (
                                                                    <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded mt-2 border border-gray-100 italic">
                                                                        &quot;{productData.description}&quot;
                                                                    </div>
                                                                )}
                                                                <div className="mt-2 pt-2 border-t border-gray-100 text-center text-xs text-gray-400">
                                                                    Đang chờ khách hàng xác nhận
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()
                                            ) : (
                                                <div className={`rounded-2xl px-4 py-3 shadow-sm text-sm transition-all ${isMe ? 'bg-[#3F2E23] text-white rounded-br-none' : 'bg-[#FFF8F0] text-[#3F2E23] border border-[#E8D5B5] rounded-bl-none'}`}>
                                                    {message.isImage ? (
                                                        <div className="relative w-full min-w-[200px] max-w-[250px] h-48 rounded-lg overflow-hidden my-1 bg-black/5 border border-white/10">
                                                            <Image
                                                                src={getFullImageUrl(message.content)}
                                                                alt="Sent image"
                                                                fill
                                                                className="object-cover hover:scale-105 transition duration-300 cursor-pointer"
                                                                onClick={() => window.open(getFullImageUrl(message.content), '_blank')}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <p className="whitespace-pre-wrap leading-relaxed break-words">{message.content}</p>
                                                    )}
                                                </div>
                                            )}

                                            <span className="text-[10px] mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity text-[#6B4F3E]">
                                                {new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                                                    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
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
                    <div className="p-4 border-t border-[#E8D5B5] bg-white">
                        {isChatClosed ? (
                            <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                                <X size={16} /> Phiên trò chuyện này đã kết thúc.
                            </div>
                        ) : (
                            <div className="max-w-4xl mx-auto w-full">
                                {imagePreview && (
                                    <div className="relative mb-3 inline-block animate-in fade-in zoom-in duration-200">
                                        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#E8D5B5] shadow-sm">
                                            <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                                        </div>
                                        <button
                                            onClick={removeImagePreview}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center hover:bg-red-600 shadow-md transition"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                )}

                                <div className="flex gap-3 items-end">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        className="hidden"
                                        disabled={isSending}
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="rounded-full shrink-0 border-[#E8D5B5] text-[#6B4F3E] hover:bg-[#FFF8F0] hover:text-[#3F2E23] h-11 w-11"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isSending}
                                    >
                                        <ImageIcon size={20} />
                                    </Button>

                                    <div className="flex-1">
                                        <Input
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Nhập tin nhắn hỗ trợ khách hàng..."
                                            disabled={isSending}
                                            className="rounded-full bg-[#FFF8F0] border-[#E8D5B5] text-[#3F2E23] placeholder:text-[#6B4F3E]/60 focus-visible:ring-[#3F2E23] focus-visible:ring-offset-0 h-11 px-5"
                                        />
                                    </div>

                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={isSending || (!messageText.trim() && !imagePreview)}
                                        className="rounded-full w-11 h-11 p-0 shrink-0 shadow-sm bg-[#3F2E23] hover:bg-[#2A1E17] text-white transition-colors"
                                    >
                                        {isSending ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <Send size={18} className="ml-1" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: SIDEBAR INFO */}
                <div className="w-80 border-l border-[#E8D5B5] p-6 hidden xl:block overflow-y-auto bg-white">
                    <h3 className="font-bold mb-6 text-lg text-[#3F2E23]">Thông tin chi tiết</h3>

                    <div className="space-y-6">
                        <div className="rounded-xl border border-[#E8D5B5] p-4 bg-[#FFF8F0]">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white bg-[#6B4F3E]">
                                    <User size={18} />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-[#3F2E23]">{customer?.name}</p>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#E8D5B5] text-[#6B4F3E] uppercase font-bold tracking-wider">
                                        Khách hàng
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm mt-4 pt-4 border-t border-[#E8D5B5]/50">
                                <div className="flex items-center gap-2 text-[#6B4F3E]">
                                    <Mail size={14} />
                                    <span className="truncate">{customer?.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[#6B4F3E]">
                                    <MapPin size={14} />
                                    <span>Việt Nam</span>
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-[#E8D5B5]" />

                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider block mb-3 text-[#6B4F3E]">
                                Tóm tắt yêu cầu
                            </span>

                            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[#6B4F3E] flex items-center gap-1"><FileText size={14}/> Mã YC</span>
                                    <Badge variant="secondary" className="bg-white">#{chatId}</Badge>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[#6B4F3E] flex items-center gap-1"><DollarSign size={14}/> Budget</span>
                                    <span className="font-bold text-[#D96C39]">{formatCurrency(chat.budget)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[#6B4F3E] flex items-center gap-1"><Calendar size={14}/> Ngày tạo</span>
                                    <span className="text-[#3F2E23] font-medium">
                                        {chat.createdAt ? new Date(chat.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-[#E8D5B5]">
                            <Button
                                onClick={() => {
                                    if (chat?.budget) setProposalPrice(chat.budget.toString());
                                    setIsProposalOpen(true);
                                }}
                                className="w-full justify-start border-[#E8D5B5] bg-[#FFF8F0] text-[#3F2E23] hover:bg-[#E8D5B5]/50 hover:text-black font-semibold h-12 shadow-sm transition-all"
                            >
                                <span className="mr-2 text-lg">📄</span> Tạo Báo Giá / Đơn Hàng
                            </Button>
                        </div>
                    </div>
                </div>

                {/* --- MODAL POPUP --- */}
                {isProposalOpen && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-[#E8D5B5] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                            <div className="bg-[#3F2E23] p-4 flex items-center justify-between text-white">
                                <h3 className="font-bold flex items-center gap-2">
                                    <FileText size={18} /> Gửi Báo Giá Đơn Hàng
                                </h3>
                                <button onClick={() => setIsProposalOpen(false)} className="text-white/70 hover:text-white transition">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-5 space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#3F2E23]">Giá thỏa thuận (VNĐ) <span className="text-red-500">*</span></label>
                                    <Input
                                        type="number"
                                        value={proposalPrice}
                                        onChange={(e) => setProposalPrice(e.target.value)}
                                        placeholder="Ví dụ: 500000"
                                        className="border-[#E8D5B5] focus-visible:ring-[#D96C39] h-11 text-lg font-medium"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#3F2E23]">Ghi chú cho khách hàng</label>
                                    <Input
                                        value={proposalNote}
                                        onChange={(e) => setProposalNote(e.target.value)}
                                        placeholder="Mô tả chất liệu, thời gian hoàn thành..."
                                        className="border-[#E8D5B5] focus-visible:ring-[#D96C39] h-11"
                                    />
                                </div>

                                <div className="bg-orange-50 border border-orange-100 p-3 rounded-lg text-xs text-orange-800 flex gap-2">
                                    <span className="text-base">⚠️</span>
                                    <p>Khách hàng sẽ nhận được yêu cầu thanh toán. Đơn hàng chỉ tính là thành công khi khách hàng thanh toán số tiền này.</p>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setIsProposalOpen(false)} disabled={isSending} className="border-gray-300">
                                    Hủy bỏ
                                </Button>
                                <Button onClick={handleSendProposal} disabled={isSending} className="bg-[#D96C39] hover:bg-[#C25B2D] text-white min-w-[120px]">
                                    {isSending ? <Loader2 className="animate-spin h-4 w-4" /> : 'Gửi cho khách'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}