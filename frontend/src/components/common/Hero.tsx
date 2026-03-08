'use client';

import { useState, useEffect } from 'react';
import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-yellow-50 rounded-xl p-8 md:p-12">
      {/* Left content */}
      <div className={`space-y-6 transform transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
        <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">Đồ thủ công độc đáo, đặt theo yêu cầu</h1>
        <p className="text-gray-600 max-w-xl">
          Sản phẩm thủ công tay làm, chất liệu tinh tế, thiết kế riêng theo ý bạn. Khám phá danh mục, đặt hàng hoặc yêu cầu làm riêng.
        </p>
        <div className="flex gap-4">
          <Link href="/shop/products" className="inline-block bg-[#0f172a] text-white px-6 py-3 rounded-full text-sm hover:bg-[#1e293b] transition-colors">Mua ngay</Link>
          <Link href="/shop/products" className="inline-block border border-gray-300 px-6 py-3 rounded-full text-sm hover:border-[#0f172a] hover:text-[#0f172a] transition-colors">Xem danh mục</Link>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center">
            <div className="text-lg font-semibold">1000+</div>
            <div className="text-xs text-gray-500">Sản phẩm</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">500+</div>
            <div className="text-xs text-gray-500">Khách hàng</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">10 năm</div>
            <div className="text-xs text-gray-500">Kinh nghiệm</div>
          </div>
        </div>
      </div>

      {/* Right image */}
      <div className={`hidden md:block transform transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-10 opacity-0 scale-95'}`}>
        <div className="relative">
          {/* Background decorative element */}
          <div className="absolute -inset-4 bg-gradient-to-br from-orange-100/30 to-yellow-100/30 rounded-3xl blur-2xl"></div>
          
          {/* Main image container */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 group">
            <Image 
              src="/hero-handmade.jpg" 
              alt="Handmade products" 
              width={500} 
              height={600} 
              className="w-full h-auto object-cover transform group-hover:scale-110 transition-transform duration-500"
              priority 
            />
            
            {/* Overlay gradient on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>

          {/* Floating badge */}
          <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-3 rounded-full shadow-lg font-semibold text-sm transform hover:scale-110 transition-transform duration-300 cursor-pointer">
            ✨ Yêu cầu làm riêng
          </div>
        </div>
      </div>
    </section>
  );
}