'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Product, Category } from '@/types';
import useAxiosAuth from '@/hooks/useAxiosAuth';
import { RawCategoryResponse } from '@/types/apiTypes';
import { mapToEnrichedCategory } from '@/utils/CategoryMapper';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import toast, { Toast } from 'react-hot-toast';
import Image from 'next/image';

// --- Filter Definitions ---
const PRICE_RANGES = [
    { id: 'all', label: 'Mọi mức giá', min: 0, max: Infinity },
    { id: 'under-100k', label: 'Dưới 100.000đ', min: 0, max: 100000 },
    { id: '100k-200k', label: '100.000 - 200.000đ', min: 100000, max: 200000 },
    { id: '200k-500k', label: '200.000 - 500.000đ', min: 200000, max: 500000 },
    { id: 'over-500k', label: 'Trên 500.000đ', min: 500000, max: Infinity },
];

const SORT_OPTIONS = [
    { id: 'featured', label: 'Nổi bật (bán chạy)' },
    { id: 'price-asc', label: 'Giá: Thấp đến Cao' },
    { id: 'price-desc', label: 'Giá: Cao đến Thấp' },
    { id: 'name-asc', label: 'Tên: A-Z' },
    { id: 'name-desc', label: 'Tên: Z-A' },
];

const inputStyles: React.CSSProperties = {
    backgroundColor: '#FFF8F0',
    borderColor: '#D96C39',
    color: '#3F2E23',
    borderWidth: '1px',
    borderRadius: '9999px',
    padding: '0.5rem 1rem',
    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    width: '100%',
};

interface ProductsClientProps {
    data: Product[];
}

