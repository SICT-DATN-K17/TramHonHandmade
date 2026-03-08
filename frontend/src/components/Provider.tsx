'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';
import { CartProvider } from '@/contexts/CartContext';

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>{children}</CartProvider>
    </SessionProvider>
  );
}
