'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { CartItem } from '@/types';
import toast from 'react-hot-toast';

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  buyNow: (item: CartItem) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItemQuantity: (id: number) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'artivio_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[];
        setItems(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
        console.error('Failed to save cart to localStorage:', error);
      }
    }
  }, [items, isHydrated]);

  const addItem = (newItem: Omit<CartItem, 'quantity'> & { quantity?: number }): boolean => {
    if (items.length > 0) {
      const currentArtisanId = items[0].artisanId;
      if (newItem.artisanId && currentArtisanId && newItem.artisanId !== currentArtisanId) {
        toast.error("Bạn chỉ có thể mua các sản phẩm của CÙNG MỘT cửa hàng/nghệ nhân trong 1 lần thanh toán. Vui lòng thanh toán hoặc xóa giỏ hàng hiện tại.");
        return false; // Bị chặn -> Trả về false và thoát hàm ngay!
      }
    }

    setItems((currentItems) => {
      const existingIndex = currentItems.findIndex((item) => item.id === newItem.id);

      if (existingIndex >= 0) {
        const existing = currentItems[existingIndex];
        const maxStock = existing.stockQuantity ?? 9999;
        const newQuantity = Math.min(
          (existing.quantity || 0) + (newItem.quantity || 1),
          maxStock
        );

        if (newQuantity <= 0) {
          return currentItems.filter((item) => item.id !== newItem.id);
        }

        return currentItems.map((item, index) =>
          index === existingIndex ? { ...item, quantity: newQuantity } : item
        );
      } else {
        const quantity = Math.min(newItem.quantity || 1, newItem.stockQuantity ?? 9999);
        return [...currentItems, { ...newItem, quantity }];
      }
    });

    return true; // Thêm thành công -> Trả về true
  };

  const removeItem = (id: number) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id === id) {
          const maxStock = item.stockQuantity ?? 9999;
          return { ...item, quantity: Math.min(quantity, maxStock) };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };
    const buyNow = (newItem: CartItem) => {
      const quantity = Math.min(newItem.quantity || 1, newItem.stockQuantity ?? 9999);
      // Khi bấm Buy Now, luôn luôn đè lại giỏ hàng cũ bằng món mới này (tránh mix đồ)
      setItems([{ ...newItem, quantity }]);
    };

    const getTotalItems = () => {
      return items.reduce((total, item) => total + item.quantity, 0);
    };

    const getTotalPrice = () => {
      return items.reduce((total, item) => {
        const price = Number(item.price) || 0;
        return total + price * item.quantity;
      }, 0);
    };

    const getItemQuantity = (id: number) => {
      const item = items.find((item) => item.id === id);
      return item?.quantity || 0;
    };

    return (
      <CartContext.Provider
        value={{
          items,
          addItem,
          removeItem,
          updateQuantity,
          clearCart,
          buyNow,
          getTotalItems,
          getTotalPrice,
          getItemQuantity,
        }}
      >
        {children}
      </CartContext.Provider>
    );
  }

  export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
      throw new Error('useCart must be used within a CartProvider');
    }
    return context;
  }