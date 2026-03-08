export default function Testimonials() {
  const names = ["Nguyễn A", "Trần B", "Lê C"];
  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold mb-4">Khách hàng nói về chúng tôi</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {names.map((n) => (
          <div key={n} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">🙂</div>
              <div>
                <div className="font-medium">{n}</div>
                <div className="text-xs text-gray-500">Khách hàng</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-3">Rất hài lòng với sản phẩm, chất lượng tốt và giao hàng nhanh.</p>
          </div>
        ))}
      </div>
    </section>
  );
}