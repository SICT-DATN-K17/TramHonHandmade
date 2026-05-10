'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import useAxiosAuth from '@/hooks/useAxiosAuth';
import toast from 'react-hot-toast';
import { Store, Mail, Calendar, Edit3, Check, X, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { mapToUser } from '@/utils/UserMapper';
import { User } from '@/types';

export default function ArtisanProfileManagerPage() {
    const { data: session, status } = useSession();
    const axiosAuth = useAxiosAuth();
    
    const [profile, setProfile] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Gom chung Name và Bio vào một State form để dễ quản lý
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', bio: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (status === 'loading') return;

        const fetchProfile = async () => {
            if (!session?.user?.id) {
                console.error("Lỗi: Không tìm thấy session.user.id từ NextAuth");
                setIsLoading(false);
                return;
            }

            try {
                const res = await axiosAuth.get(`/users/${session.user.id}/`);
                const mappedUser = mapToUser(res.data);
                setProfile(mappedUser);
                setEditForm({ name: mappedUser.name || '', bio: mappedUser.bio || '' });
            } catch (error) {
                console.error("Lỗi fetch profile:", error);
                toast.error("Không thể tải thông tin hồ sơ.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [session, axiosAuth, status]);

    const handleSaveProfile = async () => {
        if (!profile) return;
        
        if (!editForm.name.trim()) {
            toast.error('Tên không được để trống!');
            return;
        }

        setIsSaving(true);
        const toastId = toast.loading('Đang lưu thay đổi...');
        
        try {
            const payload = {
                name: editForm.name.trim(),
                bio: editForm.bio.trim()
            };

            const response = await axiosAuth.patch(
                `/users/${profile.id}/`, 
                payload,
                { headers: { 'Content-Type': 'application/json' } }
            );
            
            const updatedName = response.data.name || payload.name;
            const updatedBio = response.data.bio || payload.bio;

            // 1. Cập nhật lại giao diện trang Profile
            setProfile({ ...profile, name: updatedName, bio: updatedBio });
            setIsEditing(false);
            
            // 2. Bắn sự kiện lên Header để đổi tên NGAY LẬP TỨC
            window.dispatchEvent(new CustomEvent('profile-updated', { detail: { name: updatedName } }));

            toast.success('Đã cập nhật hồ sơ thành công!', { id: toastId });
        } catch (error: any) {
            console.error("Lỗi chi tiết:", error.response?.data || error);
            const errorMsg = error.response?.data?.detail || error.response?.data?.message || 'Lỗi khi cập nhật hồ sơ.';
            toast.error(errorMsg, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setEditForm({ name: profile?.name || '', bio: profile?.bio || '' });
        setIsEditing(false);
    };

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#D96C39]" />
            </div>
        );
    }

    if (!profile) {
        return <div className="text-center py-20 text-[#6B4F3E] font-medium">Không tìm thấy thông tin hồ sơ.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500 font-sans">
            
            {/* Tiêu đề trang & Nút Edit Global */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-extrabold text-[#3F2E23]">Hồ Sơ Của Bạn</h1>
                {!isEditing && (
                    <Button 
                        onClick={() => setIsEditing(true)} 
                        className="bg-[#D96C39] hover:bg-[#C25B2D] text-white rounded-full px-6 shadow-md transition-all transform hover:scale-105"
                    >
                        <Edit3 size={18} className="mr-2" /> Chỉnh sửa hồ sơ
                    </Button>
                )}
            </div>

            <div className="bg-white rounded-3xl border border-[#E8D5B5] shadow-sm overflow-hidden mb-8 relative transition-all duration-300">
                {/* Banner Background */}
                <div className="h-40 md:h-52 w-full bg-gradient-to-r from-[#6B4F3E] via-[#8A7A6B] to-[#3F2E23] relative">
                    <div className="absolute inset-0 opacity-10 bg-[url('/pattern.png')] bg-repeat"></div>
                    <div className="absolute bottom-4 right-4 text-white/50 flex items-center gap-1 text-sm font-medium">
                        <Sparkles size={16} /> TRẠM HỒN
                    </div>
                </div>

                <div className="px-6 md:px-12 pb-10 relative">
                    {/* KHỐI CHỨA AVATAR VÀ THÔNG TIN ĐÃ SỬA LỖI ĐÈ NỀN */}
                    <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-10 relative">
                        {/* Avatar: Kéo nổi lên trên Banner */}
                        <div className="-mt-16 md:-mt-24 w-36 h-36 md:w-44 md:h-44 rounded-full border-4 border-white bg-[#F7F1E8] shadow-lg flex items-center justify-center flex-shrink-0 z-20 text-6xl font-bold text-[#D96C39] mx-auto md:mx-0">
                            {profile.name.charAt(0).toUpperCase()}
                        </div>
                        
                        {/* Text Info: Hạ cánh an toàn xuống nền trắng */}
                        <div className="flex-1 text-center md:text-left z-10 w-full pt-2 md:pt-4">
                            {isEditing ? (
                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-[#6B4F3E] uppercase tracking-wider mb-1">Tên hiển thị</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                        className="w-full md:w-2/3 text-2xl md:text-3xl font-extrabold text-[#3F2E23] p-2 border-b-2 border-[#D96C39] bg-[#FFF8F0] focus:outline-none focus:bg-white rounded-t-md transition-colors"
                                        placeholder="Nhập tên của bạn..."
                                        disabled={isSaving}
                                    />
                                </div>
                            ) : (
                                <h2 className="text-3xl md:text-4xl font-extrabold text-[#3F2E23] mb-3">{profile.name}</h2>
                            )}

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4 text-sm font-medium text-[#6B4F3E]">
                                <span className="flex items-center gap-1.5 bg-[#FFF8F0] px-4 py-2 rounded-full border border-[#E8D5B5] shadow-sm">
                                    <Store size={16} className="text-[#D96C39]" /> Nghệ nhân chính thức
                                </span>
                                <span className="flex items-center gap-1.5 bg-gray-50 px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                                    <Mail size={16} className="text-gray-500" /> {profile.email}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Tiểu sử Section */}
                    <div className={`rounded-2xl p-6 md:p-8 transition-all duration-300 ${isEditing ? 'bg-[#FFF8F0] border-2 border-[#D96C39]/30 shadow-inner' : 'bg-gray-50 border border-gray-100'}`}>
                        <div className="flex items-center gap-2 mb-4 border-b border-[#E8D5B5] pb-3">
                            <h3 className="text-lg font-bold text-[#3F2E23]">Tiểu sử / Giới thiệu gian hàng</h3>
                        </div>

                        {isEditing ? (
                            <div className="space-y-4 animate-in slide-in-from-bottom-2">
                                <textarea
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                                    placeholder="Viết một vài dòng giới thiệu về bản thân, phong cách nghệ thuật hoặc câu chuyện thương hiệu của bạn..."
                                    className="w-full min-h-[160px] p-4 rounded-xl border border-[#E8D5B5] bg-white focus:outline-none focus:ring-2 focus:ring-[#D96C39]/50 focus:border-[#D96C39] text-[#3F2E23] resize-y text-base leading-relaxed"
                                    disabled={isSaving}
                                />
                                
                                {/* Hành động Lưu / Hủy */}
                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <Button 
                                        variant="outline" 
                                        onClick={handleCancelEdit} 
                                        disabled={isSaving}
                                        className="text-[#6B4F3E] border-[#E8D5B5] hover:bg-[#E8D5B5] rounded-full px-6"
                                    >
                                        <X size={18} className="mr-2" /> Hủy bỏ
                                    </Button>
                                    <Button 
                                        onClick={handleSaveProfile} 
                                        disabled={isSaving}
                                        className="bg-[#D96C39] hover:bg-[#C25B2D] text-white shadow-md rounded-full px-8 transform transition hover:scale-105"
                                    >
                                        {isSaving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Check size={18} className="mr-2" />}
                                        Lưu thay đổi
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-[#3F2E23] text-base leading-relaxed whitespace-pre-wrap min-h-[80px]">
                                {profile.bio ? profile.bio : <span className="italic opacity-50 text-[#6B4F3E]">Chưa có thông tin giới thiệu. Bấm "Chỉnh sửa hồ sơ" ở góc trên để thêm vào nhé!</span>}
                            </p>
                        )}
                    </div>
                    
                    {/* Ngày tham gia */}
                    <div className="mt-8 flex justify-end text-sm font-medium text-[#8A7A6B]">
                        {profile.createdAt && (
                            <span className="flex items-center gap-1.5 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                                <Calendar size={16} /> 
                                Ngày tham gia: {formatDate(profile.createdAt)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}