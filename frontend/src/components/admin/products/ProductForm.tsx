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

interface ProductFormProps {
    initialData: Product | null;
}

export const ProductForm: React.FC<ProductFormProps> = ({ initialData }) => {
    const router = useRouter();

    // ADD: Khởi tạo hook axiosAuth
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

    useEffect(() => {
        const getCategories = async () => {
            try {
                // EDIT: Dùng axiosAuth.get
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
                // EDIT: Dùng axiosAuth.put (không cần JSON.stringify)
                await axiosAuth.put(`/products/${initialData.id}/`, productData);
            } else {
                // EDIT: Dùng axiosAuth.post (không cần JSON.stringify)
                await axiosAuth.post('/products/', productData);
            }

            // Trigger refresh event for products list
            window.dispatchEvent(new Event('products-refresh'));
            router.push('/admin/products');
            router.refresh();
        } catch (error) {
            console.error("Failed to save product", error);
        } finally {
            setLoading(false);
        }
    };

    const action = initialData ? 'Lưu thay đổi' : 'Tạo';

    return (
        <form onSubmit={handleSubmit} className="space-y-8 w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                <div className="space-y-2">
                    <label htmlFor="name" style={labelStyles}>Tên sản phẩm</label>
                    <input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} placeholder="Tên sản phẩm" style={inputStyles} className="focus:ring-2 focus:ring-[#D96C39] focus:border-transparent focus:outline-none" />
                </div>

                <div className="space-y-2">
                    <label htmlFor="price" style={labelStyles}>Giá</label>
                    <input id="price" value={price} onChange={(e) => setPrice(Number(e.target.value))} type="number" disabled={loading} placeholder="9.99" style={inputStyles} className="focus:ring-2 focus:ring-[#D96C39] focus:border-transparent focus:outline-none" />
                </div>

                <div className="space-y-2">
                    <label htmlFor="stock" style={labelStyles}>Số lượng tồn kho</label>
                    <input id="stock" value={stock_quantity} onChange={(e) => setStockQuantity(Number(e.target.value))} type="number" disabled={loading} placeholder="100" style={inputStyles} className="focus:ring-2 focus:ring-[#D96C39] focus:border-transparent focus:outline-none" />
                </div>

                <div className="space-y-2">
                    <label htmlFor="category" style={labelStyles}>Danh mục</label>
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

                <div className="space-y-2">
                    <label htmlFor="status" style={labelStyles}>Trạng thái</label>
                    <select disabled={loading} onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'HIDDEN')} value={status} style={selectStyles} className="focus:ring-2 focus:ring-[#D96C39] focus:border-transparent focus:outline-none">
                        <option value="ACTIVE">Hoạt động</option>
                        <option value="HIDDEN">Ẩn</option>
                    </select>
                </div>

                <div className="space-y-2 md:col-span-3">
                    <label htmlFor="description" style={labelStyles}>Mô tả</label>
                    <input id="description" value={description} onChange={(e) => setDescription(e.target.value)} disabled={loading} placeholder="Mô tả sản phẩm" style={inputStyles} className="focus:ring-2 focus:ring-[#D96C39] focus:border-transparent focus:outline-none" />
                </div>

                <div className="space-y-2 md:col-span-3">
                    <label htmlFor="image" style={labelStyles}>Hình ảnh</label>
                    <input id="image" value={image} onChange={(e) => setImage(e.target.value)} disabled={loading} placeholder="Đường dẫn hình ảnh" style={inputStyles} className="focus:ring-2 focus:ring-[#D96C39] focus:border-transparent focus:outline-none" />
                </div>
            </div>

            <button disabled={loading} className="ml-auto block px-6 py-3 text-sm font-medium rounded-full shadow-md text-white transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: '#D96C39' }} type="submit">
                {action}
            </button>
        </form>
    );
};