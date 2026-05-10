'use client';

import { useState, useEffect } from 'react';
import useAxiosAuth from '@/hooks/useAxiosAuth';
import useAllChats from '@/hooks/useAllChats';
import { Package, MessageSquare, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ArtisanHomePage() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  const [month, setMonth] = useState<number | 'ALL'>(currentDate.getMonth() + 1);
  const [year, setYear] = useState<number | 'ALL'>(currentYear);
  
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderStats, setOrderStats] = useState({ total: 0, revenue: 0 });
  const [chatStats, setChatStats] = useState(0);

  const axiosAuth = useAxiosAuth();
  const { chatDataDetails, isLoading: chatsLoading } = useAllChats();

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    const fetchOrders = async () => {
      setOrdersLoading(true);
      try {
        const ordersRes = await axiosAuth.get('/orders/artisan/all');
        const orders = Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data?.content || []);

        const filteredOrders = orders.filter((order: any) => {
            const orderDate = new Date(order.createdAt || order.created_at || order.order_date);
            const orderMonth = orderDate.getMonth() + 1;
            const orderYear = orderDate.getFullYear();

            const matchMonth = month === 'ALL' || orderMonth === month;
            const matchYear = year === 'ALL' || orderYear === year;

            return matchMonth && matchYear;
        });

        let revenue = 0;
        let validOrderCount = 0;
        filteredOrders.forEach((o: any) => {
            const status = o.status?.toUpperCase();
            if (status !== 'CANCELLED' && status !== 'REFUNDED') {
                validOrderCount++;
                revenue += Number(o.total || o.total_price || o.subtotal || 0);
            }
        });
        setOrderStats({ total: validOrderCount, revenue });

      } catch (error) {
        console.error("Lỗi lấy dữ liệu đơn hàng:", error);
        toast.error("Không thể tải dữ liệu đơn hàng!");
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [month, year, axiosAuth]);

  useEffect(() => {
      if (chatDataDetails && chatDataDetails.length > 0) {
          const filteredChats = chatDataDetails.filter((item: any) => {
              const chatDate = new Date(item.chat?.created_at || item.chat?.createdAt || new Date());
              const chatMonth = chatDate.getMonth() + 1;
              const chatYear = chatDate.getFullYear();

              const matchMonth = month === 'ALL' || chatMonth === month;
              const matchYear = year === 'ALL' || chatYear === year;

              return matchMonth && matchYear;
          });
          setChatStats(filteredChats.length);
      } else {
          setChatStats(0);
      }
  }, [month, year, chatDataDetails]);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getTimeLabel = () => {
    if (month === 'ALL' && year === 'ALL') return 'Tất cả thời gian';
    if (month === 'ALL') return `Trong năm ${year}`;
    if (year === 'ALL') return `Mọi năm (Tháng ${month})`;
    return `Trong tháng ${month}/${year}`;
  };

  const isLoading = ordersLoading || chatsLoading;

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4" style={{ borderColor: '#E8D5B5' }}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#3F2E23' }}>Tổng quan hoạt động</h1>
          <p className="mt-1 text-sm font-medium" style={{ color: '#6B4F3E' }}>Theo dõi hiệu suất kinh doanh và yêu cầu của khách hàng.</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm border" style={{ borderColor: '#E8D5B5' }}>
          <Calendar className="w-5 h-5 text-gray-500 ml-2" />
          <select 
            value={month} 
            onChange={(e) => setMonth(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="bg-transparent font-medium focus:outline-none cursor-pointer"
            style={{ color: '#3F2E23' }}
          >
            <option value="ALL">Tất cả các tháng</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>Tháng {m}</option>
            ))}
          </select>
          <span className="text-gray-300">|</span>
          <select 
            value={year} 
            onChange={(e) => setYear(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="bg-transparent font-medium focus:outline-none cursor-pointer pr-2"
            style={{ color: '#3F2E23' }}
          >
            <option value="ALL">Tất cả các năm</option>
            {years.map(y => (
              <option key={y} value={y}>Năm {y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards thống kê */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#D96C39' }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card Đơn hàng */}
            <div className="bg-white rounded-xl shadow-sm p-6 border relative overflow-hidden transition-all hover:shadow-md" style={{ borderColor: '#E8D5B5' }}>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Package className="w-16 h-16" />
                </div>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-full" style={{ backgroundColor: '#FCE9D8' }}>
                        <Package className="w-6 h-6" style={{ color: '#D96C39' }} />
                    </div>
                    <h3 className="font-semibold text-lg" style={{ color: '#6B4F3E' }}>Đơn hàng (Hợp lệ)</h3>
                </div>
                <div className="text-4xl font-bold" style={{ color: '#3F2E23' }}>
                    {orderStats.total}
                </div>
                <p className="text-sm mt-2 font-medium" style={{ color: '#8A7A6B' }}>{getTimeLabel()}</p>
            </div>

            {/* Card Doanh thu */}
            <div className="bg-white rounded-xl shadow-sm p-6 border relative overflow-hidden transition-all hover:shadow-md" style={{ borderColor: '#E8D5B5' }}>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <TrendingUp className="w-16 h-16" />
                </div>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-full bg-green-100">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-lg" style={{ color: '#6B4F3E' }}>Doanh thu ước tính</h3>
                </div>
                <div className="text-3xl font-bold text-green-700">
                    {formatVND(orderStats.revenue)}
                </div>
                <p className="text-sm mt-2 font-medium" style={{ color: '#8A7A6B' }}>Dựa trên đơn hoàn thành/đang giao</p>
            </div>

            {/* Card Yêu cầu làm riêng */}
            <div className="bg-white rounded-xl shadow-sm p-6 border relative overflow-hidden transition-all hover:shadow-md" style={{ borderColor: '#E8D5B5' }}>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <MessageSquare className="w-16 h-16" />
                </div>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-full bg-blue-100">
                        <MessageSquare className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-lg" style={{ color: '#6B4F3E' }}>Yêu cầu làm riêng</h3>
                </div>
                <div className="text-4xl font-bold" style={{ color: '#3F2E23' }}>
                    {chatStats}
                </div>
                <p className="text-sm mt-2 font-medium" style={{ color: '#8A7A6B' }}>Khách hàng cần tư vấn</p>
            </div>

        </div>
      )}
    </div>
  );
}