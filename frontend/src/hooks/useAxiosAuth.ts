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
                    toast.error("Bạn không có quyền truy cập! Đang chuyển hướng...", {
                        duration: 2000, // Toast hiển thị trong 2 giây
                    });

                    // Đợi 1.5 giây (1500ms) để người dùng kịp đọc rồi mới chuyển trang


                    // Cách 1: Chuyển hướng đến trang thông báo lỗi riêng (Tạo file app/403/page.tsx)
                    // router.push("/403");

                    // Cách 2: Chuyển hướng về trang chủ
                    // router.push("/");

                    // Cách 3 (Phổ biến nhất): Không chuyển trang, chỉ trả về lỗi để Component hiển thị Toast/Notification
                    // Bạn có thể giữ nguyên Promise.reject để UI tự xử lý hiển thị thông báo.

                    // Nếu bạn muốn bắt buộc chuyển trang khi gặp 403, bỏ comment dòng dưới:
                    setTimeout(() => {
                        router.push("/login");
                    }, 1500);
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