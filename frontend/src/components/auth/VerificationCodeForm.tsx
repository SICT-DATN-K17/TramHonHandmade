'use client';

import React, { useState } from 'react';
import {axiosClient} from "@/lib/axios";
import {isAxiosError} from "axios";

interface VerificationCodeFormProps {
  email: string;
  onVerifySuccess: () => void;
  onBack: () => void;
}

export default function VerificationCodeForm({ email, onVerifySuccess, onBack }: VerificationCodeFormProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      // --- Call API Verify ---
      const response = await axiosClient.post('/auth/verify-account/', {
        email: email,
        code: code,
      });

      console.log(">>> Verify response:", response);
      
      setSuccessMessage('Xác thực thành công! Đang chuyển hướng đến trang đăng nhập...');
      setTimeout(() => {
        onVerifySuccess();
      }, 2000);

    } catch (err) {
        if (isAxiosError(err) && err.response) {
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="p-3 text-sm text-red-800 bg-red-100 border border-red-200 rounded-lg">{error}</div>}
      {successMessage && <div className="p-3 text-sm text-green-800 bg-green-100 border border-green-200 rounded-lg">{successMessage}</div>}
      
      <p className="text-sm text-gray-600">Một mã xác thực đã được gửi đến <strong>{email}</strong>. Vui lòng nhập mã để hoàn tất đăng ký.</p>
      <div>
        <label htmlFor="code" className="text-sm block mb-1" style={{ color: '#3F2E23' }}>Mã xác thực</label>
        <input type="text" id="code" name="code" required value={code} onChange={(e) => setCode(e.target.value)} placeholder="Nhập mã 6 chữ số" className="w-full px-4 py-3 rounded-lg border text-center tracking-[0.5em]" style={{ borderColor: '#E8D5B5', backgroundColor: '#FFF8F0', color: '#3F2E23' }} />
      </div>
      <div className="pt-2">
        <button type="submit" disabled={isLoading || !!successMessage} className="w-full py-3 rounded-lg font-semibold disabled:opacity-70 disabled:cursor-not-allowed" style={{ backgroundColor: '#D96C39', color: '#FFF8F0' }}>
          {isLoading ? 'Đang xác thực...' : 'Xác thực và Tạo tài khoản'}
        </button>
      </div>
      <div className="text-center">
        <button type="button" onClick={onBack} className="text-sm font-medium hover:underline" style={{ color: '#6B4F3E' }}>
          &larr; Quay lại
        </button>
      </div>
    </form>
  );
}