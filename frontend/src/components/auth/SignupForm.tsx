'use client';

import React, {useState} from 'react';
import Image from 'next/image';
import {signIn} from 'next-auth/react';
import { axiosClient } from "@/lib/axios";
import { isAxiosError } from "axios";

interface SignupFormProps {
    onRegisterSuccess: (email: string) => void;
}

export default function SignupForm({onRegisterSuccess}: SignupFormProps) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // --- Client-side Validation ---
        if (!username || !email || !password || !confirmPassword) {
            setError('Vui lòng điền đầy đủ thông tin.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        setIsLoading(true);
        try {
            // --- Call API Register ---
            const response = await axiosClient.post('/auth/register/', {
                name: username,
                email: email,
                password: password,
                confirmPassword: confirmPassword,
            });

            console.log(">>> Register response:", response);

            onRegisterSuccess(email);
        } catch (err) {
            if (isAxiosError(err) && err.response) {
                // err.response.data chính là body JSON bạn return từ Next.js
                console.log(">>> Register error:", err.response.data);
                setError(err.response.data.error || 'Đã có lỗi xảy ra từ máy chủ.');
            } else {
                console.log(">>> Register error:", err);
                const message = err instanceof Error ? err.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.';
                setError(message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            {error &&
                <div className="p-3 text-sm text-red-800 bg-red-100 border border-red-200 rounded-lg">{error}</div>}
            <div>
                <label className="text-sm block mb-1" style={{color: '#3F2E23'}}>Tên hiển thị</label>
                <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    type="text"
                    placeholder="Tên của bạn"
                    className="w-full px-4 py-3 rounded-lg border"
                    style={{borderColor: '#E8D5B5', backgroundColor: '#FFF8F0', color: '#3F2E23'}}
                />
            </div>

            <div>
                <label className="text-sm block mb-1" style={{color: '#3F2E23'}}>Email</label>
                <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="Email của bạn"
                    className="w-full px-4 py-3 rounded-lg border"
                    style={{borderColor: '#E8D5B5', backgroundColor: '#FFF8F0', color: '#3F2E23'}}
                />
            </div>

            <div>
                <label className="text-sm block mb-1" style={{color: '#3F2E23'}}>Mật khẩu</label>
                <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="Tạo mật khẩu"
                    className="w-full px-4 py-3 rounded-lg border"
                    style={{borderColor: '#E8D5B5', backgroundColor: '#FFF8F0', color: '#3F2E23'}}
                />
            </div>

            <div>
                <label className="text-sm block mb-1" style={{color: '#3F2E23'}}>Xác nhận mật khẩu</label>
                <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    className="w-full px-4 py-3 rounded-lg border"
                    style={{borderColor: '#E8D5B5', backgroundColor: '#FFF8F0', color: '#3F2E23'}}
                />
            </div>

            <div className="pt-4">
                <button type="submit" disabled={isLoading}
                        className="w-full py-3 rounded-lg font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
                        style={{backgroundColor: '#D96C39', color: '#FFF8F0'}}>
                    {isLoading ? 'Đang xử lý...' : 'Đăng ký'}
                </button>
            </div>

            <div className="mt-4 text-center">
                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t" style={{borderColor: '#E8D5B5'}}/>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2"
                              style={{backgroundColor: '#F7F1E8', color: '#6B4F3E'}}>Hoặc tiếp tục với</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <button
                            type="button"
                            onClick={() => signIn('google', {callbackUrl: '/'})}
                            className="w-full h-full inline-flex justify-center items-center py-2 px-4 border rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 transition-all duration-300 hover:shadow-lg hover:scale-105"
                            style={{borderColor: '#E8D5B5'}}
                        >
                            <span className="sr-only">Đăng ký với Google</span>
                            <Image src="/icons/google-logo.png" alt="Google" width={20} height={20}/>
                        </button>
                    </div>
                    <div>
                        <button
                            type="button"
                            onClick={() => signIn('facebook', {callbackUrl: '/'})}
                            className="w-full h-full inline-flex justify-center items-center py-2 px-4 border rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 transition-all duration-300 hover:shadow-lg hover:scale-105"
                            style={{borderColor: '#E8D5B5'}}
                        >
                            <span className="sr-only">Đăng ký với Facebook</span>
                            <Image src="/icons/facebook-logo.png" alt="Facebook" width={20} height={20}/>
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}