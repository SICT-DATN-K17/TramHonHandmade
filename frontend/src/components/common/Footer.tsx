import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="container mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <div className="font-semibold">TRAMHON Handmade</div>
          <p className="text-sm text-gray-500 mt-2">Sản phẩm thủ công độc đáo, làm theo đặt hàng.</p>
        </div>

        <div>
          <div className="font-medium mb-2">Thông tin</div>
          <ul className="text-sm text-gray-600 space-y-2">
            <li><Link href="#" className="hover:underline">Về chúng tôi</Link></li>
            <li><Link href="#" className="hover:underline">Chính sách</Link></li>
            <li><Link href="#" className="hover:underline">Liên hệ</Link></li>
          </ul>
        </div>

        <div>
          <div className="font-medium mb-2">Hỗ trợ</div>
          <ul className="text-sm text-gray-600 space-y-2">
            <li><Link href="#" className="hover:underline">Hướng dẫn mua hàng</Link></li>
            <li><Link href="#" className="hover:underline">Theo dõi đơn hàng</Link></li>
          </ul>
        </div>

        <div>
          <div className="font-medium mb-2">Theo dõi</div>
          <div className="flex gap-3 mt-2">
            <Link href="#" className="text-sm hover:underline">Facebook</Link>
            <Link href="#" className="text-sm hover:underline">Instagram</Link>
          </div>
        </div>
      </div>

      <div className="bg-white border-t">
        <div className="container mx-auto px-6 py-4 text-xs text-gray-500 text-center">
          © {new Date().getFullYear()} TRAMHON — All rights reserved.
        </div>
      </div>
    </footer>
  );
}