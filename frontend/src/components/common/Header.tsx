'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Image from "next/image";
import Link from "next/link";
import { useCart } from '@/contexts/CartContext';
import CartSidebar from '@/components/cart/CartSidebar';

import { Category } from '@/types';
import { axiosClient } from '@/lib/axios';

const categoryIcons: Record<string, string> = {
  "Đồng hồ": "🕰️",
  "Hoa vĩnh cửu": "🌹",
  "Quà tặng": "🎁",
  "Thiệp handmade": "💌",
  "Phụ kiện & nguyên liệu": "🧵",
  "Vải decor": "🧣",
  "Ví & passport": "💼",
  "Limited": "🌟",
};

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAccountMenuOpen, setAccountMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();
  const { getTotalItems } = useCart();
  const cartItemCount = getTotalItems();

useEffect(() => {
    axiosClient.get('/categories/')
      .then(res => {
        const data = res.data.content || res.data.results || res.data;
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error("Failed to fetch categories for header:", err));

    const handleClickOutside = (event: MouseEvent) => {
      // Đóng dropdown danh mục
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      // Đóng dropdown tài khoản
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setAccountMenuOpen(false);
    signOut({ callbackUrl: '/auth?mode=login' });
  };

  return (
    <header className="w-full sticky top-0 z-40 shadow-sm" style={{ backgroundColor: '#6B4F3E' }}>
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 relative group-hover:scale-110 transition-transform duration-300">
            <Image
              src="/tramhon-logo.png"
              alt="TramHon logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="group relative">
            <span className="text-sm font-medium inline-block transition-colors" style={{ color: '#F7F1E8' }}>
              Trang chủ
            </span>
            <span className="absolute left-0 -bottom-1 h-0.5 w-0 rounded-full transition-all duration-300 group-hover:w-full" style={{ backgroundColor: '#F4C27A' }}></span>
          </Link>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="group relative flex items-center gap-2 text-sm font-medium"
              style={{ color: '#F7F1E8' }}
            >
              <span className="inline-block">Danh mục</span>
              <svg
                className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>

              <span className="absolute left-0 -bottom-1 h-0.5 w-0 rounded-full transition-all duration-300 group-hover:w-full" style={{ backgroundColor: '#F4C27A' }}></span>
            </button>

            <div className={`absolute top-full left-0 mt-2 w-56 rounded-lg shadow-lg transition-all duration-300 origin-top ${isOpen ? 'opacity-100 scale-y-100 visible' : 'opacity-0 scale-y-95 invisible'}`} style={{ backgroundColor: '#F7F1E8', borderColor: '#D96C39', border: '1px solid #D96C39' }}>
              {categories.map((cat, idx:number) => (
                <Link
                  key={cat.categoryId || idx}
                  href={`/shop/products?categoryId=${cat.categoryId}`}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 text-sm transition-all duration-200 relative group overflow-hidden ${idx === 0 ? 'rounded-t-lg' : ''} ${idx === categories.length - 1 ? 'rounded-b-lg' : ''}`}
                  style={{ color: '#3F2E23' }}
                >
                  <span className="relative z-10 group-hover:font-semibold transition-all flex items-center gap-3">
                    <span className="text-lg">{categoryIcons[cat.categoryName] ?? '🎁'}</span>
                    <span>{cat.categoryName}</span>
                  </span>
                  <div className="absolute inset-0 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 -z-0" style={{ backgroundColor: '#F4C27A', opacity: 0.2 }}></div>
                </Link>
              ))}
            </div>
          </div>

          <Link href="/shop/products" className="group relative">
            <span className="text-sm font-medium inline-block transition-colors" style={{ color: '#F7F1E8' }}>
              Sản phẩm
            </span>
            <span className="absolute left-0 -bottom-1 h-0.5 w-0 rounded-full transition-all duration-300 group-hover:w-full" style={{ backgroundColor: '#F4C27A' }}></span>
          </Link>

          <Link href="/custom-request" className="group relative">
            <span className="text-sm font-medium inline-block transition-colors" style={{ color: '#F7F1E8' }}>
              Làm riêng
            </span>
            <span className="absolute left-0 -bottom-1 h-0.5 w-0 rounded-full transition-all duration-300 group-hover:w-full" style={{ backgroundColor: '#F4C27A' }}></span>
          </Link>

          <Link href="/account/orders" className="group relative">
            <span className="text-sm font-medium inline-block transition-colors" style={{ color: '#F7F1E8' }}>
              Đơn hàng
            </span>
            <span className="absolute left-0 -bottom-1 h-0.5 w-0 rounded-full transition-all duration-300 group-hover:w-full" style={{ backgroundColor: '#F4C27A' }}></span>
          </Link>
        </nav>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 transition-all duration-300 group relative"
            style={{ color: '#F7F1E8' }}
            aria-label="Giỏ hàng"
          >
            <span className="relative transform group-hover:scale-125 transition-transform duration-300">
              🛒
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 text-white text-[10px] rounded-full min-w-[20px] h-5 flex items-center justify-center font-bold px-1" style={{ backgroundColor: '#D96C39' }}>
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </span>
            <span className="text-sm">Giỏ hàng</span>
          </button>
          {status === 'authenticated' ? (
            <div className="relative" ref={accountMenuRef}>
              <button onClick={() => setAccountMenuOpen(!isAccountMenuOpen)} className="flex items-center gap-2 transition-all duration-300 group" style={{ color: '#F7F1E8' }}>
                <span className="relative transform group-hover:scale-125 transition-transform duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <span className="text-sm">{session.user?.name ?? 'Tài khoản'}</span>
              </button>

              {/* Dropdown Menu */}
              <div className={`absolute top-full right-0 mt-2 w-48 rounded-lg shadow-lg transition-all duration-300 origin-top-right ${isAccountMenuOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`} style={{ backgroundColor: '#F7F1E8', border: '1px solid #D96C39' }}>
                <div className="py-1">
                  <Link href="/account" onClick={() => setAccountMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-primary-light" style={{ color: '#3F2E23' }}>
                    Tài khoản của tôi
                  </Link>
                  <Link href="/account/orders" onClick={() => setAccountMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-primary-light" style={{ color: '#3F2E23' }}>
                    Đơn hàng của tôi
                  </Link>
                  <button
                    onClick={() => {
                      setAccountMenuOpen(false);
                      setIsCartOpen(true);
                    }}
                    className="w-full text-left block px-4 py-2 text-sm hover:bg-primary-light"
                    style={{ color: '#3F2E23' }}
                  >                    
                  Giỏ hàng
                  </button>
                  <div className="border-t my-1" style={{ borderColor: '#E8D5B5' }}></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left block px-4 py-2 text-sm hover:bg-primary-light"
                    style={{ color: '#D96C39' }}
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          ) : status === 'unauthenticated' ? (
            <Link href="/auth?mode=login" className="flex items-center gap-2 transition-all duration-300 group" style={{ color: '#F7F1E8' }}>
              <span className="transform group-hover:scale-125 transition-transform duration-300">🚪</span>
              <span className="text-sm">Đăng Nhập</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2" style={{ color: '#F7F1E8' }}>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: '#F7F1E8' }}></span>
            </div>
          )
          }
        </div>
      </div>
      {/* Cart Sidebar */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
}