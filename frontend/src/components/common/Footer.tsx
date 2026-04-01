import Link from "next/link";
import { Store, Heart, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#3F2E23] text-[#E8D5B5] mt-auto">
      <div className="container mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="space-y-4">
          <div className="text-2xl font-black text-white tracking-wider flex items-center gap-2">
            <Store className="text-[#D96C39]" size={28} />
            TRAMHON
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            Sàn thương mại điện tử kết nối trực tiếp những người yêu nghệ thuật với các nghệ nhân thủ công tài hoa trên toàn quốc. Độc bản, tinh tế và mang đậm dấu ấn cá nhân.
          </p>
        </div>

        {/* Khám phá */}
        <div>
          <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Khám phá</h3>
          <ul className="text-sm text-gray-400 space-y-3">
            <li><Link href="/shop/products" className="hover:text-[#D96C39] hover:translate-x-1 inline-block transition-transform">Tất cả sản phẩm</Link></li>
            <li><Link href="/custom-request/new" className="hover:text-[#D96C39] hover:translate-x-1 inline-block transition-transform">Đặt làm riêng (Custom)</Link></li>
            <li><Link href="/shop/products?sort=featured" className="hover:text-[#D96C39] hover:translate-x-1 inline-block transition-transform">Sản phẩm nổi bật</Link></li>
            <li><Link href="/shop/artisans" className="hover:text-[#D96C39] hover:translate-x-1 inline-block transition-transform">Danh sách gian hàng</Link></li>
          </ul>
        </div>

        {/* Hỗ trợ */}
        <div>
          <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Hỗ trợ khách hàng</h3>
          <ul className="text-sm text-gray-400 space-y-3">
            <li><Link href="#" className="hover:text-[#D96C39] hover:translate-x-1 inline-block transition-transform">Hướng dẫn mua hàng</Link></li>
            <li><Link href="#" className="hover:text-[#D96C39] hover:translate-x-1 inline-block transition-transform">Quy trình làm việc với Nghệ nhân</Link></li>
            <li><Link href="#" className="hover:text-[#D96C39] hover:translate-x-1 inline-block transition-transform">Chính sách đổi trả & bảo hành</Link></li>
            <li><Link href="#" className="hover:text-[#D96C39] hover:translate-x-1 inline-block transition-transform">Theo dõi đơn hàng</Link></li>
          </ul>
        </div>

        {/* Liên hệ */}
        <div>
          <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Liên hệ</h3>
          <ul className="text-sm text-gray-400 space-y-4">
            <li className="flex items-start gap-3">
              <MapPin size={18} className="text-[#D96C39] flex-shrink-0 mt-0.5" />
              <span>Hanoi University of Industry, Minh Khai, Bac Tu Liem, Hanoi</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={18} className="text-[#D96C39] flex-shrink-0" />
              <span>+84 123 456 789</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={18} className="text-[#D96C39] flex-shrink-0" />
              <span>support@tramhon.vn</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 bg-black/20">
        <div className="container mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xs text-gray-500">
            © {new Date().getFullYear()} TRAMHON Handmade.
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            Phát triển với <Heart size={14} className="text-red-500 fill-red-500" /> bởi team TRAMHON
          </div>
        </div>
      </div>
    </footer>
  );
}