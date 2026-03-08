'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Product } from '@/types';
import { axiosClient } from '@/lib/axios';
import useAxiosAuth from '@/hooks/useAxiosAuth';
import { RawProductResponse } from '@/types/apiTypes';
import { mapToProduct } from '@/utils/ProductMapper';
import { useSession } from "next-auth/react";
import { Upload, X, ArrowLeft } from 'lucide-react';

// --- HÀM HELPER XỬ LÝ ẢNH ---
// Hàm này xử lý các trường hợp URL ảnh khác nhau
const getProductImageUrl = (imagePath?: string | null) => {
    // 1. Nếu không có đường dẫn ảnh, trả về ảnh placeholder mặc định
    if (!imagePath) return '/placeholder.jpg';

    // 2. Nếu bắt đầu bằng '//' (protocol-relative), thêm 'https:'
    if (imagePath.startsWith('//')) {
        return `https:${imagePath}`;
    }

    // 3. Nếu đã là đường dẫn tuyệt đối (có http hoặc https), giữ nguyên
    // .startsWith('http') sẽ bắt được cả 'http://' và 'https://'
    if (imagePath.startsWith('http')) {
        return imagePath;
    }

    // 4. Handle relative paths from backend
    // Thêm URL backend cho các đường dẫn tương đối
    if (!imagePath.startsWith('/')) {
        return `http://127.0.0.1:8000/${imagePath}`;
    }

    // 5. Trường hợp còn lại: đường dẫn tuyệt đối cục bộ
    return imagePath;
};
// ---------------------------


interface FormValues {
    title: string;
    description: string;
    expected_price: string;
}

interface FormErrors {
    title?: string;
    description?: string;
}

