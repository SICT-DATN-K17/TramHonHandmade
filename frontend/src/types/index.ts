export type Product = {
	id: number;
	artisan_id: number | null;
	category_id: number | null;
	name: string;
	description: string | null;
	price: number;
	image: string | null;
	status: 'ACTIVE' | 'HIDDEN';
	quantity_sold: number;
	stock_quantity: number;
	created_at: string;
	updated_at: string;
};

export type Category = {
	id: number;
	name: string;
	slug: string;
	parent_id: number | null;
	created_at: string;
	updated_at: string;
};

export type CartItem = {
  id: number;
  productName: string;
  price: number;
  image?: string;
  quantity: number;
  stockQuantity?: number;
  chatId?: number;
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
	order_id: number;
	product_id: number | null;
	quantity: number;
	price_order: number; // Giá tại thời điểm mua
};

export type Order = {
	id: number;
	customer_id: number;
	artisan_id: number;
	chat_id: number | null;
	total_price: number;
	status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
	created_at: string;
	updated_at: string;
};

export type Chat = {
    id: number;
    customer_id: number;
    artisan_id: number;
    product_id: number | null;
    title: string;
    description: string;
    budget: number;
    reference_image: string;
    status: 'PENDING' | 'NEGOTIATING' | 'ORDER_CREATED' | 'CLOSED';
    created_at: string;
};

export type ChatMessage = {
    id: number;
    chat_id: number;
    sender_id: number;
    sender_type: 'CUSTOMER' | 'ARTISAN';
    is_image: boolean;
    type: 'TEXT' | 'IMAGE' | 'ORDER_PROPOSAL';
    content: string;
    created_at: string;
};

export type User = {
    id: number;
    name: string;
    email: string;
};

export type Artisan = {
    id: number;
    name: string;
    email: string;
};

