'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/auth?mode=login');
  }, [router]);

  return null; // Hoặc hiển thị một màn hình tải trong khi chuyển hướng
}