'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import useAxiosAuth from '@/hooks/useAxiosAuth';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Store, Mail, Calendar, Edit3, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { mapToUser } from '@/utils/UserMapper';
import { User } from '@/types';
import { RawUserResponse } from '@/types/apiTypes';

export default function ArtisanProfileManagerPage() {
    const { data: session, status } = useSession();
    const axiosAuth = useAxiosAuth();
    
    const [profile, setProfile] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // States cho việc edit Bio
    const [isEditing, setIsEditing] = useState(false);
    const [bioInput, setBioInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Đợi NextAuth load cookie xong đã, đừng vội
        if (status === 'loading') return;

        const fetchProfile = async () => {
            // Load xong rồi mà vẫn không có ID -> Tắt spinner và báo lỗi
            if (!session?.user?.id) {
                console.error("Lỗi: Không tìm thấy session.user.id từ NextAuth");
                setIsLoading(false);
                return;
            }

            try {
                const res = await axiosAuth.get(`/users/${session.user.id}/`);
                const mappedUser = mapToUser(res.data);
                setProfile(mappedUser);
                setBioInput(mappedUser.bio || '');
            } catch (error) {
                console.error("Lỗi fetch profile:", error);
                toast.error("Không thể tải thông tin hồ sơ.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [session, axiosAuth]);

    const handleSaveBio = async () => {
        if (!profile) return;
        setIsSaving(true);
        const toastId = toast.loading('Đang lưu thay đổi...');
        
        try {
            // SỬA Ở ĐÂY: Thêm header explicitly và dùng PUT nếu PATCH dở chứng, 
            // nhưng thường PATCH kèm header này là chạy.
            const response = await axiosAuth.patch(
                `/users/${profile.id}/`, 
                { bio: bioInput },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            // Log ra xem backend nó trả về cái gì
            console.log("Response từ Backend:", response.data);

            // Cập nhật lại UI dựa trên dữ liệu backend trả về cho chắc cú
            setProfile({ ...profile, bio: response.data.bio || bioInput });
            setIsEditing(false);
            toast.success('Đã cập nhật tiểu sử thành công!', { id: toastId });
        } catch (error: any) {
            console.error("Lỗi chi tiết:", error.response?.data || error);
            // Sửa lại dòng báo lỗi để hiện rõ backend chửi câu gì
            const errorMsg = error.response?.data?.detail || error.response?.data?.message || 'Lỗi khi cập nhật tiểu sử.';
            toast.error(errorMsg, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setBioInput(profile?.bio || '');
        setIsEditing(false);
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#D96C39]" />
            </div>
        );
    }

    if (!profile) {
        return <div className="text-center text-[#6B4F3E]">Không tìm thấy thông tin hồ sơ.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500">
            <h1 className="text-3xl font-extrabold text-[#3F2E23] mb-8">Hồ Sơ Của Tôi</h1>

            <div className="bg-white rounded-3xl border border-[#E8D5B5] shadow-sm overflow-hidden mb-8 relative">
                {/* Banner Background */}
                <div className="h-32 md:h-48 w-full bg-gradient-to-r from-[#6B4F3E] to-[#3F2E23] relative">
                    <div className="absolute inset-0 opacity-20 bg-[url('/pattern.png')] bg-repeat"></div>
                </div>

                <div className="px-6 md:px-10 pb-10 relative">
                    {/* Avatar & Basic Info */}
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 md:-mt-20 mb-8">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white bg-[#F7F1E8] shadow-lg flex items-center justify-center flex-shrink-0 z-10 text-5xl font-bold text-[#D96C39]">
                            {profile.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 text-center md:text-left z-10 w-full pt-4 md:pt-0">
                            <h2 className="text-3xl font-extrabold text-[#3F2E23] mb-2">{profile.name}</h2>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-medium text-[#6B4F3E]">
                                <span className="flex items-center gap-1.5 bg-[#FFF8F0] px-3 py-1.5 rounded-full border border-[#E8D5B5]">
                                    <Store size={15} className="text-[#D96C39]" /> Gian hàng Nghệ nhân
                                </span>
                                <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                                    <Mail size={15} /> {profile.email}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Bio Section */}
                    <div className="bg-[#FFF8F0] rounded-2xl p-6 md:p-8 border border-[#E8D5B5] transition-all">
                        <div className="flex items-center justify-between mb-4 border-b border-[#E8D5B5] pb-4">
                            <h3 className="text-lg font-bold text-[#3F2E23] flex items-center gap-2">
                                Tiểu sử / Giới thiệu gian hàng
                            </h3>
                            {!isEditing && (
                                <Button 
                                    onClick={() => setIsEditing(true)} 
                                    variant="outline" 
                                    className="h-9 px-3 border-[#D96C39] text-[#D96C39] hover:bg-[#D96C39] hover:text-white rounded-lg"
                                >
                                    <Edit3 size={16} className="mr-2" /> Chỉnh sửa
                                </Button>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="space-y-4 animate-in slide-in-from-top-2">
                                <textarea
                                    value={bioInput}
                                    onChange={(e) => setBioInput(e.target.value)}
                                    placeholder="Viết một vài dòng giới thiệu về bạn và phong cách nghệ thuật của bạn..."
                                    className="w-full min-h-[150px] p-4 rounded-xl border border-[#D96C39] bg-white focus:outline-none focus:ring-2 focus:ring-[#D96C39]/50 text-[#3F2E23] resize-y"
                                    disabled={isSaving}
                                />
                                <div className="flex items-center justify-end gap-3">
                                    <Button 
                                        variant="ghost" 
                                        onClick={handleCancelEdit} 
                                        disabled={isSaving}
                                        className="text-[#6B4F3E] hover:bg-[#E8D5B5]"
                                    >
                                        <X size={18} className="mr-1" /> Hủy
                                    </Button>
                                    <Button 
                                        onClick={handleSaveBio} 
                                        disabled={isSaving}
                                        className="bg-[#D96C39] hover:bg-[#C25B2D] text-white shadow-sm"
                                    >
                                        {isSaving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Check size={18} className="mr-1" />}
                                        Lưu thay đổi
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-[#6B4F3E] leading-relaxed whitespace-pre-wrap min-h-[60px]">
                                {profile.bio ? profile.bio : <span className="italic opacity-60">Chưa có thông tin giới thiệu. Bấm chỉnh sửa để thêm nhé!</span>}
                            </p>
                        )}
                    </div>
                    
                    {/* Extra Info */}
                    <div className="mt-6 flex justify-end text-sm text-[#6B4F3E]">
                        {profile.createdAt && (
                            <span className="flex items-center gap-1.5">
                                <Calendar size={14} className="opacity-70" /> 
                                Tham gia từ: {formatDate(profile.createdAt)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}