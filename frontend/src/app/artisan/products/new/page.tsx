'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Image as ImageIcon, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAxiosAuth from '@/hooks/useAxiosAuth';
import { RawCategoryResponse } from '@/types/apiTypes';
import {mapToEnrichedCategory, EnrichedCategory } from "@/utils/CategoryMapper";

const NewProductPage = () => {
    const router = useRouter();

    // 1. Khởi tạo hook axiosAuth
    const axiosAuth = useAxiosAuth();

    const [loading, setLoading] = useState(false);
    const [imageError, setImageError] = useState(false);

    // State quản lý dữ liệu form
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        categoryId: '',
        stockQuantity: '',
        image: '',
        status: 'ACTIVE',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'image') {
            setImageError(false);
        }
    };

        const [categories, setCategories] = useState<EnrichedCategory[]>([]);

    // 2. Fetch Categories dùng axiosAuth
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                // Sử dụng axiosAuth.get
                const response = await axiosAuth.get<RawCategoryResponse[]>('/category/');
                const cats = response.data.map(mapToEnrichedCategory);
                setCategories(cats);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
                toast.error('Không thể tải danh sách danh mục');
            }
        };

        fetchCategories();
    }, [axiosAuth]); // Thêm axiosAuth vào dependency

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // --- VALIDATION ---
        if (!formData.name.trim()) {
            toast.error('Vui lòng nhập tên sản phẩm');
            setLoading(false);
            return;
        }
        if (!formData.categoryId) {
            toast.error('Vui lòng chọn danh mục sản phẩm');
            setLoading(false);
            return;
        }
        if (!formData.price || Number(formData.price) < 0) {
            toast.error('Giá sản phẩm không hợp lệ (phải >= 0)');
            setLoading(false);
            return;
        }
        if (!formData.stockQuantity || Number(formData.stockQuantity) < 0) {
            toast.error('Số lượng tồn kho không hợp lệ (phải >= 0)');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                image: formData.image,
                status: formData.status,
                price: Number(formData.price) || 0,
                stock_quantity: Number(formData.stockQuantity) || 0,
                category_id: Number(formData.categoryId),
            };

            // 3. Post sản phẩm dùng axiosAuth
            // Axios tự động stringify JSON, chỉ cần truyền object payload
            await axiosAuth.post('/products/', payload);

            toast.success('Tạo sản phẩm mới thành công!');
            router.push('/artisan/products');
            // router.refresh() được dùng để yêu cầu Next.js làm mới lại dữ liệu ở route hiện tại.
            // Khi được gọi sau router.push(), nó sẽ đảm bảo rằng khi trang danh sách sản phẩm
            // được tải, nó sẽ lấy dữ liệu mới nhất từ server thay vì từ cache.
            router.refresh();
        } catch (error: any) {
            console.error('Create product error:', error);
            // Xử lý thông báo lỗi chi tiết hơn nếu server trả về message
            const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi tạo sản phẩm';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-full hover:bg-black/5 transition-colors"
                        title="Quay lại"
                    >
                        <ArrowLeft className="w-6 h-6" style={{ color: '#3F2E23' }} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: '#3F2E23' }}>
                            Tạo sản phẩm mới
                        </h1>
                        <p className="text-sm" style={{ color: '#6B4F3E' }}>
                            Điền thông tin chi tiết để thêm sản phẩm vào hệ thống.
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 rounded-lg border font-medium transition-colors hover:bg-black/5"
                        style={{ borderColor: '#E8D5B5', color: '#3F2E23' }}
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg font-medium text-white transition-colors flex items-center gap-2 shadow-sm hover:opacity-90"
                        style={{ backgroundColor: '#3F2E23' }}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Lưu sản phẩm
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cột bên trái: Thông tin chính */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-xl shadow-sm p-6" style={{ backgroundColor: '#F7F1E8', border: '1px solid #E8D5B5' }}>
                        <h2 className="text-lg font-semibold mb-4" style={{ color: '#3F2E23' }}>Thông tin chung</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: '#3F2E23' }}>Tên sản phẩm</label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Ví dụ: Túi tote vải canvas..."
                                    className="w-full px-3 py-2 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-[#3F2E23]/20 transition-all"
                                    style={{ borderColor: '#E8D5B5', color: '#3F2E23' }}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: '#3F2E23' }}>Danh mục</label>
                                <select
                                    name="categoryId"
                                    value={formData.categoryId}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-[#3F2E23]/20 transition-all"
                                    style={{ borderColor: '#E8D5B5', color: '#3F2E23' }}
                                >
                                    <option value="">Chọn danh mục...</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: '#3F2E23' }}>Trạng thái</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-[#3F2E23]/20 transition-all"
                                    style={{ borderColor: '#E8D5B5', color: '#3F2E23' }}
                                >
                                    <option value="ACTIVE">Hoạt động</option>
                                    <option value="HIDDEN">Ẩn</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#3F2E23' }}>Giá bán (VNĐ)</label>
                                    <input
                                        name="price"
                                        type="number"
                                        value={formData.price}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="w-full px-3 py-2 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-[#3F2E23]/20 transition-all"
                                        style={{ borderColor: '#E8D5B5', color: '#3F2E23' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#3F2E23' }}>Số lượng tồn kho</label>
                                    <input
                                        name="stockQuantity"
                                        type="number"
                                        value={formData.stockQuantity}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="w-full px-3 py-2 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-[#3F2E23]/20 transition-all"
                                        style={{ borderColor: '#E8D5B5', color: '#3F2E23' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: '#3F2E23' }}>Mô tả sản phẩm</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={5}
                                    placeholder="Mô tả chi tiết về chất liệu, kích thước, công dụng..."
                                    className="w-full px-3 py-2 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-[#3F2E23]/20 transition-all resize-none"
                                    style={{ borderColor: '#E8D5B5', color: '#3F2E23' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cột bên phải: Hình ảnh & Phân loại */}
                <div className="space-y-6">
                    {/* Phần Hình ảnh - Theo yêu cầu: URL trên, Hình dưới */}
                    <div className="rounded-xl shadow-sm p-6" style={{ backgroundColor: '#F7F1E8', border: '1px solid #E8D5B5' }}>
                        <h2 className="text-lg font-semibold mb-4" style={{ color: '#3F2E23' }}>Hình ảnh</h2>

                        <div className="space-y-4">
                            {/* 1. Input URL Hình ảnh */}
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: '#3F2E23' }}>URL Hình ảnh</label>
                                <input
                                    name="image"
                                    value={formData.image}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                    className="w-full px-3 py-2 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-[#3F2E23]/20 transition-all text-sm"
                                    style={{ borderColor: '#E8D5B5', color: '#3F2E23' }}
                                />
                            </div>

                            {/* 2. Thẻ hiển thị hình ảnh (Preview) */}
                            <div
                                className="aspect-square w-full rounded-lg border-2 border-dashed flex flex-col items-center justify-center overflow-hidden bg-white relative transition-all"
                                style={{ borderColor: '#E8D5B5' }}
                            >
                                {formData.image && !imageError ? (
                                    // Nếu có URL -> Hiển thị hình ảnh
                                    <Image
                                        src={formData.image}
                                        alt="Preview"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                        onError={() => setImageError(true)}
                                    />
                                ) : (
                                    // Nếu chưa có URL -> Hiển thị placeholder
                                    <div className="text-center p-4 select-none">
                                        <div className="w-12 h-12 rounded-full bg-[#F7F1E8] flex items-center justify-center mx-auto mb-3">
                                            <ImageIcon className="w-6 h-6" style={{ color: '#6B4F3E' }} />
                                        </div>
                                        <p className="text-sm font-medium" style={{ color: '#3F2E23' }}>
                                            Chưa có hình ảnh
                                        </p>
                                        <p className="text-xs mt-1" style={{ color: '#6B4F3E' }}>
                                            Nhập URL ở trên để xem trước
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewProductPage;