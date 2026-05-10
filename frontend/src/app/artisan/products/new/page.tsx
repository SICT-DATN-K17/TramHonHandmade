'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Image as ImageIcon, Loader2, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import useAxiosAuth from '@/hooks/useAxiosAuth';
import { mapToEnrichedCategory, EnrichedCategory } from "@/utils/CategoryMapper";

const NewProductPage = () => {
    const router = useRouter();
    const axiosAuth = useAxiosAuth();

    const [loading, setLoading] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [categories, setCategories] = useState<EnrichedCategory[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        categoryId: '',
        image: '',
        status: 'ACTIVE',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'image') setImageError(false);
    };

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axiosAuth.get<any>('/categories/');
                const rawCats = Array.isArray(response.data) ? response.data : response.data.content || [];
                const cats = rawCats.map(mapToEnrichedCategory);
                setCategories(cats);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
                toast.error('Không thể tải danh sách danh mục');
            }
        };

        fetchCategories();
    }, [axiosAuth]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.name.trim()) {
            toast.error('Vui lòng nhập tên sản phẩm');
            setLoading(false); return;
        }
        if (!formData.categoryId) {
            toast.error('Vui lòng chọn danh mục sản phẩm');
            setLoading(false); return;
        }
        if (!formData.price || Number(formData.price) < 0) {
            toast.error('Giá sản phẩm không hợp lệ (phải >= 0)');
            setLoading(false); return;
        }

        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                image: formData.image,
                status: formData.status,
                price: Number(formData.price) || 0,
                stockQuantity: 0, 
                categoryId: Number(formData.categoryId),
            };

            await axiosAuth.post('/products/', payload);

            toast.success('Tạo sản phẩm mới thành công!');
            window.dispatchEvent(new Event('products-refresh'));
            router.push('/artisan/products');
            router.refresh();
        } catch (error: any) {
            console.error('Create product error:', error);
            const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi tạo sản phẩm';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-full hover:bg-black/5 transition-colors shadow-sm bg-white"
                        title="Quay lại"
                    >
                        <ArrowLeft className="w-5 h-5" style={{ color: '#3F2E23' }} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#3F2E23' }}>
                            Tạo sản phẩm mới
                        </h1>
                        <p className="text-sm mt-1" style={{ color: '#6B4F3E' }}>
                            Điền thông tin chi tiết để thêm sản phẩm vào hệ thống.
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-2.5 rounded-full border font-medium transition-colors hover:bg-black/5"
                        style={{ borderColor: '#E8D5B5', color: '#3F2E23' }}
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2.5 rounded-full font-medium text-white transition-all transform hover:scale-105 flex items-center gap-2 shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#D96C39' }}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {loading ? 'Đang lưu...' : 'Lưu sản phẩm'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cột bên trái: Thông tin chính */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-xl shadow-sm p-6 sm:p-8" style={{ backgroundColor: '#FDFBF7', border: '1px solid #E8D5B5' }}>
                        <h2 className="text-lg font-bold mb-6 border-b pb-3" style={{ color: '#3F2E23', borderColor: '#E8D5B5' }}>Thông tin chung</h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: '#3F2E23' }}>Tên sản phẩm <span className="text-red-500">*</span></label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Ví dụ: Túi tote vải canvas..."
                                    className="w-full px-4 py-3 rounded-lg border bg-[#FFF8F0] focus:outline-none focus:ring-2 focus:ring-[#D96C39] transition-all font-medium text-lg"
                                    style={{ borderColor: '#E8D5B5', color: '#3F2E23' }}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold mb-2" style={{ color: '#3F2E23' }}>Danh mục <span className="text-red-500">*</span></label>
                                    <select
                                        name="categoryId"
                                        value={formData.categoryId}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg border bg-[#FFF8F0] focus:outline-none focus:ring-2 focus:ring-[#D96C39] transition-all font-medium cursor-pointer"
                                        style={{ borderColor: '#E8D5B5', color: '#3F2E23' }}
                                    >
                                        <option value="">-- Chọn danh mục --</option>
                                        {categories.map((cat) => (
                                            <option key={cat.categoryId} value={cat.categoryId}>
                                                {cat.categoryName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2" style={{ color: '#3F2E23' }}>Trạng thái</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg border bg-[#FFF8F0] focus:outline-none focus:ring-2 focus:ring-[#D96C39] transition-all font-medium cursor-pointer"
                                        style={{ borderColor: '#E8D5B5', color: formData.status === 'ACTIVE' ? '#28a745' : '#dc3545' }}
                                    >
                                        <option value="ACTIVE">Hiển thị (Đang bán)</option>
                                        <option value="HIDDEN">Ẩn (Ngừng bán)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t" style={{ borderColor: '#E8D5B5' }}>
                                <div>
                                    <label className="block text-sm font-semibold mb-2" style={{ color: '#3F2E23' }}>Giá bán (VNĐ) <span className="text-red-500">*</span></label>
                                    <input
                                        name="price"
                                        type="number"
                                        min="0"
                                        value={formData.price}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="w-full px-4 py-3 rounded-lg border bg-[#FFF8F0] focus:outline-none focus:ring-2 focus:ring-[#D96C39] transition-all text-xl font-bold"
                                        style={{ borderColor: '#E8D5B5', color: '#D96C39' }}
                                    />
                                </div>
                                {/* Ô Tồn kho bị khóa cứng */}
                                <div>
                                    <label className="block text-sm font-semibold mb-2" style={{ color: '#3F2E23' }}>Số lượng tồn kho ban đầu</label>
                                    <div className="w-full px-4 py-3 rounded-lg border flex items-center justify-between text-xl font-bold cursor-not-allowed select-none" style={{ backgroundColor: '#F3EAD8', borderColor: '#E8D5B5', color: '#8A7A6B' }}>
                                        <span>0</span>
                                        <Lock className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <p className="text-[11px] font-medium mt-2 leading-snug" style={{ color: '#8A7A6B' }}>
                                        *Tồn kho mặc định bằng 0. Hệ thống quản lý kho vận sẽ tự động đồng bộ số lượng thực tế sau khi tạo.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="rounded-xl shadow-sm p-6 sm:p-8" style={{ backgroundColor: '#FDFBF7', border: '1px solid #E8D5B5' }}>
                        <h2 className="text-lg font-bold mb-4" style={{ color: '#3F2E23' }}>Mô tả sản phẩm</h2>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={8}
                            placeholder="Mô tả chi tiết về chất liệu, kích thước, công dụng..."
                            className="w-full px-4 py-3 rounded-lg border bg-[#FFF8F0] focus:outline-none focus:ring-2 focus:ring-[#D96C39] transition-all resize-none"
                            style={{ borderColor: '#E8D5B5', color: '#6B4F3E' }}
                        />
                    </div>
                </div>

                {/* Cột bên phải: Hình ảnh */}
                <div className="space-y-6">
                    <div className="rounded-xl shadow-sm p-6" style={{ backgroundColor: '#FDFBF7', border: '1px solid #E8D5B5' }}>
                        <h2 className="text-lg font-bold mb-4" style={{ color: '#3F2E23' }}>Hình ảnh minh họa</h2>

                        <div className="space-y-4">
                            <div
                                className="aspect-square w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden bg-[#FFF8F0] relative transition-all"
                                style={{ borderColor: formData.image && !imageError ? 'transparent' : '#E8D5B5' }}
                            >
                                {formData.image && !imageError ? (
                                    <Image
                                        src={
                                            formData.image.startsWith('//') ? `https:${formData.image}`
                                            : formData.image.startsWith('http') ? formData.image
                                            : formData.image.startsWith('/') ? formData.image
                                            : `/${formData.image}`
                                        }
                                        alt="Preview"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                        onError={() => setImageError(true)}
                                    />
                                ) : (
                                    <div className="text-center p-4 select-none">
                                        <div className="w-16 h-16 rounded-full bg-[#F7F1E8] flex items-center justify-center mx-auto mb-3 shadow-inner">
                                            <ImageIcon className="w-8 h-8" style={{ color: '#D96C39' }} />
                                        </div>
                                        <p className="text-sm font-semibold" style={{ color: '#3F2E23' }}>
                                            Chưa có hình ảnh
                                        </p>
                                        <p className="text-xs mt-1" style={{ color: '#6B4F3E' }}>
                                            Dán URL ảnh xuống bên dưới để xem trước
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#6B4F3E' }}>URL Hình ảnh</label>
                                <input
                                    name="image"
                                    value={formData.image}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                    className="w-full px-4 py-3 rounded-lg border bg-[#FFF8F0] focus:outline-none focus:ring-2 focus:ring-[#D96C39] transition-all text-sm"
                                    style={{ borderColor: '#E8D5B5', color: '#3F2E23' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewProductPage;