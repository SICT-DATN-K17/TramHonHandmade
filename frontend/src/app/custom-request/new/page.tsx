'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import useAxiosAuth from '@/hooks/useAxiosAuth';
import { ArrowLeft, Upload, X, Loader2, Sparkles, Palette } from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinary';

interface FormValues {
    artisanId: string;
    title: string;
    description: string;
    expectedPrice: string;
}

interface FormErrors {
    artisanId?: string;
    title?: string;
    description?: string;
}

function NewCustomRequestForm() {
    const axiosAuth = useAxiosAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const initialArtisanId = searchParams.get('artisanId') || '';

    const [submitting, setSubmitting] = useState(false);
    const [artisans, setArtisans] = useState<{ id: number, name: string }[]>([]);

    const [formValues, setFormValues] = useState<FormValues>({
        artisanId: initialArtisanId,
        title: '',
        description: '',
        expectedPrice: '',
    });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [errors, setErrors] = useState<FormErrors>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchArtisans = async () => {
            try {
                const res = await axiosAuth.get('/users/?role=ARTISAN');
                setArtisans(res.data);
            } catch (err) {
                console.error("Không lấy được danh sách nghệ nhân", err);
            }
        };
        fetchArtisans();
    }, [axiosAuth]);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleInputChange = (field: keyof FormValues, value: string) => {
        setFormValues((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type.startsWith('image/')) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
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
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        if (!formValues.artisanId) newErrors.artisanId = 'Vui lòng chọn Nghệ nhân để gửi gắm ý tưởng';
        if (!formValues.title.trim()) newErrors.title = 'Vui lòng đặt tên cho ý tưởng của bạn';
        if (!formValues.description.trim()) newErrors.description = 'Hãy mô tả một chút để nghệ nhân hiểu rõ mong muốn của bạn nhé';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Vui lòng điền những thông tin cần thiết nhé!');
            return;
        }

        setSubmitting(true);
        let imageUrl = null;
        const uploadToast = toast.loading('Đang gói ghém yêu cầu của bạn...');

        try {
            if (selectedFile) {
                toast.loading('Đang đính kèm hình ảnh...', { id: uploadToast });
                imageUrl = await uploadToCloudinary(selectedFile, 'custom-request');
            }

            toast.loading('Đang gửi đến nghệ nhân...', { id: uploadToast });

            const payload = {
                artisanId: Number(formValues.artisanId),
                title: formValues.title.trim(),
                description: formValues.description.trim() || null,
                budget: formValues.expectedPrice ? Number(formValues.expectedPrice) : null,
                referenceImage: imageUrl || null,
            };

            const response = await axiosAuth.post('/chat/initiate/', payload);

            toast.success('Gửi yêu cầu thành công!', { id: uploadToast });
            router.push(`/chat/${response.data.chatId}`);

        } catch (error) {
            const err = error as any;
            const errorMessage = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại.';
            toast.error(errorMessage, { id: uploadToast });
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    // Tìm tên nghệ nhân nếu đã chọn sẵn
    const selectedArtisanName = artisans.find(a => a.id.toString() === initialArtisanId)?.name;

    return (
        <main className="container mx-auto px-4 py-12 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Link
                href="/custom-request"
                className="inline-flex items-center gap-2 text-gray-500 hover:text-[#D96C39] mb-8 transition-colors font-medium"
            >
                <ArrowLeft size={18} />
                Quay lại danh sách
            </Link>

            <div className="mb-10 text-center">
                <div className="inline-flex items-center justify-center p-4 bg-[#FFF8F0] rounded-full text-[#D96C39] mb-4 shadow-sm border border-[#E8D5B5]">
                    <Palette size={32} />
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold mb-3 text-[#3F2E23]">Biến ý tưởng thành hiện thực</h1>
                <p className="text-[#6B4F3E] max-w-lg mx-auto text-base leading-relaxed">
                    Kể cho chúng tôi nghe về món đồ bạn đang ấp ủ, những đôi tay tài hoa sẽ giúp bạn chế tác nó.
                </p>
            </div>

            <div className="bg-white border border-[#E8D5B5] rounded-3xl p-6 md:p-10 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* XỬ LÝ GIAO DIỆN CHỌN NGHỆ NHÂN */}
                    {initialArtisanId ? (
                        <div className="bg-[#FFF8F0] p-6 rounded-2xl border border-[#D96C39]/30 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#D96C39]"></div>
                            <Sparkles className="mx-auto text-[#D96C39] mb-2" size={24} />
                            <h3 className="text-lg font-bold text-[#3F2E23] mb-1">
                                Yêu cầu chế tác riêng từ <span className="text-[#D96C39]">{selectedArtisanName || "gian hàng này"}</span>
                            </h3>
                            <p className="text-sm text-[#6B4F3E]">
                                Hãy chia sẻ thật chi tiết ý tưởng của bạn nhé. Nghệ nhân sẽ liên hệ lại để tư vấn và phác thảo sản phẩm.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-[#FFF8F0] p-6 rounded-2xl border border-[#E8D5B5]">
                            <Label htmlFor="artisanId" className="text-base font-bold text-[#3F2E23]">
                                Bạn muốn gửi gắm ý tưởng này cho ai? <span className="text-red-500">*</span>
                            </Label>
                            <p className="text-xs text-[#6B4F3E] mt-1 mb-3">Chọn một nghệ nhân mà bạn yêu thích phong cách của họ nhất.</p>
                            <select
                                id="artisanId"
                                value={formValues.artisanId}
                                onChange={(e) => handleInputChange('artisanId', e.target.value)}
                                className="flex h-12 w-full rounded-xl border border-[#E8D5B5] bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D96C39] focus:border-transparent font-medium shadow-sm transition-shadow hover:shadow-md"
                                disabled={submitting || artisans.length === 0}
                            >
                                <option value="">-- Lựa chọn nghệ nhân --</option>
                                {artisans.map(art => (
                                    <option key={art.id} value={art.id}>{art.name}</option>
                                ))}
                            </select>
                            {errors.artisanId && <p className="text-red-500 text-sm mt-1 font-medium">{errors.artisanId}</p>}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <Label htmlFor="title" className="text-base font-bold text-[#3F2E23]">
                            Tên món đồ bạn muốn làm <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="title"
                            type="text"
                            value={formValues.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            placeholder="Ví dụ: Ví da nam khắc tên, Bình gốm men hỏa biến..."
                            className="mt-2 h-12 rounded-xl border-[#E8D5B5] focus-visible:ring-[#D96C39] bg-gray-50/50"
                            disabled={submitting}
                        />
                        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <Label htmlFor="description" className="text-base font-bold text-[#3F2E23]">
                            Kể chi tiết về ý tưởng của bạn <span className="text-red-500">*</span>
                        </Label>
                        <p className="text-xs text-[#6B4F3E] mb-2 mt-1">
                            Về chất liệu, kích thước, màu sắc hay hoa văn. Càng chi tiết, nghệ nhân càng dễ hình dung.
                        </p>
                        <textarea
                            id="description"
                            value={formValues.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Mình đang tìm kiếm một chiếc túi tote vải canvas dày dặn, quai đeo bằng da bò thật. Form túi cứng cáp có thể đựng vừa laptop 14 inch..."
                            rows={5}
                            className="flex w-full rounded-xl border border-[#E8D5B5] bg-gray-50/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D96C39] disabled:cursor-not-allowed disabled:opacity-50 mt-2 resize-none"
                            disabled={submitting}
                        />
                        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                    </div>

                    {/* Expected Price & Image (2 Cột trên màn hình to) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label htmlFor="expectedPrice" className="text-base font-bold text-[#3F2E23]">Ngân sách dự kiến</Label>
                            <p className="text-xs text-[#6B4F3E] mb-2 mt-1">Để thợ chọn vật liệu phù hợp nhất (Không bắt buộc)</p>
                            <Input
                                id="expectedPrice"
                                type="number"
                                value={formValues.expectedPrice}
                                onChange={(e) => handleInputChange('expectedPrice', e.target.value)}
                                placeholder="VD: 1000000 ₫"
                                className="h-12 rounded-xl border-[#E8D5B5] focus-visible:ring-[#D96C39] bg-gray-50/50"
                                disabled={submitting}
                                min="0"
                            />
                        </div>

                        <div>
                            <Label className="block mb-2 font-bold text-[#3F2E23]">Hình ảnh đính kèm (Tối đa 1 ảnh)</Label>
                            <div className="flex justify-start">
                                {previewUrl ? (
                                    <div className="relative group w-32 aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 border-[#D96C39] shadow-sm">
                                        <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute top-2 right-2 bg-white/90 hover:bg-red-50 text-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-md"
                                            disabled={submitting}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-32 aspect-square border-2 border-dashed border-[#E8D5B5] rounded-xl cursor-pointer bg-[#FFF8F0] hover:bg-[#F7F1E8] hover:border-[#D96C39] transition-colors group">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-6 h-6 text-[#D96C39] mb-2 group-hover:-translate-y-1 transition-transform" />
                                            <p className="text-xs text-[#6B4F3E] font-semibold text-center">Tải ảnh lên</p>
                                        </div>
                                        <Input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={submitting} />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 mt-4 border-t border-[#E8D5B5]">
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-[#D96C39] text-white hover:bg-[#C25B2D] hover:shadow-lg hover:-translate-y-0.5 py-7 text-lg font-extrabold rounded-2xl transition-all"
                        >
                            {submitting ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="animate-spin h-5 w-5" />
                                    Đang gửi yêu cầu...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Sparkles size={20} />
                                    Gửi yêu cầu thiết kế
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </main>
    );
}

export default function NewCustomRequestPage() {
    return (
        <div className="min-h-screen font-sans text-gray-800 bg-[#FDFBF7]">
            <Header />
            <Suspense fallback={
                <div className="flex-1 flex items-center justify-center py-32">
                    <Loader2 className="animate-spin h-10 w-10 text-[#D96C39]" />
                </div>
            }>
                <NewCustomRequestForm />
            </Suspense>
            <Footer />
        </div>
    );
}