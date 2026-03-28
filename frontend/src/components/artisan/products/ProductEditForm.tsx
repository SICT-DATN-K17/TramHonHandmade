'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Product, Category } from '@/types';
import useAxiosAuth from '@/hooks/useAxiosAuth';

// Common styles for form elements, to avoid repetition
const inputStyles: React.CSSProperties = {
    backgroundColor: '#FFF8F0',
    borderColor: '#D96C39',
    color: '#3F2E23',
    borderWidth: '1px',
    borderRadius: '9999px', // rounded-full
    padding: '0.75rem 1.5rem',
    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    transition: 'all 0.3s',
    width: '100%',
};

const selectStyles: React.CSSProperties = {
    ...inputStyles,
    padding: '0.75rem 1rem',
};

const labelStyles: React.CSSProperties = {
    color: '#3F2E23',
    fontSize: '0.875rem',
    fontWeight: 500,
    display: 'block',
    marginBottom: '0.5rem'
};

interface ProductEditFormProps {
    initialData: Product | null;
}

export const ProductEditForm: React.FC<ProductEditFormProps> = ({ initialData }) => {
    const router = useRouter();

    // 1. Khởi tạo hook axiosAuth
    const axiosAuth = useAxiosAuth();

    const [name, setName] = useState(initialData?.name || '');
    const [price, setPrice] = useState(initialData?.price || 0);
    const [stock_quantity, setStockQuantity] = useState(initialData?.stock_quantity || 0);
    const [category_id, setCategoryId] = useState(initialData?.category_id || 0);
    const [description, setDescription] = useState(initialData?.description || '');
    const [image, setImage] = useState(initialData?.image || '');
    const [status, setStatus] = useState(initialData?.status || 'ACTIVE');

    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    // 2. Fetch Categories dùng axiosAuth
    useEffect(() => {
        const getCategories = async () => {
            try {
                // Sử dụng axiosAuth.get
                const response = await axiosAuth.get<Category[]>('/category');
                const cats = response.data; // Lấy dữ liệu từ .data

                setCategories(cats);
                if (initialData === null && cats.length > 0) {
                    setCategoryId(cats[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch categories", error);
            }
        };
        getCategories();
    }, [initialData, axiosAuth]); // Thêm axiosAuth vào dependency

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const productData = {
            name,
            price,
            stock_quantity,
            category_id,
            description,
            image,
            status,
            quantity_sold: initialData?.quantity_sold || 0
        };

        try {
            if (initialData) {
                // 3. Update Product dùng axiosAuth.put
                // Không cần JSON.stringify, axios tự xử lý object
                await axiosAuth.put(`/products/${initialData.id}`, productData);
            } else {
                // This form is for editing only
            }

            // Trigger refresh event for products list (in case user navigates back)
            window.dispatchEvent(new Event('products-refresh'));

            router.push(`/artisan/products/${initialData?.id}`);
            router.refresh();
        } catch (error) {
            console.error("Failed to save product", error);
        } finally {
            setLoading(false);
        }
    };

    if (!initialData) {
        return <div>Không có dữ liệu sản phẩm.</div>
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">

                <div>
                    <label htmlFor="name" style={labelStyles}>Tên sản phẩm</label>
                    <p className="text-sm text-gray-500 mb-2">Hiện tại: {initialData.name}</p>
                    <input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} placeholder="Tên sản phẩm mới" style={inputStyles} className="focus:ring-2 focus:ring-[#D96C39] focus:border-transparent focus:outline-none" />
                </div>

                <div>
                    <label htmlFor="price" style={labelStyles}>Giá</label>
                    <p className="text-sm text-gray-500 mb-2">Hiện tại: {initialData.price}</p>
                    <input id="price" value={price} onChange={(e) => setPrice(Number(e.target.value))} type="number" disabled={loading} placeholder="Giá mới" style={inputStyles} className="focus:ring-2 focus:ring-[#D96C39] focus:border-transparent focus:outline-none" />
                </div>

                <div>
                    <label htmlFor="stock" style={labelStyles}>Số lượng tồn kho</label>
                    <p className="text-sm text-gray-500 mb-2">Hiện tại: {initialData.stock_quantity}</p>
                    <input id="stock" value={stock_quantity} onChange={(e) => setStockQuantity(Number(e.target.value))} type="number" disabled={loading} placeholder="Số lượng mới" style={inputStyles} className="focus:ring-2 focus:ring-[#D96C39] focus:border-transparent focus:outline-none" />
                </div>

                <div>
                    <label htmlFor="category" style={labelStyles}>Danh mục</label>
                    <p className="text-sm text-gray-500 mb-2">Hiện tại: {categories.find(c => c.id === initialData.category_id)?.name}</p>
                    <select
                        id="category"
                        disabled={loading}
                        onChange={(e) => setCategoryId(Number(e.target.value))}
                        value={String(category_id)}
                        style={selectStyles}
                        className="focus:ring-2 focus:ring-[#D96C39] focus:border-transparent focus:outline-none"
                    >
                        {categories.map((category) => (
                            <option key={category.id} value={String(category.id)}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="status" style={labelStyles}>Trạng thái</label>
                    <p className="text-sm text-gray-500 mb-2">Hiện tại: {initialData.status}</p>
                    <select disabled={loading} onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'HIDDEN')} value={status} style={selectStyles} className="focus:ring-2 focus:ring-[#D96C39] focus:border-transparent focus:outline-none">
                        <option value="ACTIVE">Hoạt động</option>
                        <option value="HIDDEN">Ẩn</option>
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label htmlFor="description" style={labelStyles}>Mô tả</label>
                    <p className="text-sm text-gray-500 mb-2">Hiện tại: {initialData.description}</p>
                    <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} disabled={loading} placeholder="Mô tả mới" style={{...inputStyles, borderRadius: '1.5rem', minHeight: '120px'}} className="focus:ring-2 focus:ring-[#D96C39] focus:border-transparent focus:outline-none" />
                </div>

                <div className="md:col-span-2">
                    <label htmlFor="image" style={labelStyles}>Hình ảnh</label>
                    <p className="text-sm text-gray-500 mb-2">Hiện tại: {initialData.image}</p>
                    <input id="image" value={image} onChange={(e) => setImage(e.target.value)} disabled={loading} placeholder="Đường dẫn hình ảnh mới" style={inputStyles} className="focus:ring-2 focus:ring-[#D96C39] focus:border-transparent focus:outline-none" />
                </div>
            </div>

            <div className="flex justify-end space-x-4">
                <button
                    type="button"
                    onClick={() => router.back()}
                    disabled={loading}
                    className="px-6 py-3 text-sm font-medium rounded-full shadow-md transition-all transform hover:scale-105"
                    style={{ backgroundColor: '#F7F1E8', color: '#3F2E23', border: '1px solid #D96C39' }}
                >
                    Hủy
                </button>
                <button disabled={loading} className="px-6 py-3 text-sm font-medium rounded-full shadow-md text-white transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: '#D96C39' }} type="submit">
                    Lưu thay đổi
                </button>
            </div>
        </form>
    );
};