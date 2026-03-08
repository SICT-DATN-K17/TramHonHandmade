'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, Suspense } from 'react';
import AuthLayout from '@/components/auth/AuthLayout';
import LoginForm from '@/components/auth/LoginForm';
import SignupForm from '@/components/auth/SignupForm';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import VerificationCodeForm from '@/components/auth/VerificationCodeForm';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

// 1. Component Loading (Fallback) để hiển thị khi Suspense đang chờ
function AuthLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f172a]"></div>
        </div>
    );
}

// 2. Tách toàn bộ logic chính vào một Component con (AuthContent)
function AuthContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const mode = searchParams.get('mode') || 'login';
    const email = searchParams.get('email') || '';
    const [notification, setNotification] = useState<string | null>(null);

    useEffect(() => {
        const verified = searchParams.get('verified');
        const reset = searchParams.get('reset');
        let message: string | null = null;

        if (verified === 'true') {
            message = 'Tài khoản của bạn đã được xác thực thành công! Vui lòng đăng nhập.';
        } else if (reset === 'true') {
            message = 'Mật khẩu của bạn đã được đặt lại thành công! Vui lòng đăng nhập.';
        }

        if (message) {
            setNotification(message);
            const timer = setTimeout(() => {
                // Dùng router.replace thay vì push để tránh back lại URL cũ có param
                router.replace('/auth?mode=login', { scroll: false });
            }, 4000);

            return () => clearTimeout(timer);
        } else {
            setNotification(null);
        }
    }, [searchParams, router]);

    const formVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 },
    };

    let title, subtitle, formComponent, bottomNote, bottomLinkText, onBottomLinkClick, imageOnLeft;

    const shouldShowNotification = (mode === 'login' && notification);

    switch (mode) {
        case 'signup':
            title = 'Tạo tài khoản';
            subtitle = 'Cùng tạo và khám phá các sản phẩm thủ công độc đáo';
            imageOnLeft = false;
            formComponent = <SignupForm onRegisterSuccess={(email) => router.push(`/auth?mode=verify&email=${email}`)} />;
            bottomNote = 'Đã có tài khoản?';
            bottomLinkText = 'Đăng nhập ngay';
            onBottomLinkClick = () => router.push('/auth?mode=login');
            break;

        case 'forgot-password':
            title = 'Quên mật khẩu';
            subtitle = 'Chúng tôi sẽ gửi hướng dẫn đến email của bạn';
            imageOnLeft = true;
            formComponent = <ForgotPasswordForm onSuccess={(email) => router.push(`/auth?mode=reset-password&email=${email}`)} />;
            bottomNote = 'Nhớ mật khẩu?';
            bottomLinkText = 'Quay lại đăng nhập';
            onBottomLinkClick = () => router.push('/auth?mode=login');
            break;

        case 'verify':
            title = 'Xác thực tài khoản';
            subtitle = `Mã xác thực đã được gửi đến ${email}`;
            imageOnLeft = false;
            formComponent = (
                <VerificationCodeForm
                    email={email}
                    onVerifySuccess={() => router.push('/auth?mode=login&verified=true')}
                    onBack={() => router.push('/auth?mode=signup')}
                />
            );
            bottomNote = 'Nhập sai email?';
            bottomLinkText = 'Quay lại';
            onBottomLinkClick = () => router.push('/auth?mode=signup');
            break;

        case 'reset-password':
            title = 'Đặt lại mật khẩu';
            subtitle = 'Tạo mật khẩu mới cho tài khoản của bạn';
            imageOnLeft = true;
            formComponent = (
                <ResetPasswordForm
                    email={email}
                    onSuccess={() => router.push('/auth?mode=login&reset=true')}
                    onResendCode={() => router.push(`/auth?mode=forgot-password&email=${email}`)}
                />
            );
            break;

        case 'login':
        default:
            title = 'Chào mừng trở lại!';
            subtitle = 'Đăng nhập để tiếp tục';
            imageOnLeft = true;
            formComponent = <LoginForm onForgotPasswordClick={() => router.push('/auth?mode=forgot-password')} />;
            bottomNote = 'Chưa có tài khoản?';
            bottomLinkText = 'Đăng ký miễn phí';
            onBottomLinkClick = () => router.push('/auth?mode=signup');
            break;
    }

    return (
        <AuthLayout
            title={title}
            subtitle={subtitle}
            imageOnLeft={imageOnLeft}
            bottomNote={bottomNote}
            bottomLinkText={bottomLinkText}
            onBottomLinkClick={onBottomLinkClick}
        >
            <AnimatePresence>
                {shouldShowNotification && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="bg-green-100 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg relative mb-4 shadow-sm"
                        role="alert"
                    >
                        <p className="font-bold">Thành công!</p>
                        <p>{notification}</p>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence mode="wait">
                <motion.div
                    key={mode}
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                    {formComponent}
                </motion.div>
            </AnimatePresence>
        </AuthLayout>
    );
}

// 3. Default Export bọc component chính trong Suspense
export default function AuthPage() {
    return (
        <Suspense fallback={<AuthLoading />}>
            <AuthContent />
        </Suspense>
    );
}