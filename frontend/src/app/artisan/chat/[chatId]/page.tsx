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
    Calendar,
    Store
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
    const wsRef = useRef<WebSocket | null>(null); 

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
            <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-[#FDFBF7]">
                <div className="text-center flex flex-col items-center">
                    <Loader2 className="h-10 w-10 animate-spin text-[#D96C39] mb-4" />
                    <p className="mt-4 text-[#6B4F3E] font-medium">Đang tải cuộc hội thoại...</p>
                </div>
            </div>
        );
    }

    if (!chat) return <div className="p-8 text-center text-[#3F2E23]">Không tìm thấy cuộc trò chuyện.</div>;

    const isChatClosed = chat.status === 'CLOSED';
    const hasReferenceImage = !!chat.referenceImage;

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] bg-[#FDFBF7]">
            {/* --- HEADER --- */}
            <div className="flex items-center justify-between border-b border-[#E8D5B5] px-6 py-4 shadow-sm flex-shrink-0 bg-white z-10">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.push('/artisan/chat')}
                        className="rounded-full border-[#E8D5B5] text-[#3F2E23] hover:bg-[#FFF8F0] hover:text-[#D96C39] transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>

                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="font-bold text-xl text-[#3F2E23] flex items-center gap-2 flex-wrap">
                                {customer?.name || 'Khách hàng'}
                                <Badge variant="outline" className="border-[#E8D5B5] text-[#D96C39] bg-[#FFF8F0] font-bold">
                                    ID: #{chatId}
                                </Badge>
                            </h1>
                            
                            <div className="flex items-center gap-2">
                                {isChatClosed && (
                                    <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 font-medium">
                                        Đã kết thúc
                                    </Badge>
                                )}
                                <span className="text-sm font-medium text-[#6B4F3E] hidden sm:inline ml-1">
                                    | {chat.title}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-right hidden md:block border-l border-[#E8D5B5] pl-6">
                    <p className="text-[11px] uppercase font-bold tracking-widest text-[#6B4F3E] mb-1">Ngân sách dự kiến</p>
                    <p className="text-lg font-extrabold text-[#D96C39]">{formatCurrency(chat.budget)}</p>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="flex flex-1 overflow-hidden">
                {/* LEFT: CHAT AREA */}
                <div className="flex-1 flex flex-col relative bg-[#FDFBF7]">
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">

                        {/* Request Info Block */}
                        <div className="mx-auto max-w-3xl rounded-2xl border border-[#E8D5B5] p-5 shadow-sm bg-white mb-8">
                            <div className="flex flex-col md:flex-row gap-5">
                                {hasReferenceImage && (
                                    <div className="relative w-full md:w-32 h-32 shrink-0 rounded-xl overflow-hidden border border-[#E8D5B5] bg-[#F7F1E8]">
                                        <Image
                                            src={getFullImageUrl(chat.referenceImage)}
                                            alt="Reference"
                                            fill
                                            className="object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                                            onClick={() => window.open(getFullImageUrl(chat.referenceImage), '_blank')}
                                        />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="p-1.5 rounded-md bg-[#FFF8F0] text-[#D96C39]">
                                            <FileText size={16} />
                                        </div>
                                        <h3 className="font-bold text-sm uppercase tracking-wider text-[#3F2E23]">Yêu cầu thiết kế chi tiết</h3>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed text-[#6B4F3E] bg-[#F7F1E8] p-3 rounded-xl border border-[#E8D5B5]/50">
                                        {chat.description || "Không có mô tả chi tiết."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Chat Bubbles */}
                        {messages.length === 0 ? (
                            <div className="text-center py-10 flex flex-col items-center justify-center opacity-60">
                                <Store size={48} className="text-[#E8D5B5] mb-4" />
                                <p className="text-[#6B4F3E] font-medium">Chưa có tin nhắn nào. Hãy gửi lời chào đến khách hàng!</p>
                            </div>
                        ) : (
                            messages.map((message) => {
                                const isMe = message.senderType === 'ARTISAN';
                                
                                return (
                                    <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2 mb-4`}>
                                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[70%] lg:max-w-[50%]`}>
                                            
                                            {!isMe && (
                                                <div className="flex items-center gap-2 mb-1.5 ml-1">
                                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 bg-[#FFF8F0] text-[#D96C39] border border-[#D96C39]">
                                                        {customer?.name?.charAt(0).toUpperCase() || 'K'}
                                                    </div>
                                                    <span className="text-[11px] font-bold text-[#6B4F3E]">{customer?.name}</span>
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

                                                    const productData: Record<string, any> | null = safeParseJSON(message.content);

                                                    if (!productData) {
                                                        return <div className="text-red-500 text-xs p-2 border border-red-200 bg-red-50 rounded">Lỗi dữ liệu đơn hàng</div>;
                                                    }

                                                    return (
                                                        <div className="border border-[#E8D5B5] rounded-2xl overflow-hidden bg-white shadow-md w-full max-w-sm my-1">
                                                            <div className="bg-gradient-to-r from-[#D96C39] to-orange-500 px-4 py-2.5 flex items-center gap-2">
                                                                <FileText size={16} className="text-white" />
                                                                <span className="font-bold text-xs text-white uppercase tracking-wider">Đề xuất bạn đã gửi</span>
                                                            </div>
                                                            <div className="p-4 space-y-3">
                                                                <h3 className="font-bold text-[#3F2E23] text-base leading-tight line-clamp-2">
                                                                    {productData.name || 'Sản phẩm thủ công'}
                                                                </h3>
                                                                
                                                                {productData.image && (
                                                                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-[#E8D5B5] bg-[#F7F1E8]">
                                                                        <Image 
                                                                            src={getFullImageUrl(productData.image)}
                                                                            alt="Product"
                                                                            fill
                                                                            className="object-cover"
                                                                        />
                                                                    </div>
                                                                )}

                                                                <div className="flex justify-between items-end mt-2">
                                                                    <span className="font-extrabold text-[#D96C39] text-xl">
                                                                        {productData.price ? Number(productData.price).toLocaleString('vi-VN') : 0} ₫
                                                                    </span>
                                                                </div>

                                                                {productData.description && (
                                                                    <div className="text-xs text-[#6B4F3E] bg-[#FFF8F0] p-2.5 rounded-lg border border-[#E8D5B5]/50 italic">
                                                                        &quot;{productData.description}&quot;
                                                                    </div>
                                                                )}
                                                                
                                                                <div className="mt-3 pt-3 border-t border-[#E8D5B5]/50 text-center text-xs font-bold text-[#D96C39] bg-orange-50 py-2 rounded-lg">
                                                                    Đang chờ khách hàng xác nhận...
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()
                                            ) : (
                                                <div className={`rounded-2xl px-5 py-3 shadow-sm text-sm transition-all ${isMe ? 'bg-[#3F2E23] text-white rounded-br-sm' : 'bg-white text-[#3F2E23] border border-[#E8D5B5] rounded-bl-sm'}`}>
                                                    {message.isImage ? (
                                                        <div className="relative w-full min-w-[200px] max-w-[250px] h-48 rounded-xl overflow-hidden my-1 bg-[#F7F1E8] border border-black/10">
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

                                            <span className="text-[10px] mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity font-medium text-[#6B4F3E]">
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
                    <div className="p-4 border-t border-[#E8D5B5] bg-white flex-shrink-0 z-10">
                        {isChatClosed ? (
                            <div className="bg-[#FFF8F0] border border-[#E8D5B5] p-3 rounded-xl text-center text-sm font-bold text-[#D96C39] flex items-center justify-center gap-2">
                                <X size={18} /> Phiên trò chuyện này đã kết thúc.
                            </div>
                        ) : (
                            <div className="max-w-4xl mx-auto w-full bg-white p-2 rounded-2xl border border-[#E8D5B5] shadow-sm">
                                {imagePreview && (
                                    <div className="relative mb-3 inline-block ml-2 mt-2 animate-in fade-in zoom-in duration-200">
                                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-[#D96C39] shadow-sm">
                                            <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                                        </div>
                                        <button
                                            onClick={removeImagePreview}
                                            className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full p-1 w-6 h-6 flex items-center justify-center hover:bg-red-50 border border-red-100 shadow-sm transition"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}

                                <div className="flex gap-2 items-end">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        className="hidden"
                                        disabled={isSending}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-xl shrink-0 text-[#6B4F3E] hover:bg-[#FFF8F0] hover:text-[#D96C39] h-12 w-12"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isSending}
                                    >
                                        <ImageIcon size={22} />
                                    </Button>

                                    <div className="flex-1 relative">
                                        <Input
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Nhắn tin cho khách hàng..."
                                            disabled={isSending}
                                            className="rounded-xl bg-gray-50 border-none text-[#3F2E23] placeholder:text-gray-400 font-medium focus-visible:ring-0 focus-visible:ring-offset-0 h-12 px-4"
                                        />
                                    </div>

                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={isSending || (!messageText.trim() && !imagePreview)}
                                        className="rounded-xl w-12 h-12 p-0 shrink-0 shadow-sm bg-[#D96C39] hover:bg-[#C25B2D] text-white transition-colors"
                                    >
                                        {isSending ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <Send size={20} className="ml-1" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: SIDEBAR INFO */}
                <div className="w-80 border-l border-[#E8D5B5] p-6 hidden xl:flex flex-col bg-white overflow-y-auto">
                    <h3 className="font-bold mb-6 text-lg text-[#3F2E23] uppercase tracking-wider">Thông tin khách</h3>

                    <div className="space-y-6 flex-1">
                        <div className="rounded-2xl border border-[#E8D5B5] p-5 bg-[#FFF8F0] shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-br from-[#D96C39] to-orange-400 shadow-md">
                                    <User size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-base text-[#3F2E23]">{customer?.name}</p>
                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-[#E8D5B5] text-[#D96C39] uppercase font-bold tracking-wider">
                                        Khách hàng
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm mt-4 pt-4 border-t border-[#E8D5B5]">
                                <div className="flex items-center gap-2 text-[#6B4F3E] font-medium">
                                    <Mail size={16} className="text-[#D96C39]" />
                                    <span className="truncate">{customer?.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[#6B4F3E] font-medium">
                                    <MapPin size={16} className="text-[#D96C39]" />
                                    <span>Việt Nam</span>
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-[#E8D5B5]" />

                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider block mb-3 text-[#6B4F3E]">
                                Tóm tắt phiên
                            </span>

                            <div className="space-y-3 bg-[#FDFBF7] p-5 rounded-2xl border border-[#E8D5B5] shadow-sm">
                                <div className="flex justify-between items-center text-sm border-b border-[#E8D5B5]/50 pb-2">
                                    <span className="text-[#6B4F3E] flex items-center gap-1.5 font-medium"><FileText size={14} className="text-[#D96C39]" /> Mã YC</span>
                                    <span className="font-bold text-[#3F2E23]">#{chatId}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-b border-[#E8D5B5]/50 pb-2">
                                    <span className="text-[#6B4F3E] flex items-center gap-1.5 font-medium"><DollarSign size={14} className="text-[#D96C39]"/> Ngân sách</span>
                                    <span className="font-bold text-[#D96C39]">{formatCurrency(chat.budget)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm pt-1">
                                    <span className="text-[#6B4F3E] flex items-center gap-1.5 font-medium"><Calendar size={14} className="text-[#D96C39]"/> Ngày tạo</span>
                                    <span className="text-[#3F2E23] font-bold">
                                        {chat.createdAt ? new Date(chat.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-[#E8D5B5]">
                        <Button
                            onClick={() => {
                                if (chat?.budget) setProposalPrice(chat.budget.toString());
                                setIsProposalOpen(true);
                            }}
                            className="w-full bg-[#3F2E23] text-white hover:bg-black font-bold h-14 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-base"
                            disabled={isChatClosed}
                        >
                            <FileText size={18} /> Chốt & Gửi Báo Giá
                        </Button>
                        <p className="text-[10px] text-center text-[#6B4F3E] mt-3 uppercase tracking-wider font-bold">
                            Tạo hóa đơn để khách thanh toán
                        </p>
                    </div>
                </div>

                {/* --- MODAL POPUP --- */}
                {isProposalOpen && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[#E8D5B5] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-[#3F2E23] to-[#2A1F17] p-5 flex items-center justify-between text-white">
                                <h3 className="font-bold flex items-center gap-2 text-lg">
                                    <FileText size={20} /> Gửi Báo Giá Đơn Hàng
                                </h3>
                                <button onClick={() => setIsProposalOpen(false)} className="text-white/70 hover:text-white transition bg-white/10 rounded-full p-1">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-[#3F2E23]">Giá thỏa thuận (VNĐ) <span className="text-red-500">*</span></label>
                                    <Input
                                        type="number"
                                        value={proposalPrice}
                                        onChange={(e) => setProposalPrice(e.target.value)}
                                        placeholder="Ví dụ: 500000"
                                        className="border-[#E8D5B5] focus-visible:ring-[#D96C39] h-12 text-lg font-bold bg-gray-50"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-[#3F2E23]">Ghi chú cho khách hàng</label>
                                    <Input
                                        value={proposalNote}
                                        onChange={(e) => setProposalNote(e.target.value)}
                                        placeholder="Mô tả chất liệu, thời gian hoàn thành..."
                                        className="border-[#E8D5B5] focus-visible:ring-[#D96C39] h-12 bg-gray-50"
                                    />
                                </div>

                                <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl text-sm text-orange-800 flex gap-3 shadow-sm">
                                    <span className="text-xl shrink-0">⚠️</span>
                                    <p className="leading-relaxed font-medium">Khách hàng sẽ nhận được yêu cầu thanh toán trực tiếp trong khung chat. Đơn hàng chỉ tính là thành công khi khách hàng thanh toán số tiền này.</p>
                                </div>
                            </div>

                            <div className="p-5 bg-[#FDFBF7] border-t border-[#E8D5B5] flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setIsProposalOpen(false)} disabled={isSending} className="border-[#E8D5B5] text-[#6B4F3E] hover:bg-white font-bold h-11">
                                    Hủy bỏ
                                </Button>
                                <Button onClick={handleSendProposal} disabled={isSending} className="bg-[#D96C39] hover:bg-[#C25B2D] text-white min-w-[140px] font-bold h-11 shadow-sm">
                                    {isSending ? <Loader2 className="animate-spin h-5 w-5" /> : 'Gửi cho khách'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}