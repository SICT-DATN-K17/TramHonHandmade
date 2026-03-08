'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import {
  CircleUser,
  Home,
  Menu,
  MessageSquare,
  Package,
  ShoppingCart,
  Users,
  X, // For closing mobile menu
} from 'lucide-react';

// --- Custom Components to replace UI Library ---

const UserDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-10 p-0 flex items-center justify-center rounded-full transition-colors hover:bg-[#E8D5B5]"
        style={{ color: '#3F2E23' }}
      >
        <CircleUser className="h-5 w-5" />
        <span className="sr-only">Toggle user menu</span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md shadow-lg py-1"
          style={{ backgroundColor: '#FFF8F0', border: '1px solid #E8D5B5' }}
        >
          <div className="px-4 py-2 text-sm font-semibold" style={{ color: '#6B4F3E' }}>My Account</div>
          <div className="border-t my-1" style={{ borderColor: '#E8D5B5' }}></div>
          <button onClick={() => setIsOpen(false)} className="w-full text-left px-4 py-2 text-sm hover:bg-[#FCE9D8]" style={{ color: '#3F2E23' }}>Settings</button>
          <button onClick={() => setIsOpen(false)} className="w-full text-left px-4 py-2 text-sm hover:bg-[#FCE9D8]" style={{ color: '#3F2E23' }}>Support</button>
          <div className="border-t my-1" style={{ borderColor: '#E8D5B5' }}></div>
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full text-left px-4 py-2 text-sm hover:bg-[#FCE9D8]" style={{ color: '#3F2E23' }}>Logout</button>
        </div>
      )}
    </div>
  );
};


const NavLink = ({ href, children, isCollapsed, exact = false }: { href: string, children: React.ReactNode, isCollapsed: boolean, exact?: boolean }) => {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  const activeStyle = {
    backgroundColor: '#E8D5B5',
    color: '#D96C39',
  };
  const defaultStyle = {
    color: '#6B4F3E',
  };
  
  return (
      <Link
        href={href}
        className="flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-[#E8D5B5] hover:text-[#D96C39]"
        style={isActive ? activeStyle : defaultStyle}
      >
        {children}
      </Link>
  );
};

// --- Main Layout Component ---

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };
  
  const SidebarContent = ({ isCollapsed }: { isCollapsed: boolean }) => (
      <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
        <NavLink href="/admin" isCollapsed={isCollapsed} exact={true}>
          <Home className="h-5 w-5" />
          {!isCollapsed && 'Dashboard'}
        </NavLink>
        <NavLink href="/admin/orders" isCollapsed={isCollapsed}>
          <ShoppingCart className="h-5 w-5" />
          {!isCollapsed && (
            <>
              Đơn hàng
            </>
          )}
        </NavLink>
        <NavLink href="/admin/products" isCollapsed={isCollapsed}>
          <Package className="h-5 w-5" />
          {!isCollapsed && 'Sản phẩm'}
        </NavLink>
        <NavLink href="/admin/chat" isCollapsed={isCollapsed}>
          <MessageSquare className="h-5 w-5" />
          {!isCollapsed && 'Chat'}
        </NavLink>
      </nav>
  );


  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          success: {
            style: {
              background: '#28a745',
              color: 'white',
            },
          },
        }}
      />
      <div
        className={`grid min-h-screen w-full ${
          isSidebarCollapsed ? 'md:grid-cols-[80px_1fr]' : 'md:grid-cols-[280px_1fr]'
        } transition-all duration-300 ease-in-out`}
        style={{ backgroundColor: '#F7F1E8' }}
      >
        {/* --- Desktop Sidebar --- */}
        <div className="hidden md:block" style={{ backgroundColor: '#F7F1E8', borderRight: '1px solid #E8D5B5' }}>
          <div className="flex h-full max-h-screen flex-col">
            <div className="flex h-14 items-center justify-center border-b px-4 lg:h-[60px] lg:px-6" style={{ borderColor: '#E8D5B5' }}>
              <button onClick={toggleSidebar} className="flex items-center gap-2 font-semibold" style={{ color: '#3F2E23' }}>
                <Image src="/tramhon-logo.png" alt="TramHon Logo" width={40} height={40} />
                {!isSidebarCollapsed && <span className="transition-opacity duration-300 ease-in-out">TRAMHON</span>}
              </button>
            </div>
            <div className="flex-1 py-4">
              <SidebarContent isCollapsed={isSidebarCollapsed} />
            </div>
          </div>
        </div>

        {/* --- Mobile Menu Overlay (replaces Sheet) --- */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="fixed left-0 top-0 h-full w-4/5 max-w-xs flex flex-col p-4" style={{ backgroundColor: '#F7F1E8' }} onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-lg font-semibold" style={{ color: '#3F2E23' }}>
                        <Image src="/tramhon-logo.png" alt="TramHon Logo" width={30} height={30} />
                        <span>TRAMHON</span>
                      </div>
                      <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-full hover:bg-[#E8D5B5]">
                          <X className="h-5 w-5" style={{ color: '#3F2E23' }}/>
                      </button>
                  </div>
                  <SidebarContent isCollapsed={false} />
              </div>
          </div>
        )}

        {/* --- Main Header and Content --- */}
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b px-4 lg:h-[60px] lg:px-6" style={{ backgroundColor: '#F7F1E8', borderColor: '#E8D5B5' }}>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="shrink-0 md:hidden h-10 w-10 flex items-center justify-center rounded-md"
              style={{ border: '1px solid #E8D5B5', color: '#3F2E23' }}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </button>
            
            <div className="w-full flex-1">
              {/* Header content can go here */}
            </div>
            
            <UserDropdown />

          </header>
          <main className="flex-1 overflow-y-auto p-6 md:px-10 lg:px-12 py-12">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}