import { Search, MessageSquareCode, Gift } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      icon: <Search size={28} />,
      title: "1. Khám phá & Chọn lựa",
      desc: "Dạo quanh các gian hàng của những nghệ nhân tài hoa. Tìm món đồ bạn ưng ý hoặc lấy cảm hứng cho ý tưởng riêng."
    },
    {
      icon: <MessageSquareCode size={28} />,
      title: "2. Trò chuyện & Chốt ý tưởng",
      desc: "Nhắn tin trực tiếp với nghệ nhân để yêu cầu khắc tên, đổi màu sắc, kích thước, hoặc gửi bản vẽ làm từ số 0."
    },
    {
      icon: <Gift size={28} />,
      title: "3. Chế tác & Nhận hàng",
      desc: "Nghệ nhân gửi báo giá (Proposal), bạn thanh toán an toàn qua Trạm Hồn. Sau đó chỉ việc chờ siêu phẩm về tay."
    }
  ];

  return (
    <section className="mt-20 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-extrabold text-[#3F2E23] mb-4">Làm thế nào để sở hữu món đồ độc bản?</h2>
        <div className="h-1 w-24 mx-auto rounded-full bg-[#D96C39]"></div>
        <p className="text-[#6B4F3E] mt-4 max-w-2xl mx-auto">Quy trình kết nối trực tiếp với thợ thủ công chưa bao giờ dễ dàng và minh bạch đến thế.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        {/* Đường kẻ nối giữa các bước (chỉ hiện trên Desktop) */}
        <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-[#D96C39]/10 via-[#D96C39] to-[#D96C39]/10 z-0"></div>

        {steps.map((step, idx) => (
          <div key={idx} className="relative z-10 flex flex-col items-center text-center group">
            <div className="w-24 h-24 bg-[#FFF8F0] border-4 border-white shadow-lg rounded-full flex items-center justify-center text-[#D96C39] mb-6 group-hover:scale-110 group-hover:bg-[#D96C39] group-hover:text-white transition-all duration-300">
              {step.icon}
            </div>
            <h3 className="text-xl font-bold text-[#3F2E23] mb-3">{step.title}</h3>
            <p className="text-[#6B4F3E] leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}