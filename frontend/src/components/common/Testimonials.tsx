import { Star, Quote } from 'lucide-react';

export default function Testimonials() {
  const reviews = [
    {
      name: "Hoàng An",
      shop: "relax_sheep",
      text: "Mình đặt làm một chiếc ví da nam khắc tên tặng sinh nhật sếp. Bạn thợ chat tư vấn chọn loại da rất kỹ, đường may sắc sảo cực kỳ. Sếp khen nức nở!",
    },
    {
      name: "Minh Trang",
      shop: "moon_knight",
      text: "Tìm mỏi mắt không ra bộ ấm trà màu xanh rêu cổ, may sao lên đây tìm được xưởng nhận làm riêng. Chờ 2 tuần nhưng thành phẩm nhận về thực sự xứng đáng từng xu.",
    },
    {
      name: "Đức Tuấn",
      shop: "handmade_king",
      text: "Giao diện website dễ xài, phần chat với nghệ nhân mượt mà, lại có tính năng chốt giá an toàn nữa. Đã mua cái đồng hồ gỗ thứ 3 trên đây rồi.",
    }
  ];

  return (
    <section className="mt-24 mb-16 bg-[#3F2E23] rounded-3xl p-8 md:p-16 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D96C39]/20 rounded-full blur-3xl"></div>

      <div className="text-center mb-12 relative z-10">
        <h2 className="text-3xl font-extrabold text-white mb-4">Cộng đồng yêu thủ công nói gì?</h2>
        <div className="h-1 w-24 mx-auto rounded-full bg-[#D96C39]"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {reviews.map((r, idx) => (
          <div key={idx} className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:-translate-y-2 transition-transform duration-300">
            <Quote className="text-[#D96C39] mb-4 opacity-50" size={32} />
            <p className="text-gray-200 text-sm leading-relaxed mb-6 min-h-[80px]">"{r.text}"</p>
            
            <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-auto">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#D96C39] to-orange-400 rounded-full flex items-center justify-center font-bold text-white shadow-md">
                  {r.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{r.name}</div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
                    Đã đặt tại gian hàng <span className="text-[#D96C39]">{r.shop}</span>
                  </div>
                </div>
              </div>
              <div className="flex text-yellow-400">
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}