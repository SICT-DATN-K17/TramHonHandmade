"use client";

import { axiosAuth } from "@/lib/axios";
import { useSession, signOut, getSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const useAxiosAuth = () => {
    const { data: session } = useSession();
    const router = useRouter();

    useEffect(() => {
        const requestIntercept = axiosAuth.interceptors.request.use(
            async (config) => {
                if (!config.headers["Authorization"]) {

                    // Ưu tiên 1: Lấy từ session hook (nhanh nhất nếu đã có)
                    if (session?.user?.apiAccessToken) {
                        config.headers["Authorization"] = `Bearer ${session.user.apiAccessToken}`;
                    }
                    // Ưu tiên 2: Xử lý F5 Refresh - Nếu hook chưa load kịp, gọi getSession()
                    else {
                        const newSession = await getSession();
                        if (newSession?.user?.apiAccessToken) {
                            config.headers["Authorization"] = `Bearer ${newSession.user.apiAccessToken}`;
                        }
                    }
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        const responseIntercept = axiosAuth.interceptors.response.use(
            (response) => response,
            async (error) => {
                const status = error.response?.status;
                const isLoginPage = window.location.pathname === "/login";

                // Xử lý lỗi 401: Hết hạn phiên đăng nhập -> Logout
                if (status === 401 && !isLoginPage) {
                    console.log("Phiên đăng nhập hết hạn. Đang đăng xuất...");
                    await signOut({
                        callbackUrl: "/login",
                        redirect: true,
                    });
                    return Promise.reject(error);
                }

                // 3. Xử lý lỗi 403: Không có quyền truy cập
                if (status === 403) {
                    toast.error("Bạn không có quyền thực hiện hành động này!", { duration: 3000 });
                    // Bỏ cái setTimeout và router.push('/login') đi.
                    // Trả về lỗi để UI xử lý tiếp.
                }

                return Promise.reject(error);
            }
        );

        return () => {
            axiosAuth.interceptors.request.eject(requestIntercept);
            axiosAuth.interceptors.response.eject(responseIntercept);
        };
    }, [session, router]);

    return axiosAuth;
};

export default useAxiosAuth;