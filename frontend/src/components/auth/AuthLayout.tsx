import Image from 'next/image';
import React, { ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Props {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  imageOnLeft?: boolean;
  bottomNote?: string;
  bottomLinkText?: string;
  bottomLinkHref?: string;
  onBottomLinkClick?: () => void;
}

export default function AuthLayout({
  title = 'Create Your Account',
  subtitle = 'Let\'s create & access exclusive handmade products',
  children,
  imageOnLeft = false,
  bottomNote,
  bottomLinkText,
  bottomLinkHref,
  onBottomLinkClick
}: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ backgroundColor: '#F7F1E8' }}>
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-lg overflow-hidden" style={{ border: '1px solid rgba(107,79,62,0.06)' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* LOGO PANEL */}
          <motion.div
            layout
            transition={{ duration: 0.5, type: 'spring', bounce: 0.2 }}
            className={`relative hidden lg:block ${imageOnLeft ? 'lg:order-first' : 'lg:order-last'}`}
            style={{ backgroundColor: '#F4C27A', minHeight: '600px' }}
          >
            {/* Logo - fit full size */}
            <div className="absolute inset-0 flex items-start justify-center p-8">
              <div className="w-full h-full relative">
                <Image
                  src="/tramhon-logo.png"
                  alt="TramHon Logo"
                  fill
                  style={{ objectFit: 'contain' }}
                  sizes="(max-width: 1024px) 50vw, 50vw"
                  priority
                />
              </div>
            </div>
          </motion.div>

          {/* FORM */}
          <div className={`p-10 lg:p-14 ${imageOnLeft ? 'lg:order-last' : 'lg:order-first'}`}>
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-semibold" style={{ color: '#3F2E23' }}>{title}</h1>
              <p className="mt-2 text-sm" style={{ color: '#6B4F3E' }}>{subtitle}</p>
            </div>

            <div>
              {children}
            </div>

            {/* Chỉ hiển thị phần chân form khi có nội dung */}
            {(bottomNote || bottomLinkText) && (
              <div className="mt-6 text-center">
                  <p className="text-sm" style={{ color: '#6B4F3E' }}>
                    {bottomNote}{' '}
                    {onBottomLinkClick ? (
                      <button type="button" onClick={onBottomLinkClick} className="font-medium hover:underline" style={{ color: '#D96C39' }}>
                        {bottomLinkText}
                      </button>
                    ) : (
                      <Link href={bottomLinkHref || '#'} className="font-medium" style={{ color: '#D96C39' }}>
                        {bottomLinkText}
                      </Link>
                    )}
                  </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}