export const ProductsClient: React.FC<ProductsClientProps> = ({ data }) => {
    const router = useRouter();
    const axiosAuth = useAxiosAuth();

    const [categories, setCategories] = useState<Category[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<'all' | number>('all');
    const [priceRange, setPriceRange] = useState('all');
    const [sortBy, setSortBy] = useState('featured');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const getCategories = async () => {
            try {
                setIsLoading(true);
                const response = await axiosAuth.get<RawCategoryResponse[]>('/categories/');
                const rawCats = Array.isArray(response.data) ? response.data : (response.data as any).content || [];
                const cats = rawCats.map(mapToEnrichedCategory);
                setCategories(cats);
            } catch (error) {
                console.error("Failed to fetch categories", error);
            } finally {
                setIsLoading(false);
            }
        };
        getCategories();
    }, [axiosAuth]);

    const filteredProducts = useMemo(() => {
        return data
            .filter(product => {
                const matchesCategory = selectedCategoryId === 'all' || product.categoryId === selectedCategoryId;

                const matchesSearch = searchQuery === '' ||
                    product.name.toLowerCase().includes(searchQuery.toLowerCase());

                const priceRange_ = PRICE_RANGES.find(r => r.id === priceRange);
                const price = Number(product.price) || 0;
                const matchesPrice = priceRange_ ? (price >= priceRange_.min && price <= priceRange_.max) : true;

                return matchesCategory && matchesSearch && matchesPrice;
            })
            .sort((a, b) => {
                switch (sortBy) {
                    case 'price-asc':
                        return (Number(a.price) || 0) - (Number(b.price) || 0);
                    case 'price-desc':
                        return (Number(b.price) || 0) - (Number(a.price) || 0);
                    case 'name-asc':
                        return a.name.localeCompare(b.name);
                    case 'name-desc':
                        return b.name.localeCompare(a.name);
                    case 'featured':
                    default:
                        return (b.quantitySold || 0) - (a.quantitySold || 0);
                }
            });
    }, [data, searchQuery, selectedCategoryId, priceRange, sortBy]);

    const title = useMemo(() => {
        if (selectedCategoryId === 'all') {
            return `Tất cả sản phẩm (${filteredProducts.length})`;
        }
        const category = categories.find(c => c.categoryId === selectedCategoryId);
        const categoryName = category ? category.categoryName : 'Sản phẩm';
        return `${categoryName} (${filteredProducts.length})`;
    }, [selectedCategoryId, categories, filteredProducts.length]);

    const handleRowClick = (product: Product) => {
        router.push(`/artisan/products/${product.id}`);
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

    const handleDeleteProduct = useCallback((productId: number, name: string) => {
        confirmDeleteAction(name, async () => {
            try {
                await axiosAuth.delete(`/products/${productId}/`);
                toast.success(`Đã xóa sản phẩm "${name}" thành công.`);
                window.dispatchEvent(new Event('products-refresh'));
                router.refresh();
            } catch (error) {
                console.error("Failed to delete product:", error);
                toast.error(`Xóa sản phẩm "${name}" thất bại.`);
            }
        });
    }, [router, axiosAuth]);

    const columns: ColumnDef<Product>[] = useMemo(() => [
        {
            id: 'product',
            header: () => <div style={{ width: '200px', minWidth: '300px' }}>Sản phẩm</div>,
            cell: ({ row }) => {
                const product = row.original;
                let imageUrl = product.image ? product.image : '/tramhon-logo.png';
                if (imageUrl.startsWith('//')) {
                    imageUrl = `https:${imageUrl}`;
                } else if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                    imageUrl = `http://127.0.0.1:8000/${imageUrl}`;
                }
                return (
                    <div className="flex items-center gap-4 font-medium" style={{ color: '#3F2E23' }}>
                        <div className="flex-shrink-0 relative h-12 w-12 border border-gray-200 rounded-md overflow-hidden">
                            <Image src={imageUrl} alt={product.name} fill sizes="48px" className="object-cover" />
                        </div>
                        <span className="font-bold line-clamp-2">{product.name}</span>
                    </div>
                );
            }
        },
        {
            id: 'category',
            header: 'Danh mục',
            cell: ({ row }) => {
                const category = categories.find(c => c.categoryId === row.original.categoryId);
                return <span className="text-sm" style={{ color: '#6B4F3E' }}>{category?.categoryName || 'Chưa phân loại'}</span>;
            }
        },
        { accessorKey: 'price', header: 'Giá', cell: ({ row }) => <span className="text-[#D96C39] font-medium">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.original.price)}</span> },
        { accessorKey: 'stockQuantity', header: 'Tồn kho', cell: ({row}) => <span className="font-medium text-gray-700">{row.original.stockQuantity}</span> },
        { accessorKey: 'status', header: 'Trạng thái', cell: ({ row }) => (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ row.original.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-800 border border-gray-200' }`}>
          {row.original.status === 'ACTIVE' ? 'Hoạt động' : 'Bị ẩn'}
        </span>
            )
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Hành động</div>,
            cell: ({ row }) => {
                const product = row.original;
                return (
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/artisan/products/${product.id}`);
                            }}
                            className="p-2 rounded-full text-blue-600 hover:bg-blue-100 transition-colors"
                            title="Xem chi tiết & Chỉnh sửa"
                        ><Edit className="h-4 w-4" /></button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProduct(product.id, product.name);
                            }} className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors" title="Xóa sản phẩm"><Trash className="h-4 w-4" /></button>
                    </div>
                );
            }
        }
    ], [router, categories, handleDeleteProduct]);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: '#3F2E23' }}>
                        {title}
                    </h1>
                    <p className="text-sm mt-2" style={{ color: '#6B4F3E' }}>
                        Quản lý toàn bộ danh sách sản phẩm trên gian hàng của bạn.
                    </p>
                </div>
                <button
                    onClick={() => router.push(`/artisan/products/new`)}
                    className="px-6 py-3 text-sm font-medium rounded-full shadow-md text-white transition-all transform hover:scale-105 flex items-center gap-2"
                    style={{ backgroundColor: '#D96C39' }}
                >
                    <Plus className="h-4 w-4" />
                    Thêm Sản Phẩm Mới
                </button>
            </div>

            <div className="space-y-6 p-6 rounded-xl shadow-sm" style={{ backgroundColor: '#FDFBF7', border: '1px solid #E8D5B5' }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-3">
                        <label htmlFor="search" className="block text-sm font-medium mb-2" style={{color: '#3F2E23'}}>Tìm kiếm theo tên</label>
                        <input
                            id="search"
                            type="text"
                            placeholder="Nhập tên sản phẩm cần tìm..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={inputStyles}
                            className="focus:ring-2 focus:ring-[#D96C39] focus:border-transparent focus:outline-none"
                        />
                    </div>
                    <div>
                        <label htmlFor="price-range" className="block text-sm font-medium mb-2" style={{color: '#3F2E23'}}>Lọc theo giá</label>
                        <select id="price-range" value={priceRange} onChange={e => setPriceRange(e.target.value)} style={inputStyles} className="focus:ring-2 focus:ring-[#D96C39] focus:border-transparent focus:outline-none cursor-pointer">
                            {PRICE_RANGES.map(range => <option key={range.id} value={range.id}>{range.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="sort-by" className="block text-sm font-medium mb-2" style={{color: '#3F2E23'}}>Sắp xếp</label>
                        <select id="sort-by" value={sortBy} onChange={e => setSortBy(e.target.value)} style={inputStyles} className="focus:ring-2 focus:ring-[#D96C39] focus:border-transparent focus:outline-none cursor-pointer">
                            {SORT_OPTIONS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                        </select>
                    </div>
                </div>

                <div className="pt-2 border-t" style={{ borderColor: '#E8D5B5' }}>
                    <label className="block text-sm font-medium mb-3 mt-4" style={{color: '#3F2E23'}}>Lọc theo Danh mục</label>
                    {isLoading ? (
                        <div className="text-sm animate-pulse" style={{ color: '#D96C39' }}>Đang tải danh mục...</div>
                    ) : (
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => setSelectedCategoryId('all')}
                                className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-sm border"
                                style={{
                                    backgroundColor: selectedCategoryId === 'all' ? '#D96C39' : '#F7F1E8',
                                    color: selectedCategoryId === 'all' ? 'white' : '#3F2E23',
                                    borderColor: selectedCategoryId === 'all' ? '#D96C39' : '#D96C39'
                                }}
                            >
                                Tất cả
                            </button>
                            {categories.map((category, index) => (
                                <button
                                    key={category.categoryId ?? `category-${index}`}
                                    onClick={() => setSelectedCategoryId(category.categoryId)}
                                    className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-sm border"
                                    style={{
                                        backgroundColor: selectedCategoryId === category.categoryId ? '#D96C39' : '#F7F1E8',
                                        color: selectedCategoryId === category.categoryId ? 'white' : '#3F2E23',
                                        borderColor: selectedCategoryId === category.categoryId ? '#D96C39' : '#D96C39'
                                    }}
                                >
                                    {category.categoryName}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Product Table */}
            <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: '#FDFBF7', border: '1px solid #E8D5B5' }}>
                <DataTable columns={columns} data={filteredProducts} onRowClick={handleRowClick} />
            </div>
        </div>
    );
};