'use client';

import React, {useState} from 'react';
import {axiosClient} from "@/lib/axios";

interface ResetPasswordFormProps {
    email: string;
    onSuccess: () => void;
    onResendCode: () => void; // Thêm callback để gửi lại mã
}

export default function ResetPasswordForm({email, onSuccess, onResendCode}: ResetPasswordFormProps) {
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [resendMessage, setResendMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (newPassword !== confirmPassword) {
            setError('Mật khẩu mới không khớp.');
            return;
        }

        setIsLoading(true);
        try {
            await axiosClient.post('/auth/reset-password' ,{
                email : email,
                code : code,
                newPassword : newPassword,
            });

            setSuccessMessage('Mật khẩu của bạn đã được đặt lại thành công! Đang chuyển hướng...');
            setTimeout(() => {
                onSuccess();
            }, 3000);

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Lỗi không xác định');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendClick = () => {
        onResendCode();
        setResendMessage('Đã gửi lại mã. Vui lòng kiểm tra email.');
        // Xóa thông báo sau vài giây
        setTimeout(() => setResendMessage(''), 5000);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error &&
                <div className="p-3 text-sm text-red-800 bg-red-100 border border-red-200 rounded-lg">{error}</div>}
            {successMessage && <div
                className="p-3 text-sm text-green-800 bg-green-100 border border-green-200 rounded-lg">{successMessage}</div>}
            {resendMessage && <div
                className="p-3 text-sm text-green-800 bg-green-100 border border-green-200 rounded-lg">{resendMessage}</div>}

            <p className="text-sm text-gray-600">Một mã xác thực đã được gửi đến <strong>{email}</strong>. Vui lòng nhập
                mã và mật khẩu mới của bạn.</p>
            <div>
                <label htmlFor="code" className="text-sm block mb-1" style={{color: '#3F2E23'}}>Mã xác thực</label>
                <input type="text" id="code" required value={code} onChange={(e) => setCode(e.target.value)}
                       placeholder="Nhập mã 6 chữ số"
                       className="w-full px-4 py-3 rounded-lg border text-center tracking-[0.5em]"
                       style={{borderColor: '#E8D5B5', backgroundColor: '#FFF8F0', color: '#3F2E23'}}/>
            </div>
            <div>
                <label htmlFor="newPassword" className="text-sm block mb-1" style={{color: '#3F2E23'}}>Mật khẩu
                    mới</label>
                <input type="password" id="newPassword" required value={newPassword}
                       onChange={(e) => setNewPassword(e.target.value)} placeholder="Nhập mật khẩu mới"
                       className="w-full px-4 py-3 rounded-lg border"
                       style={{borderColor: '#E8D5B5', backgroundColor: '#FFF8F0', color: '#3F2E23'}}/>
            </div>
            <div>
                <label htmlFor="confirmPassword" className="text-sm block mb-1" style={{color: '#3F2E23'}}>Xác nhận mật
                    khẩu mới</label>
                <input type="password" id="confirmPassword" required value={confirmPassword}
                       onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Nhập lại mật khẩu mới"
                       className="w-full px-4 py-3 rounded-lg border"
                       style={{borderColor: '#E8D5B5', backgroundColor: '#FFF8F0', color: '#3F2E23'}}/>
            </div>
            <div className="pt-2">
                <button type="submit" disabled={isLoading || successMessage}
                        className="w-full py-3 rounded-lg font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
                        style={{backgroundColor: '#D96C39', color: '#FFF8F0'}}>
                    {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                </button>
            </div>

            {/*<div className="pt-2 text-center text-sm">*/}
            {/*    <span style={{color: '#6B4F3E'}}>Chưa nhận được mã? </span>*/}
            {/*    <button*/}
            {/*        type="button"*/}
            {/*        onClick={handleResendClick}*/}
            {/*        className="font-semibold hover:underline disabled:cursor-not-allowed disabled:opacity-60"*/}
            {/*        style={{color: '#D96C39'}}*/}
            {/*    >*/}
            {/*        Gửi lại*/}
            {/*    </button>*/}
            {/*</div>*/}
        </form>
    );
}