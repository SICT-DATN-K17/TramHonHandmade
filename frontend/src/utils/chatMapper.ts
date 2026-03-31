import {
    RawChatDataResponse,
    RawChatMessage,
    RawChatCustomer,
    RawChatArtisan,
    RawChatProduct,
} from '@/types/apiTypes';
import { Chat, ChatMessage, User, Artisan, Product } from '@/types';

export const mapToChat = (raw: RawChatDataResponse): Chat => {
    return {
        id: raw.id,
        customerId: raw.customer.id,
        artisanId: raw.artisan.id,
        productId: raw.product ? raw.product.id : null,
        title: raw.title,
        description: raw.description ?? '',
        budget: raw.budget ?? 0,
        referenceImage: raw.referenceImage ?? '',
        status: raw.status as Chat['status'],
        createdAt: raw.createdAt,
    };
};

export const mapToChatMessage = (raw: RawChatMessage, chatId: number): ChatMessage => {
    return {
        id: raw.id,
        chatId: chatId,
        senderId: raw.senderId,
        senderType: raw.senderType as ChatMessage['senderType'], 
        isImage: raw.image,
        type: raw.type as ChatMessage['type'],
        content: raw.message,
        createdAt: raw.createdAt,
    };
};

export const mapToUser = (raw: RawChatCustomer): User => {
    return {
        id: raw.id,
        name: raw.name,
        email: raw.email,
        role: 'CUSTOMER',
    };
};

export const mapToArtisan = (raw: RawChatArtisan): Artisan => {
    return {
        id: raw.id,
        name: raw.name,
        email: raw.email,
        role: 'ARTISAN',
    };
};

export const mapToProduct = (raw: RawChatProduct): Product => {
    return {
        id: raw.id,
        name: raw.name,
        description: raw.description,
        price: raw.price,
        image: raw.image,
        stockQuantity: 0,
        quantitySold: 0,
        artisanId: raw.artisanId || 1,
        categoryId: null,
        status: 'ACTIVE',
        createdAt: '',
        updatedAt: '',
    };
};

export const mapChatDetails = (raw: RawChatDataResponse) => {
    return {
        chat: mapToChat(raw),
        messages: raw.messages.map((msg) => mapToChatMessage(msg, raw.id)),
        customer: mapToUser(raw.customer),
        artisan: mapToArtisan(raw.artisan),
        product: raw.product ? mapToProduct(raw.product) : null,
    };
};