export default function HowItWorks() {
  return (
    <section className="mt-12 bg-yellow-50 rounded-xl p-8">
      <h2 className="text-lg font-semibold mb-6">Cách đặt hàng / yêu cầu làm riêng</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="flex gap-4 items-start bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center font-bold text-[#0f172a] flex-shrink-0">1</div>
          <div>
            <div className="font-medium">Chọn sản phẩm</div>
            <div className="text-sm text-gray-600">Duyệt danh mục hoặc tìm kiếm</div>
          </div>
        </div>
        <div className="flex gap-4 items-start bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center font-bold text-[#0f172a] flex-shrink-0">2</div>
          <div>
            <div className="font-medium">Gửi yêu cầu</div>
            <div className="text-sm text-gray-600">Mô tả kích thước, chất liệu</div>
          </div>
        </div>
        <div className="flex gap-4 items-start bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center font-bold text-[#0f172a] flex-shrink-0">3</div>
          <div>
            <div className="font-medium">Theo dõi & nhận hàng</div>
            <div className="text-sm text-gray-600">Kiểm tra tiến độ và giao hàng</div>
          </div>
        </div>
      </div>
    </section>
  );
}