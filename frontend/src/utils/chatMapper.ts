import {
    RawChatDataResponse,
    RawChatMessage,
    RawChatCustomer,
    RawChatArtisan,
    RawChatProduct,
} from '@/types/apiTypes';
import { Chat, ChatMessage, User, Artisan, Product } from '@/types';

/**
 * Chuyển đổi thông tin Chat Header
 * Lưu ý: RawChatDataResponse chứa cả object customer/artisan,
 * nhưng type Chat của bạn chỉ giữ ID.
 */
export const mapToChat = (raw: RawChatDataResponse): Chat => {
    return {
        id: raw.id,
        customer_id: raw.customer.id,
        artisan_id: raw.artisan.id,
        product_id: raw.product ? raw.product.id : null,
        title: raw.title,
        // Xử lý null từ backend thành giá trị mặc định cho frontend
        description: raw.description ?? '',
        budget: raw.budget ?? 0,
        reference_image: raw.referenceImage ?? '',
        // Ép kiểu string sang Union Type
        status: raw.status as Chat['status'],
        created_at: raw.createdAt,
    };
};

/**
 * Chuyển đổi từng tin nhắn riêng lẻ
 * Cần truyền thêm chatId vào vì RawChatMessage bên trong list không có field này
 */
export const mapToChatMessage = (raw: RawChatMessage, chatId: number): ChatMessage => {
    return {
        id: raw.id,
        chat_id: chatId,
        sender_id: raw.senderId,
        sender_type: raw.senderType as ChatMessage['sender_type'], // 'CUSTOMER' | 'ARTISAN'
        is_image: raw.image,
        type: raw.type as ChatMessage['type'],
        content: raw.message,
        created_at: raw.createdAt,
    };
};


export const mapToUser = (raw: RawChatCustomer): User => {
    return {
        id: raw.id,
        name: raw.name,
        email: raw.email,
    };
};

export const mapToArtisan = (raw: RawChatArtisan): Artisan => {
    return {
        id: raw.id,
        name: raw.name,
        email: raw.email,
    };
};

export const mapToProduct = (raw: RawChatProduct): Product => {
    return {
        id: raw.id,
        name: raw.name,
        description: raw.description,
        price: raw.price,
        image: raw.image,
        stock_quantity: 0,
        quantity_sold: 0,
        artisan_id: 1,
        category_id: null,
        status: 'ACTIVE',
        created_at: '',
        updated_at: '',
    };
};

/**
 * HAM TỔNG HỢP:
 * Dùng hàm này khi gọi API getChatData để lấy về toàn bộ dữ liệu đã được format
 */
export const mapChatDetails = (raw: RawChatDataResponse) => {
    return {
        chat: mapToChat(raw),
        messages: raw.messages.map((msg) => mapToChatMessage(msg, raw.id)),
        customer: mapToUser(raw.customer),
        artisan: mapToArtisan(raw.artisan),
        product: raw.product ? mapToProduct(raw.product) : null,
    };
};