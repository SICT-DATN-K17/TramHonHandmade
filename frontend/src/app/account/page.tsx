"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Header, Footer } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast, { Toaster } from "react-hot-toast";
import useAxiosAuth from "@/hooks/useAxiosAuth";
import {
    Loader2, User, MapPin, Phone, Mail,
    Save, FileText, UserCircle2
} from "lucide-react";

export default function MyAccountPage() {
    const { data: session, status, update } = useSession();
    const axiosAuth = useAxiosAuth();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        bio: "",
        phone: "",
        detailAddress: "",
    });

    // Fetch dữ liệu khi load trang
    useEffect(() => {
        const fetchUserData = async () => {
            if (status !== "authenticated" || !session?.user?.id) return;

            try {
                // 1. Lấy thông tin cơ bản của User
                // Giả định ông có API GET /users/{id}/ hoặc /users/me/
                const userRes = await axiosAuth.get(`/users/${session.user.id}/`);
                const userData = userRes.data;

                let addressData = { phoneNumber: "", detailAddress: "" };

                // 2. Lấy thông tin Địa chỉ (từ API my-address mình vừa viết)
                try {
                    const addressRes = await axiosAuth.get('/my-address/');
                    addressData = addressRes.data;
                } catch (addrErr: any) {
                    // Nếu trả về 404 (Chưa có địa chỉ) thì bỏ qua, không văng lỗi
                    if (addrErr.response?.status !== 404) {
                        console.error("Lỗi fetch địa chỉ:", addrErr);
                    }
                }

                // Gộp data vào Form
                setFormData({
                    name: userData.name || "",
                    email: userData.email || "", 
                    bio: userData.bio || "",
                    phone: addressData.phoneNumber || "", 
                    detailAddress: addressData.detailAddress || "",
                });

            } catch (error) {
                console.error("Lỗi khi tải thông tin:", error);
                toast.error("Không thể tải thông tin người dùng.");
            } finally {
                setIsLoading(false);
            }
        };

        if (status !== "loading") {
            fetchUserData();
        }
    }, [status, session, axiosAuth]);

    // Xử lý Input thay đổi
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Xử lý Lưu thông tin
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate sương sương
        if (!formData.name.trim()) return toast.error("Họ và tên không được để trống!");
        if (formData.phone && !/^0\d{9}$/.test(formData.phone.replace(/\s/g, ''))) {
            return toast.error("Số điện thoại không hợp lệ (Phải có 10 số và bắt đầu bằng số 0)!");
        }

        setIsSaving(true);
        const toastId = toast.loading('Đang cập nhật thông tin...');

        try {
            // 1. Cập nhật User (Tên, Bio) - Dùng PATCH
            const userPromise = axiosAuth.patch(`/users/${session?.user?.id}/`, {
                name: formData.name,
                bio: formData.bio
            });

            // 2. Cập nhật Địa chỉ (SĐT, Địa chỉ chi tiết) - Dùng PUT
            const addressPromise = axiosAuth.put('/my-address/', {
                full_name: formData.name,
                phone_number: formData.phone.replace(/\s/g, ''),
                detail_address: formData.detailAddress
            });

            // ÉP CẢ 2 API PHẢI CHẠY XONG CÙNG LÚC MỚI BÁO THÀNH CÔNG
            await Promise.all([userPromise, addressPromise]);
            await update({ name: formData.name });
            toast.success(<b>Cập nhật thông tin thành công!</b>, { id: toastId });

        } catch (error: any) {
            console.error("Lỗi save:", error);

            // Moi móc lỗi chi tiết từ Django REST Framework trả về
            let errorMsg = "Có lỗi xảy ra khi lưu thông tin.";
            if (error.response?.data) {
                if (typeof error.response.data === 'string') {
                    errorMsg = error.response.data;
                } else if (error.response.data.detail) {
                    errorMsg = error.response.data.detail;
                } else {
                    // Lấy cái lỗi đầu tiên trong object lỗi (VD: {"phone_number": ["Trùng số"]})
                    const firstKey = Object.keys(error.response.data)[0];
                    if (firstKey && error.response.data[firstKey]) {
                        errorMsg = `${firstKey}: ${error.response.data[firstKey]}`;
                    }
                }
            }
            toast.error(<b>{errorMsg}</b>, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };
    if (status === "loading" || isLoading) {
        return (
            <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
                <Header />
                <div className="flex-grow flex flex-col items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin mb-4 text-[#D96C39]" />
                    <p className="text-lg font-medium animate-pulse text-[#6B4F3E]">Đang tải hồ sơ của bạn...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: '#FDFBF7', color: '#3F2E23' }}>
            <Toaster position="top-center" />
            <Header />

            <main className="flex-grow container mx-auto px-4 py-12 max-w-5xl">
                {/* Header Page */}
                <div className="mb-10 text-center">
                    <div className="w-20 h-20 bg-[#FFF8F0] rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[#E8D5B5] shadow-sm">
                        <UserCircle2 size={40} className="text-[#D96C39]" />
                    </div>
                    <h1 className="text-4xl font-extrabold mb-3 text-[#3F2E23]">Hồ sơ của tôi</h1>
                    <div className="h-1 w-24 mx-auto rounded-full mb-4 bg-[#D96C39]"></div>
                    <p className="text-lg text-[#6B4F3E]">Quản lý thông tin cá nhân và địa chỉ giao hàng</p>
                </div>

                <form onSubmit={handleSave} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* CỘT 1: THÔNG TIN CƠ BẢN */}
                        <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E8D5B5] shadow-sm">
                            <h3 className="text-xl font-bold flex items-center gap-2 mb-6 border-b border-[#E8D5B5] pb-4">
                                <User className="text-[#D96C39]" size={22} /> Thông tin cá nhân
                            </h3>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-[#6B4F3E] mb-2 uppercase tracking-wide">Họ và Tên</label>
                                    <Input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Nhập họ và tên..."
                                        className="h-12 border-[#E8D5B5] focus-visible:ring-[#D96C39] rounded-xl bg-[#FDFBF7]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[#6B4F3E] mb-2 uppercase tracking-wide">Email đăng nhập</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <Input
                                            value={formData.email}
                                            disabled
                                            className="h-12 pl-11 border-gray-200 bg-gray-50 text-gray-500 rounded-xl cursor-not-allowed"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1.5">* Email không thể thay đổi</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[#6B4F3E] mb-2 uppercase tracking-wide flex items-center gap-2">
                                        Giới thiệu bản thân <span className="text-xs font-normal text-gray-400 normal-case">(Tùy chọn)</span>
                                    </label>
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        placeholder="Vài dòng giới thiệu về bạn..."
                                        rows={4}
                                        className="w-full rounded-xl border border-[#E8D5B5] bg-[#FDFBF7] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D96C39] focus:border-transparent resize-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* CỘT 2: ĐỊA CHỈ GIAO HÀNG */}
                        <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E8D5B5] shadow-sm flex flex-col">
                            <h3 className="text-xl font-bold flex items-center gap-2 mb-6 border-b border-[#E8D5B5] pb-4">
                                <MapPin className="text-[#D96C39]" size={22} /> Địa chỉ nhận hàng
                            </h3>

                            <div className="space-y-5 flex-grow">
                                <div>
                                    <label className="block text-sm font-bold text-[#6B4F3E] mb-2 uppercase tracking-wide">Số điện thoại</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D96C39]" size={18} />
                                        <Input
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="09..."
                                            className="h-12 pl-11 border-[#E8D5B5] focus-visible:ring-[#D96C39] rounded-xl bg-[#FDFBF7]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[#6B4F3E] mb-2 uppercase tracking-wide">Địa chỉ chi tiết</label>
                                    <div className="relative">
                                        <FileText className="absolute left-4 top-4 text-[#D96C39]" size={18} />
                                        <textarea
                                            name="detailAddress"
                                            value={formData.detailAddress}
                                            onChange={handleChange}
                                            placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố..."
                                            rows={5}
                                            className="w-full pl-11 rounded-xl border border-[#E8D5B5] bg-[#FDFBF7] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D96C39] focus:border-transparent resize-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-[#FFF8F0] border border-[#E8D5B5] rounded-xl flex gap-3 items-start mt-4">
                                    <span className="text-lg">💡</span>
                                    <p className="text-xs text-[#6B4F3E] font-medium leading-relaxed">
                                        Địa chỉ này sẽ được điền mặc định vào biểu mẫu khi bạn thực hiện Đặt hàng hoặc Yêu cầu làm đồ Custom.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* NÚT LƯU NẰM DƯỚI CÙNG */}
                    <div className="mt-10 flex justify-center">
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="bg-[#3F2E23] hover:bg-black text-white font-bold h-14 px-12 rounded-full shadow-lg transition-all hover:-translate-y-1 text-base flex items-center gap-2"
                        >
                            {isSaving ? (
                                <Loader2 className="animate-spin" size={22} />
                            ) : (
                                <Save size={22} />
                            )}
                            {isSaving ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
                        </Button>
                    </div>
                </form>
            </main>

            <Footer />
        </div>
    );
}