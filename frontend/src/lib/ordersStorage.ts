import type { PaymentMethod, ShippingAddress } from '@/types';

export type StoredOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type StoredOrderItem = {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  image?: string;
};

export type StoredOrder = {
  id: number;
  orderNumber: string;
  customerName: string;
  phone: string;
  status: StoredOrderStatus;
  createdAt: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  shippingAddress: ShippingAddress;
  items: StoredOrderItem[];
};

/**
 * @deprecated Orders are now stored in the database. These functions are kept for backward compatibility
 * but should not be used. Use API endpoints instead:
 * - GET /api/orders/admin/all - for admin orders list
 * - GET /api/orders/{id} - for order details
 * - PUT /api/orders/{id}/status - for updating order status
 */
const ORDERS_STORAGE_KEY = 'artivio_admin_orders';

const isBrowser = () => typeof window !== 'undefined';

/**
 * @deprecated Use API endpoint GET /api/orders/admin/all instead
 */
export function getStoredOrders(): StoredOrder[] {
  if (!isBrowser()) return [];

  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to read orders from localStorage:', error);
    return [];
  }
}

/**
 * @deprecated Orders are stored in database, no need to save to localStorage
 */
export function saveStoredOrders(orders: StoredOrder[]): void {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (error) {
    console.error('Failed to save orders to localStorage:', error);
  }
}

/**
 * @deprecated Orders are automatically saved to database when created via API
 */
export function appendOrderToStorage(order: StoredOrder): StoredOrder[] {
  const current = getStoredOrders();
  const nextOrders = [...current.filter((item) => item.id !== order.id), order].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  saveStoredOrders(nextOrders);
  return nextOrders;
}

/**
 * @deprecated Use API endpoint PUT /api/orders/{id}/status instead
 */
export function updateOrderStatus(orderId: number, status: StoredOrderStatus): StoredOrder[] {
  const orders = getStoredOrders();
  const nextOrders = orders.map((order) =>
    order.id === orderId
      ? {
          ...order,
          status,
        }
      : order
  );

  saveStoredOrders(nextOrders);
  return nextOrders;
}