export default function CustomRequestPage() {
    const { data: session } = useSession();
    const axiosAuth = useAxiosAuth();
    const params = useParams();
    const router = useRouter();
    const productId = Array.isArray(params.productId) ? Number(params.productId[0]) : Number(params.productId);

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formValues, setFormValues] = useState<FormValues>({
        title: '',
        description: '',
        expected_price: '',
    });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [errors, setErrors] = useState<FormErrors>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    useEffect(() => {
        if (!productId || Number.isNaN(productId)) {
            toast.error('ID sản phẩm không hợp lệ');
            setLoading(false);
            return;
        }

        const fetchProduct = async () => {
            try {
                const productData = await axiosClient.get<RawProductResponse>(`/products/${productId}`);
                const product = mapToProduct(productData.data);
                setProduct(product);
                setFormValues(prev => ({ ...prev, title: `Yêu cầu tùy chỉnh: ${product.name}` }));
            } catch (err) {
                toast.error('Không tải được thông tin sản phẩm');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [productId]);

    const handleInputChange = (field: keyof FormValues, value: string) => {
        setFormValues((prev) => ({ ...prev, [field]: value }));
        if (errors[field as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type.startsWith('image/')) {
            setSelectedFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        } else {
            toast.error("Vui lòng chọn file hình ảnh hợp lệ");
        }
    };

    const removeImage = () => {
        setSelectedFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        if (!formValues.title.trim()) newErrors.title = 'Vui lòng nhập tiêu đề yêu cầu';
        if (!formValues.description.trim()) newErrors.description = 'Vui lòng nhập mô tả chi tiết';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        setSubmitting(true);

        try {
            const formDataPayload = new FormData();

            // @ts-ignore: Nếu product type của bạn có owner/artisan_id thì dùng
            const artisanId = product?.owner?.id || 1;

            formDataPayload.append('artisanId', artisanId.toString());
            formDataPayload.append('productId', productId.toString());
            formDataPayload.append('title', formValues.title.trim());
            formDataPayload.append('description', formValues.description.trim());

            if (formValues.expected_price) {
                formDataPayload.append('budget', formValues.expected_price);
            }

            if (selectedFile) {
                formDataPayload.append('reference_image', selectedFile);
            }

            const response = await axiosAuth.post('/chat/initiate/', formDataPayload);

            toast.success('Yêu cầu đã được gửi thành công!');
            router.push(`/chat/${response.data.chatId}`);
        } catch (error) {
            toast.error('Có lỗi xảy ra khi gửi yêu cầu');
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen font-sans text-gray-800 bg-white">
                <Header />
                <main className="container mx-auto px-6 py-12">
                    <div className="text-center py-24">Đang tải...</div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen font-sans text-gray-800 bg-white">
                <Header />
                <main className="container mx-auto px-6 py-12">
                    <div className="text-center py-24">
                        <h2 className="text-2xl font-semibold mb-4">Không tìm thấy sản phẩm</h2>
                        <Link href="/shop/products" className="text-[#0f172a] hover:underline">
                            ← Quay lại cửa hàng
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans text-gray-800 bg-white">
            <Header />

            <main className="container mx-auto px-6 py-12 max-w-4xl">
                <Link
                    href={`/shop/id/${productId}`}
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-[#0f172a] mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Quay lại sản phẩm
                </Link>

                <h1 className="text-3xl font-bold mb-8">Yêu cầu sản phẩm tùy chỉnh</h1>

                {/* Product Information Section */}
                <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4">Thông tin sản phẩm gốc</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="relative w-full aspect-[4/3] md:h-40 rounded-lg overflow-hidden bg-white border">
                            {/* SỬ DỤNG HÀM HELPER Ở ĐÂY */}
                            <Image
                                src={getProductImageUrl(product.image)}
                                alt={product.name}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
                            <p className="text-gray-600 text-sm line-clamp-2">{product.description || 'Không có mô tả'}</p>
                            <p className="text-lg font-bold text-[#0f172a]">
                                ₫{(product.price || 0).toLocaleString('vi-VN')}
                            </p>
                            <div className="inline-block bg-blue-50 border border-blue-100 rounded-md px-3 py-2 mt-2">
                                <p className="text-xs text-blue-700 font-medium">
                                    Sản phẩm này sẽ được dùng làm mẫu để tùy chỉnh theo ý bạn.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Custom Request Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div>
                        <Label htmlFor="title" className="text-base font-semibold">
                            Tiêu đề yêu cầu <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="title"
                            type="text"
                            value={formValues.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            placeholder="Ví dụ: Đặt làm bình gốm màu xanh dương"
                            className="mt-2"
                            disabled={submitting}
                        />
                        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <Label htmlFor="description" className="text-base font-semibold">
                            Mô tả chi tiết <span className="text-red-500">*</span>
                        </Label>
                        <p className="text-xs text-gray-500 mb-2">
                            Hãy mô tả những thay đổi bạn muốn so với sản phẩm gốc (màu sắc, kích thước, v.v.)
                        </p>
                        <textarea
                            id="description"
                            value={formValues.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Tôi muốn giữ kiểu dáng này nhưng thay đổi màu men sang..."
                            rows={5}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2 resize-none"
                            disabled={submitting}
                        />
                        {errors.description && (
                            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                        )}
                    </div>

                    {/* Expected Price */}
                    <div>
                        <Label htmlFor="expected_price">Giá mong muốn (₫)</Label>
                        <Input
                            id="expected_price"
                            type="number"
                            value={formValues.expected_price}
                            onChange={(e) => handleInputChange('expected_price', e.target.value)}
                            placeholder="Ví dụ: 500000"
                            className="mt-2"
                            disabled={submitting}
                            min="0"
                        />
                    </div>

                    {/* Reference Images - Single Upload */}
                    <div>
                        <Label className="block mb-2">Hình ảnh tham khảo bổ sung (Tối đa 1 ảnh)</Label>

                        <div className="flex justify-start">
                            {previewUrl ? (
                                <div className="relative group w-40 aspect-square rounded-lg overflow-hidden bg-gray-100 border shadow-sm">
                                    <Image
                                        src={previewUrl}
                                        alt="Reference Preview"
                                        fill
                                        className="object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="absolute top-1 right-1 bg-white/90 hover:bg-white text-red-500 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all shadow-md"
                                        disabled={submitting}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-40 aspect-square border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                        <p className="text-xs text-gray-500 font-semibold text-center px-2">
                                            Tải ảnh lên
                                        </p>
                                    </div>
                                    <Input
                                        ref={fileInputRef}
                                        id="reference_image"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        disabled={submitting}
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-4 pt-4 border-t">
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 bg-[#0f172a] text-white hover:bg-gray-800 py-6 text-lg font-medium"
                        >
                            {submitting ? (
                                <span className="flex items-center gap-2">
                                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                                    Đang gửi yêu cầu...
                                </span>
                            ) : (
                                'Gửi yêu cầu tùy chỉnh'
                            )}
                        </Button>
                        <Link href={`/shop/id/${productId}`}>
                            <Button type="button" variant="outline" disabled={submitting} className="py-6 text-lg">
                                Hủy bỏ
                            </Button>
                        </Link>
                    </div>
                </form>
            </main>

            <Footer />
        </div>
    );
}