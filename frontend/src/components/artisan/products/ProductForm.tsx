'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Product, Category } from '@/types';
import useAxiosAuth from '@/hooks/useAxiosAuth';
import toast from 'react-hot-toast';

const inputStyles: React.CSSProperties = {
    backgroundColor: '#FFF8F0',
    borderColor: '#D96C39',
    color: '#3F2E23',
    borderWidth: '1px',
    borderRadius: '9999px',
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
    const axiosAuth = useAxiosAuth();

    // 👉 FIX: Đổi toàn bộ state sang camelCase
    const [name, setName] = useState(initialData?.name || '');
    const [price, setPrice] = useState(initialData?.price || 0);
    const [stockQuantity, setStockQuantity] = useState(initialData?.stockQuantity || 0);
    const [categoryId, setCategoryId] = useState(initialData?.categoryId || 0);
    const [description, setDescription] = useState(initialData?.description || '');
    const [image, setImage] = useState(initialData?.image || '');
    const [status, setStatus] = useState(initialData?.status || 'ACTIVE');

    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        const getCategories = async () => {
            try {
                const response = await axiosAuth.get<Category[]>('/categories/');
                const cats = Array.isArray(response.data) ? response.data : (response.data as any).content || [];

                setCategories(cats);
                if (initialData === null && cats.length > 0) {
                    setCategoryId(cats[0].categoryId); 
                }
            } catch (error) {
                console.error("Failed to fetch categories", error);
                toast.error("Không thể tải danh mục");
            }
        };
        getCategories();
    }, [initialData, axiosAuth]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const productData = {
            name,
            price,
            stockQuantity, 
            categoryId,
            description,
            image,
            status,
            quantitySold: initialData?.quantitySold || 0
        };

        try {
            if (initialData) {
                await axiosAuth.put(`/products/${initialData.id}/`, productData);
                toast.success('Cập nhật sản phẩm thành công!');
            } else {
                await axiosAuth.post('/products/', productData);
                toast.success('Tạo sản phẩm thành công!');
            }

            window.dispatchEvent(new Event('products-refresh'));
            router.push('/artisan/products');
            router.refresh();
        } catch (error) {
            console.error("Failed to save product", error);
            toast.error("Lưu sản phẩm thất bại. Vui lòng kiểm tra lại thông tin.");
        } finally {
            setLoading(false);
        }
    };

    const action = initialData ? 'Lưu thay đổi' : 'Tạo mới';

    return (
        <form onSubmit={handleSubmit} className="space-y-8 w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                    <label htmlFor="name" style={labelStyles}>Tên sản phẩm</label>
                    <input id="name" required value={name} onChange={(e) => setName(e.target.value)} disabled={loading} placeholder="Tên sản phẩm" style={inputStyles} className="focus:ring-2 focus:ring-[#D96C39] focus:border-transparent focus:outline-none" />
                </div>

                <div className="space-y-2">
                    <label htmlFor="price" style={labelStyles}>Giá (VNĐ)</label>
                    <input id="price" required value={price} onChange={(e) => setPrice(Number(e.target.value))} type="number" min="0" disabled={loading} placeholder="0" style={inputStyles} className="focus:ring-2 focus:ring-[#D96C39] focus:border-transparent focus:outline-none" />
                </div>

                <div className="space-y-2">
                    <label htmlFor="stock" style={labelStyles}>Số lượng tồn kho</label>
                    <input id="stock" required value={stockQuantity} onChange={(e) => setStockQuantity(Number(e.target.value))} type="number" min="0" disabled={loading} placeholder="100" style={inputStyles} className="focus:ring-2 focus:ring-[#D96C39] focus:border-transparent focus:outline-none" />
                </div>

                <div className="space-y-2">
                    <label htmlFor="category" style={labelStyles}>Danh mục</label>
                    <select
                        id="category"
                        disabled={loading}
                        onChange={(e) => setCategoryId(Number(e.target.value))}
                        value={String(categoryId)}
                        style={selectStyles}
                        className="focus:ring-2 focus:ring-[#D96C39] focus:border-transparent focus:outline-none"
                    >
                        {categories.map((category) => (
                            <option key={category.categoryId} value={String(category.categoryId)}>
                                {category.categoryName}
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
                    <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} disabled={loading} placeholder="Mô tả chi tiết sản phẩm" style={{...inputStyles, borderRadius: '1.5rem', minHeight: '100px'}} className="focus:ring-2 focus:ring-[#D96C39] focus:border-transparent focus:outline-none" />
                </div>

                <div className="space-y-2 md:col-span-3">
                    <label htmlFor="image" style={labelStyles}>Hình ảnh (URL)</label>
                    <input id="image" value={image} onChange={(e) => setImage(e.target.value)} disabled={loading} placeholder="Đường dẫn hình ảnh" style={inputStyles} className="focus:ring-2 focus:ring-[#D96C39] focus:border-transparent focus:outline-none" />
                </div>
            </div>

            <button disabled={loading} className="ml-auto block px-8 py-3 text-sm font-medium rounded-full shadow-md text-white transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: '#D96C39' }} type="submit">
                {loading ? 'Đang xử lý...' : action}
            </button>
        </form>
    );
};