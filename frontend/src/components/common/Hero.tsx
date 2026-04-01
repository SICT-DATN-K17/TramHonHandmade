'use client';

import { useState, useEffect } from 'react';
import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowRight, Store } from 'lucide-react';

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative overflow-hidden bg-[#F7F1E8] rounded-3xl mt-6 px-6 py-12 md:px-16 md:py-20 border border-[#E8D5B5]">
      {/* Background Decorative */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#D96C39] opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#3F2E23] opacity-10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left content */}
        <div className={`space-y-8 transform transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFF8F0] border border-[#D96C39]/30 text-[#D96C39] text-sm font-bold shadow-sm">
            <Sparkles size={16} /> Nơi hội tụ của những đôi tay tài hoa
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-[#3F2E23]">
            Sở hữu kiệt tác <br />
            <span className="text-[#D96C39]">mang dấu ấn của riêng bạn</span>
          </h1>
          
          <p className="text-lg text-[#6B4F3E] max-w-xl leading-relaxed">
            Khám phá hàng ngàn sản phẩm thủ công độc bản từ các gian hàng nghệ nhân trên toàn quốc. Mua ngay hoặc chat trực tiếp để đặt chế tác theo yêu cầu.
          </p>
          
          <div className="flex flex-wrap gap-4 pt-2">
            <Link href="/shop/products" className="inline-flex items-center gap-2 bg-[#D96C39] text-white px-8 py-4 rounded-full font-bold hover:bg-[#C25B2D] hover:shadow-lg hover:-translate-y-1 transition-all">
              Khám phá sản phẩm <ArrowRight size={18} />
            </Link>
            <Link href="/custom-request/new" className="inline-flex items-center gap-2 bg-white border-2 border-[#3F2E23] text-[#3F2E23] px-8 py-4 rounded-full font-bold hover:bg-[#3F2E23] hover:text-white transition-all">
              Tạo yêu cầu làm riêng
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-[#E8D5B5]/60">
            <div>
              <div className="text-3xl font-extrabold text-[#D96C39]">50+</div>
              <div className="text-sm font-medium text-[#6B4F3E] mt-1">Nghệ nhân</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-[#D96C39]">2k+</div>
              <div className="text-sm font-medium text-[#6B4F3E] mt-1">Sản phẩm độc bản</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-[#D96C39]">99%</div>
              <div className="text-sm font-medium text-[#6B4F3E] mt-1">Khách hài lòng</div>
            </div>
          </div>
        </div>

        {/* Right image */}
        <div className={`hidden lg:block transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-10 opacity-0 scale-95'}`}>
          <div className="relative w-full aspect-square max-w-md mx-auto">
            {/* Main image container */}
            <div className="absolute inset-0 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white bg-[#E8D5B5] rotate-3 hover:rotate-0 transition-transform duration-500 z-10">
              <Image 
                src="/hero-handmade.jpg" 
                alt="Đồ thủ công handmade" 
                fill 
                className="object-cover"
                priority 
              />
            </div>
            
            {/* Decorative back image */}
            <div className="absolute inset-0 rounded-[2rem] overflow-hidden border-4 border-white bg-[#D96C39] -rotate-6 z-0 opacity-80"></div>

            {/* Floating badge */}
            <div className="absolute -bottom-6 -left-10 bg-white border border-[#E8D5B5] p-4 rounded-2xl shadow-xl z-20 flex items-center gap-4 animate-bounce hover:animate-none">
              <div className="w-12 h-12 bg-[#FFF8F0] rounded-full flex items-center justify-center text-[#D96C39]">
                <Store size={24} />
              </div>
              <div>
                <div className="text-sm font-bold text-[#3F2E23]">Gian hàng trực tiếp</div>
                <div className="text-xs text-[#6B4F3E]">Không qua trung gian</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}