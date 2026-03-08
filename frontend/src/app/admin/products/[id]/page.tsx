'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useAxiosAuth from '@/hooks/useAxiosAuth';
import Image from 'next/image';
import toast, { Toast } from 'react-hot-toast';
import { ArrowLeft, Trash, Save, XCircle, AlertTriangle, Image as ImageIcon } from 'lucide-react';

interface Category {
    id: number;
    name: string;
}

interface ProductFormData {
    id?: number;
    name: string;
    description: string | null;
    price: number;
    image: string;
    categoryId: number | undefined;
    stockQuantity: number;
    quantitySold: number;
    status: 'ACTIVE' | 'HIDDEN';
}

const ProductFormPage = () => {
    const router = useRouter();
    const params = useParams();
    const { id } = params;
    const axiosAuth = useAxiosAuth();
    const isNew = id === 'new';
    const [originalProduct, setOriginalProduct] = useState<Partial<ProductFormData> | null>(null);
    const [formData, setFormData] = useState<Partial<ProductFormData> | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isDirty, setIsDirty] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(!isNew);
    const nameRef = useRef<HTMLTextAreaElement>(null);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const categoriesRes = await axiosAuth.get<any[]>(`/category/`);
                const mappedCategories = (categoriesRes.data || []).map((cat: any) => ({
                    id: cat.categoryId,
                    name: cat.categoryName,
                }));
                setCategories(mappedCategories);

                if (!isNew) {
                    const productRes = await axiosAuth.get<any>(`/products/${id}/?admin=true`);
                    const productData = productRes.data;
                    const product: Partial<ProductFormData> = productData ? {
                        id: productData.id,
                        name: productData.name,
                        description: productData.description,
                        price: productData.price,
                        image: productData.image,
                        categoryId: productData.categoryId,
                        stockQuantity: productData.stockQuantity,
                        quantitySold: productData.quantitySold,
                        status: productData.status,
                    } : null;

                    setOriginalProduct(product);
                    setFormData(product);
                } else {
                    // Initialize form for a new product
                    const newProd: Partial<ProductFormData> = {
                        name: '',
                        price: 0,
                        stockQuantity: 0,
                        quantitySold: 0,
                        image: '',
                        status: 'ACTIVE',
                        description: '',
                        categoryId: mappedCategories?.[0]?.id || undefined,
                    };
                    setOriginalProduct(newProd as ProductFormData);
                    setFormData(newProd);
                }
            } catch (error) {
                console.error("Failed to fetch data", error);
                toast.error(isNew ? "Không thể tải danh mục" : "Không thể tải dữ liệu sản phẩm");
                if (!isNew) router.push('/admin/products');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, isNew, axiosAuth, router]);

    useEffect(() => {
        if (isNew) {
            setIsDirty(true); // For new products, the form is always "dirty"
        } else if (originalProduct && formData) {
            const hasChanged = JSON.stringify(originalProduct) !== JSON.stringify(formData);
            setIsDirty(hasChanged);
        } else {
            setIsDirty(false);
        }
    }, [formData, originalProduct, isNew]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty && !isNew) {
                e.preventDefault();
                e.returnValue = 'Bạn có các thay đổi chưa được lưu. Bạn có chắc muốn rời đi?';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isDirty, isNew]);

    useEffect(() => {
        if (nameRef.current) {
            nameRef.current.style.height = 'auto';
            nameRef.current.style.height = `${nameRef.current.scrollHeight}px`;
        }
        if (descriptionRef.current) {
            descriptionRef.current.style.height = 'auto';
            descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`;
        }
    }, [formData]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            if (!prev) return null;
            const newValue = ['price', 'stockQuantity', 'categoryId'].includes(name) ? Number(value) : value;
            return { ...prev, [name]: newValue };
        });
    };
    
    const validateAndPreparePayload = () => {
        if (!formData) return null;

        if (!formData.name?.trim()) {
            toast.error('Tên sản phẩm không được để trống');
            return null;
        }
        if (!formData.categoryId) {
            toast.error('Vui lòng chọn danh mục');
            return null;
        }
        if (formData.price === undefined || formData.price < 0) {
            toast.error('Giá sản phẩm không được âm');
            return null;
        }
        if (formData.stockQuantity === undefined || formData.stockQuantity < 0 || !Number.isInteger(formData.stockQuantity)) {
            toast.error('Số lượng tồn kho phải là số nguyên không âm');
            return null;
        }

        const payload = {
            name: formData.name,
            price: Number(formData.price) || 0,
            stockQuantity: Number(formData.stockQuantity) || 0,
            image: formData.image || '',
            status: formData.status || 'ACTIVE',
            description: formData.description || '',
            categoryId: Number(formData.categoryId),
        };

        return payload;
    };


    const handleSubmit = async () => {
        const productPayload = validateAndPreparePayload();
        if (!productPayload) return;

        setIsSubmitting(true);
        const toastId = toast.loading(isNew ? 'Đang tạo sản phẩm...' : 'Đang cập nhật...');

        try {
            let response;
            if (isNew) {
                // CREATE
                response = await axiosAuth.post('/products/', productPayload);
                toast.success('Tạo sản phẩm thành công!', { id: toastId });
                router.push('/admin/products');
                router.refresh();
            } else {
                // UPDATE
                response = await axiosAuth.put(`/products/${id}/`, productPayload);
                const updatedProductData = response.data;
                const updatedProduct: Partial<ProductFormData> = updatedProductData ? {
                    id: updatedProductData.id,
                    name: updatedProductData.name,
                    description: updatedProductData.description,
                    price: updatedProductData.price,
                    image: updatedProductData.image,
                    categoryId: updatedProductData.categoryId,
                    stockQuantity: updatedProductData.stockQuantity,
                    quantitySold: updatedProductData.quantitySold,
                    status: updatedProductData.status,
                } : null;
                setOriginalProduct(updatedProduct as ProductFormData);
                setFormData(updatedProduct as ProductFormData);
                toast.success('Cập nhật thành công!', { id: toastId });
            }
        } catch (error: any) {
            console.error(`Failed to ${isNew ? 'create' : 'update'} product`, error);
            const errorMsg = error.response?.data?.message || (isNew ? 'Tạo sản phẩm thất bại.' : 'Cập nhật thất bại.');
            toast.error(errorMsg, { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (isNew || !formData?.id) return;
        confirmDeleteAction(formData.name!, async () => {
            try {
                await axiosAuth.delete(`/products/${formData.id}/`);
                toast.success('Xóa sản phẩm thành công.');
                router.push('/admin/products');
                router.refresh();
            } catch (error) {
                console.error("Failed to delete product", error);
                toast.error('Xóa sản phẩm thất bại.');
            }
        });
    };
    
    // Confirmation Dialogs remain the same
    const confirmAction = (message: React.ReactNode, onConfirm: () => void) => {
        toast(
            (t: Toast) => (
                <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-lg shadow-lg">
                    <div className="text-center">{message}</div>
                    <div className="flex gap-4">
                        <button
                            className="px-6 py-2 text-sm font-semibold rounded-full text-white bg-red-600 hover:bg-red-700 transition-colors"
                            onClick={() => {
                                onConfirm();
                                toast.dismiss(t.id);
                            }}
                        >
                            Xác nhận
                        </button>
                        <button
                            className="px-6 py-2 text-sm font-semibold rounded-full text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
                            onClick={() => toast.dismiss(t.id)}
                        >
                            Hủy
                        </button>
                    </div>
                </div>
            ),
            { duration: Infinity }
        );
    };

    const confirmDeleteAction = (name: string, onConfirm: () => void) => {
        toast(
            (t: Toast) => (
                <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-lg shadow-2xl border border-red-300 max-w-md">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-10 w-10 text-red-500" />
                        <h3 className="text-2xl font-bold text-red-700">Xác nhận xóa</h3>
                    </div>
                    <p className="text-center text-gray-700 mt-2">
                        Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm <strong className="text-red-600">&quot;{name}&quot;</strong> không?
                    </p>
                    <div className="flex w-full justify-center gap-4 mt-4">
                        <button
                            className="px-6 py-2 text-base font-semibold rounded-full text-white bg-red-600 hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            onClick={() => {
                                onConfirm();
                                toast.dismiss(t.id);
                            }}
                        >
                            Xóa vĩnh viễn
                        </button>
                        <button
                            className="px-6 py-2 text-base font-semibold rounded-full text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                            onClick={() => toast.dismiss(t.id)}
                        >
                            Hủy
                        </button>
                    </div>
                </div>
            ),
            {
                duration: Infinity,
            }
        );
    };

    const handleCancel = () => {
        setFormData(originalProduct); // Revert changes
    };

    const handleBackNavigation = () => {
        if (isDirty && !isNew) {
            confirmAction(
                <span>Các thay đổi cho sản phẩm <strong className="font-semibold">&quot;{formData?.name}&quot;</strong> sẽ không được lưu. Bạn có chắc chắn muốn quay lại?</span>,
                () => {
                    router.push('/admin/products');
                }
            );
        } else {
            router.push('/admin/products');
        }
    };

    if (loading) {
        return <div className="text-center py-10">Đang tải...</div>;
    }

    if (!formData) {
        return <div className="text-center py-10 text-red-500">Không thể tải dữ liệu.</div>;
    }

    return (
        <div className="space-y-8">
             <div className="rounded-xl shadow-sm p-6 sm:p-8" style={{ backgroundColor: '#FDFBF7', border: '1px solid #E8D5B5' }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1 flex flex-col">
                        <div className="relative w-full h-80 rounded-lg overflow-hidden shadow-inner bg-[#F7F1E8] flex items-center justify-center border border-[#E8D5B5]">
                            {formData.image ? (
                                <Image
                                    src={
                                        formData.image.startsWith('//')
                                            ? `https:${formData.image}`
                                            : formData.image.startsWith('http')
                                            ? formData.image
                                            : formData.image.startsWith('/')
                                            ? formData.image
                                            : `/${formData.image}`
                                    }
                                    alt={formData.name || 'Product Image'}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center text-[#6B4F3E] opacity-50">
                                    <ImageIcon className="w-16 h-16 mb-2" />
                                    <span className="font-medium">Chưa có hình ảnh</span>
                                </div>
                            )}
                        </div>
                        <div className="mt-4">
                            <div className="text-sm font-medium" style={{color: '#6B4F3E'}}>URL Hình ảnh</div>
                            <input
                                type="text"
                                name="image"
                                value={formData.image || ''}
                                onChange={handleFormChange}
                                className="w-full text-sm bg-transparent border-b-2 border-transparent focus:border-yellow-500 focus:outline-none"
                                style={{ color: '#3F2E23' }}
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 items-start">
                            <div className="md:col-span-2">
                                <div className="text-sm font-medium" style={{color: '#6B4F3E'}}>Tên sản phẩm</div>
                                <textarea
                                    ref={nameRef}
                                    name="name"
                                    value={formData.name || ''}
                                    onChange={handleFormChange}
                                    className="w-full text-2xl font-bold bg-transparent border-b-2 border-transparent focus:border-yellow-500 focus:outline-none resize-none overflow-hidden"
                                    style={{ color: '#3F2E23' }}
                                    placeholder="Nhập tên sản phẩm"
                                />
                            </div>

                            <div>
                                <div className="text-sm font-medium" style={{color: '#6B4F3E'}}>Danh mục</div>
                                <select
                                    name="categoryId"
                                    value={formData.categoryId || ''}
                                    onChange={handleFormChange}
                                    className="w-full font-semibold bg-transparent border-b-2 border-transparent focus:border-yellow-500 focus:outline-none pb-2 text-lg"
                                    style={{ color: '#3F2E23' }}
                                >
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <div className="text-sm font-medium" style={{color: '#6B4F3E'}}>Mô tả</div>
                            <textarea
                                ref={descriptionRef}
                                name="description"
                                value={formData.description || ''}
                                onChange={handleFormChange}
                                className="w-full text-lg bg-transparent border-b-2 border-transparent focus:border-yellow-500 focus:outline-none resize-none overflow-hidden"
                                style={{ color: '#6B4F3E' }}
                                placeholder="Mô tả chi tiết sản phẩm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t" style={{borderColor: '#E8D5B5'}}>
                            <div>
                                <div className="text-sm font-medium" style={{color: '#6B4F3E'}}>Giá</div>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price || 0}
                                    onChange={handleFormChange}
                                    className="w-full text-2xl font-semibold bg-transparent border-b-2 border-transparent focus:border-yellow-500 focus:outline-none"
                                    style={{ color: '#D96C39' }}
                                />
                            </div>
                            <div>
                                <div className="text-sm font-medium" style={{color: '#6B4F3E'}}>Trạng thái</div>
                                <select
                                    name="status"
                                    value={formData.status || 'ACTIVE'}
                                    onChange={handleFormChange}
                                    className="w-full font-semibold bg-transparent border-b-2 border-transparent focus:border-yellow-500 focus:outline-none"
                                    style={{color: formData.status === 'ACTIVE' ? '#28a745' : '#6c757d'}}
                                >
                                    <option value="ACTIVE">Đang hoạt động</option>
                                    <option value="HIDDEN">Bị ẩn</option>
                                </select>
                            </div>
                            <div>
                                <div className="text-sm font-medium" style={{color: '#6B4F3E'}}>Số lượng tồn kho</div>
                                <input
                                    type="number"
                                    name="stockQuantity"
                                    value={formData.stockQuantity || 0}
                                    onChange={handleFormChange}
                                    className="w-full font-semibold bg-transparent border-b-2 border-transparent focus:border-yellow-500 focus:outline-none"
                                    style={{ color: '#3F2E23' }}
                                />
                            </div>
                           {!isNew && (
                             <div>
                                 <div className="text-sm font-medium" style={{color: '#6B4F3E'}}>Đã bán</div>
                                 <div className="font-semibold" style={{color: '#3F2E23'}}>{formData.quantitySold || 0}</div>
                             </div>
                           )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end space-x-4">
                <button
                    onClick={handleBackNavigation}
                    className="flex items-center px-4 py-2 text-sm font-medium rounded-full shadow-sm transition-all transform hover:scale-105"
                    style={{ backgroundColor: '#F7F1E8', color: '#3F2E23', border: '1px solid #D96C39' }}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Quay lại danh sách
                </button>
                {isDirty && !isNew && (
                    <button
                        onClick={handleCancel}
                        disabled={isSubmitting}
                        className="flex items-center px-6 py-3 text-sm font-medium rounded-full shadow-md text-gray-700 bg-gray-200 transition-all transform hover:scale-105 disabled:opacity-50"
                    >
                        <XCircle className="mr-2 h-4 w-4" />
                        Hủy
                    </button>
                )}
                <button
                    onClick={handleSubmit}
                    disabled={!isDirty || isSubmitting}
                    className="flex items-center px-6 py-3 text-sm font-medium rounded-full shadow-md text-white transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#D96C39' }}
                >
                    <Save className="mr-2 h-4 w-4" />
                    {isSubmitting ? (isNew ? 'Đang tạo...' : 'Đang cập nhật...') : (isNew ? 'Tạo mới' : 'Cập nhật')}
                </button>
                {!isNew && (
                    <button
                        onClick={handleDelete}
                        disabled={isSubmitting}
                        className="flex items-center px-6 py-3 text-sm font-medium rounded-full shadow-md text-white transition-all transform hover:scale-105 disabled:opacity-50"
                        style={{ backgroundColor: '#dc3545' }}
                    >
                        <Trash className="mr-2 h-4 w-4" />
                        Xóa
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProductFormPage;