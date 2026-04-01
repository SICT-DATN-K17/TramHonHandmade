// Xóa bỏ các import thừa của React (useAxiosAuth, useState...)

export type RawCategoryResponse = {
    categoryId: number;
    categoryName: string;
    slug: string;
    parentId: number | null;
    createdAt: string;
    updatedAt: string;
    soldCount: number;
};

export interface PaginatedProductResponse {
    content: RawProductResponse[];
    size: number;
    totalElements: number;
    totalPages: number;
    currentPage: number;
}

export type RawProductResponse = {
    id: number;
    artisanId?: number; 
    artisanName?: string;   
    categoryId: number | null;
    categoryName: string | null;
    name: string;
    description: string | null;
    price: number;
    image: string | null;
    status: 'ACTIVE' | 'HIDDEN';
    quantitySold: number;
    stockQuantity: number;
    createdAt: string;
    updatedAt: string;
};

export interface RawOrderItem {
    productName: string;
    quantity: number;
    price?: number;
    priceOrder?: number;
    imageUrl?: string | null;
    productImage?: string | null;
}

export interface RawOrderResponse {
    id: number;
    status: string;
    orderDate: string;
    totalPrice: number;
    isCustomOrder: boolean;
    note: string | null ;
    items: RawOrderItem[];
}

export interface RawOrderDetailItem {
    id: number;
    productId: number;
    productName: string;
    productImage: string;
    quantity: number;
    price?: number;
    priceOrder?: number;
    subtotal: number;
}

export interface RawOrderDetail {
    id: number;
    chatId: number | null;
    orderDate: string;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    totalPrice: number;
    shippingFee: number;
    finalTotal: number;
    paymentMethod: string;
    shippingAddress: string;
    customerName: string;
    customerPhone: string;
    note: string | null;
    items: RawOrderDetailItem[];
}

export interface RawArtisanOrderListItem {
    productId: number;
    productName: string;
    quantity: number;
    price: number;
    image: string | null;
}

export interface RawArtisanOrderList {
    id: number;
    orderNumber: string;
    customerName: string;
    phone: string;
    status: string;
    createdAt: string;
    subtotal: number;
    shippingFee: number;
    total: number;
    paymentMethod: string;
    shippingAddress: string;
    note: string | null;
    items: RawArtisanOrderListItem[];
}

// Chat
export interface RawChatMessage {
    id: number;
    senderId: number;
    senderType: string;
    image: boolean;
    type: string;
    message: string;
    createdAt: string;
}

export interface RawChatCustomer {
    id: number;
    name: string;
    email: string;
}

export interface RawChatArtisan {
    id: number;
    name: string;
    email: string;
}

export interface RawChatProduct {
    id: number;
    artisanId?: number;
    name: string;
    description: string | null;
    price: number;
    image: string | null;
}

export interface RawChatDataResponse {
    id: number;
    customer: RawChatCustomer;
    artisan: RawChatArtisan;
    product: RawChatProduct | null;
    status: string;
    title: string;
    description: string | null;
    budget: number | null;
    referenceImage: string | null;
    createdAt: string;
    messages: RawChatMessage[];
}

export interface RawUserResponse {
    id: number;
    name: string;
    email: string;
    role: string;
    bio?: string | null;
    created_at: string;
}