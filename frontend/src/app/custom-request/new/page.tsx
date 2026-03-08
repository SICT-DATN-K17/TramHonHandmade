'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import useAxiosAuth from '@/hooks/useAxiosAuth';
import { ArrowLeft, Upload, X } from 'lucide-react';

interface FormValues {
    title: string;
    description: string;
    expected_price: string;
}

interface FormErrors {
    title?: string;
    description?: string;
}

export default function NewCustomRequestPage() {
    const axiosAuth = useAxiosAuth();
    const router = useRouter();

    const [submitting, setSubmitting] = useState(false);

    // Lưu trữ các giá trị text
    const [formValues, setFormValues] = useState<FormValues>({
        title: '',
        description: '',
        expected_price: '',
    });

    // State riêng để lưu file thực tế (để gửi lên server)
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    // State để lưu URL preview ảnh (để hiển thị UI)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [errors, setErrors] = useState<FormErrors>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cleanup URL preview khi component unmount để tránh leak memory
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

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
            // 1. Lưu file gốc để gửi đi
            setSelectedFile(file);

            // 2. Tạo URL preview cho UI
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
        if (!formValues.description.trim()) newErrors.description = 'Vui lòng nhập mô tả ý tưởng';
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
            // --- CHUYỂN ĐỔI SANG FORMDATA (MULTIPART) ---
            const formDataPayload = new FormData();

            // Các trường text
            formDataPayload.append('artisanId', '1'); // ID artisan mặc định hoặc logic chọn
            // formDataPayload.append('productId', ''); // Nếu null thì có thể không append hoặc gửi chuỗi rỗng tùy backend
            formDataPayload.append('title', formValues.title.trim());
            formDataPayload.append('description', formValues.description.trim());

            if (formValues.expected_price) {
                formDataPayload.append('budget', formValues.expected_price);
            }

            // File ảnh (QUAN TRỌNG)
            if (selectedFile) {
                // 'reference_image' phải trùng với tên tham số @RequestParam trong Controller Java
                // Ví dụ: public ResponseEntity<?> initiateChat(@RequestParam("reference_image") MultipartFile file, ...)
                formDataPayload.append('reference_image', selectedFile);
            }

            // Axios sẽ tự động set Header 'Content-Type': 'multipart/form-data' khi nhận thấy data là FormData
            const response = await axiosAuth.post('/chat/initiate/', formDataPayload);

            toast.success('Gửi yêu cầu thành công!');
            router.push(`/chat/${response.data.chatId}`);
        } catch (error) {
            toast.error('Có lỗi xảy ra khi gửi yêu cầu');
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen font-sans text-gray-800 bg-white">
            <Header />

            <main className="container mx-auto px-4 py-12 max-w-3xl">
                <Link
                    href="/shop/products"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-[#0f172a] mb-6 transition-colors"
                >
                    <ArrowLeft size={18} />
                    Quay lại cửa hàng
                </Link>

                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-bold mb-3">Tạo yêu cầu thiết kế mới</h1>
                    <p className="text-gray-600">
                        Bạn có ý tưởng độc đáo? Hãy mô tả cho nghệ nhân để biến nó thành hiện thực.
                    </p>
                </div>

                <div className="bg-white border rounded-xl p-6 md:p-8 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div>
                            <Label htmlFor="title" className="text-base font-semibold">
                                Tiêu đề ý tưởng <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="title"
                                type="text"
                                value={formValues.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                placeholder="Ví dụ: Bộ ấm trà gốm men hỏa biến..."
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
                                Hãy mô tả kỹ về kích thước, màu sắc, chất liệu và phong cách bạn mong muốn.
                            </p>
                            <textarea
                                id="description"
                                value={formValues.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="Tôi muốn đặt làm một bộ ấm trà..."
                                rows={6}
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2 resize-none"
                                disabled={submitting}
                            />
                            {errors.description && (
                                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                            )}
                        </div>

                        {/* Expected Price */}
                        <div>
                            <Label htmlFor="expected_price">Ngân sách dự kiến (₫)</Label>
                            <Input
                                id="expected_price"
                                type="number"
                                value={formValues.expected_price}
                                onChange={(e) => handleInputChange('expected_price', e.target.value)}
                                placeholder="Ví dụ: 1000000"
                                className="mt-2"
                                disabled={submitting}
                                min="0"
                            />
                        </div>

                        {/* Reference Image - Single Upload */}
                        <div>
                            <Label className="block mb-2">Hình ảnh tham khảo (Tối đa 1 ảnh)</Label>

                            <div className="flex justify-start">
                                {previewUrl ? (
                                    <div className="relative group w-40 aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                                        <Image
                                            src={previewUrl}
                                            alt="Preview"
                                            fill
                                            className="object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute top-1 right-1 bg-white/80 hover:bg-white text-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
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
                                                Chọn ảnh
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

                        <div className="pt-4 border-t">
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-[#0f172a] text-white hover:bg-gray-800 py-6 text-lg font-medium"
                            >
                                {submitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu thiết kế'}
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
            <Footer />
        </div>
    );
}