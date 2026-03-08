'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface LoginFormProps {
  onForgotPasswordClick: () => void;
}

export default function LoginForm({ onForgotPasswordClick }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: email,
        password: password,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        // Chuyển hướng đến trang /auth/callback để xử lý logic role
        router.push('/auth/callback');
      }
    } catch (err: unknown) {
      setError('Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="p-3 text-sm text-red-800 bg-red-100 border border-red-200 rounded-lg">{error}</div>}
      <div>
        <label htmlFor="email" className="text-sm block mb-1" style={{ color: '#3F2E23' }}>Email</label>
        <input
          type="email" id="email" name="email" required
          value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Email của bạn"
          className="w-full px-4 py-3 rounded-lg border"
          style={{ borderColor: '#E8D5B5', backgroundColor: '#FFF8F0', color: '#3F2E23' }}
        />
      </div>
      <div>
        <label htmlFor="password" className="text-sm block mb-1" style={{ color: '#3F2E23' }}>Mật khẩu</label>
        <input
          type="password" id="password" name="password" required
          value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Nhập mật khẩu"
          className="w-full px-4 py-3 rounded-lg border"
          style={{ borderColor: '#E8D5B5', backgroundColor: '#FFF8F0', color: '#3F2E23' }}
        />
      </div>
      
      <div className="flex items-center justify-end">
        <div className="text-sm">
          <button type="button" onClick={onForgotPasswordClick} className="font-medium hover:underline" style={{ color: '#D96C39' }}>
            Quên mật khẩu?
          </button>
        </div>
      </div>

      <div className="pt-2">
        <button type="submit" disabled={isLoading} className="w-full py-3 rounded-lg font-semibold disabled:opacity-70 disabled:cursor-not-allowed" style={{ backgroundColor: '#D96C39', color: '#FFF8F0' }}>
          {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
        </button>
      </div>

      <div className="mt-4 text-center">
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t" style={{ borderColor: '#E8D5B5' }} />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2" style={{ backgroundColor: '#F7F1E8', color: '#6B4F3E' }}>Hoặc tiếp tục với</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/auth/callback' })}
              className="w-full h-full inline-flex justify-center items-center py-2 px-4 border rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 transition-all duration-300 hover:shadow-lg hover:scale-105"
              style={{ borderColor: '#E8D5B5' }}
            >
              <span className="sr-only">Đăng nhập với Google</span>
              <Image src="/icons/google-logo.png" alt="Google" width={20} height={20} />
            </button>
          </div>
          <div>
            <button
              type="button"
              onClick={() => signIn('facebook', { callbackUrl: '/auth/callback' })}
              className="w-full h-full inline-flex justify-center items-center py-2 px-4 border rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 transition-all duration-300 hover:shadow-lg hover:scale-105"
              style={{ borderColor: '#E8D5B5' }}
            >
              <span className="sr-only">Đăng nhập với Facebook</span>
              <Image src="/icons/facebook-logo.png" alt="Facebook" width={20} height={20} />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}