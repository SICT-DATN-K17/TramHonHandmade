'use client';

import React, {useState} from 'react';
import {axiosClient} from "@/lib/axios";

interface ForgotPasswordFormProps {
    onSuccess: (email: string) => void;
}

export default function ForgotPasswordForm({onSuccess}: ForgotPasswordFormProps) {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        try {

            const response = await axiosClient.post('/auth/forgot-password/', {email});

            console.log(response);
            setMessage(response.data.message || 'Đã gửi mã xác nhận');
            // Chờ một chút để người dùng đọc thông báo rồi mới chuyển trang
            setTimeout(() => {
                onSuccess(email);
            }, 1500);

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Lỗi không xác định');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error &&
                <div className="p-3 text-sm text-red-800 bg-red-100 border border-red-200 rounded-lg">{error}</div>}
            {message && <div
                className="p-3 text-sm text-green-800 bg-green-100 border border-green-200 rounded-lg">{message}</div>}
            <div>
                <label htmlFor="email" className="text-sm block mb-1" style={{color: '#3F2E23'}}>Email đã đăng
                    ký</label>
                <input type="email" id="email" name="email" required value={email}
                       onChange={(e) => setEmail(e.target.value)} placeholder="Nhập email của bạn"
                       className="w-full px-4 py-3 rounded-lg border"
                       style={{borderColor: '#E8D5B5', backgroundColor: '#FFF8F0', color: '#3F2E23'}}/>
            </div>
            <div className="pt-2">
                <button type="submit" disabled={isLoading || !!message}
                        className="w-full py-3 rounded-lg font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
                        style={{backgroundColor: '#D96C39', color: '#FFF8F0'}}>
                    {isLoading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
                </button>
            </div>
        </form>
    );
}