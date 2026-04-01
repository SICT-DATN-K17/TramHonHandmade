export type Product = {
    id: number;
    artisanId: number | null;
    artisanName?: string;
    categoryId: number | null;
    categoryName?: string; 
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

export type Category = {
    categoryId: number;
    categoryName: string;
    slug: string;
    parentId: number | null;
    soldCount?: number;
    createdAt: string;
    updatedAt: string;
};

export type CartItem = {
    id: number;
    productName: string;
    price: number;
    image?: string;
    quantity: number;
    stockQuantity?: number;
    chatId?: number;
    artisanId?: number;
};

export type ShippingAddress = {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    note?: string;
};

export type PaymentMethod = 'cod' | 'bank_transfer' | 'credit_card';

export type OrderItem = {
    id: number;
    orderId: number;
    productId: number | null;
    quantity: number;
    priceOrder: number;
    productName?: string;
    productImage?: string;
};

export type Order = {
    id: number;
    customerId: number;
    artisanId: number;
    chatId: number | null;
    totalPrice: number;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    createdAt: string;
    updatedAt: string;
    items?: OrderItem[]; 
};

export type Chat = {
    id: number;
    customerId: number;
    artisanId: number;
    productId: number | null;
    title: string;
    description: string;
    budget: number;
    referenceImage: string; 
    status: 'PENDING' | 'NEGOTIATING' | 'ORDER_CREATED' | 'CLOSED';
    createdAt: string;
};

export type ChatMessage = {
    id: number;
    chatId: number;
    senderId: number;
    senderType: 'CUSTOMER' | 'ARTISAN';
    isImage: boolean; 
    type: 'TEXT' | 'IMAGE' | 'ORDER_PROPOSAL';
    content: string;
    createdAt: string;
};

export type User = {
    id: number;
    name: string;
    email: string;
    role?: 'CUSTOMER' | 'ARTISAN' | 'ADMIN';
    bio?: string | null; 
    createdAt?: string;
};

export type Artisan = {
    id: number;
    name: string;
    email: string;
    role?: 'ARTISAN';
};