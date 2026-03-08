import useAxiosAuth from "@/hooks/useAxiosAuth";
import {useCallback, useState} from "react";

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
    price: number;
    imageUrl: string | null;
}

export interface RawOrderResponse {
    id: number;
    status: string; // 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    orderDate: string; // Backend trả về LocalDateTime, JSON sẽ là chuỗi ISO
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
    price: number;
    subtotal: number;
}

export interface RawOrderDetail {
    id: number;
    chatId: number | null;
    orderDate: string; // ISO String
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

export interface RawAdminOrderListItem {
    productId: number;
    productName: string;
    quantity: number;
    price: number;
    image: string | null;
}

export interface RawAdminOrderList {
    id: number;
    orderNumber: string;
    customerName: string;
    phone: string;
    status: string;
    createdAt: string; // ISO String
    subtotal: number;
    shippingFee: number;
    total: number;
    paymentMethod: string;
    shippingAddress: string;
    note: string | null;
    items: RawAdminOrderListItem[];
}


// Chat
export interface RawChatMessage {
    id: number;
    senderId: number;
    senderType: string; // 'CUSTOMER' | 'ARTISAN'
    image: boolean;
    type: string; // 'TEXT' | 'IMAGE' | 'ORDER_PROPOSAL'
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
    status: string; // 'PENDING','IN_PROGRESS','COMPLETED','CANCELLED'
    title: string;
    description: string | null;
    budget: number | null;
    referenceImage: string | null;
    createdAt: string;
    messages: RawChatMessage[];
}