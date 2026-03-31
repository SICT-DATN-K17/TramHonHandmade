import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios"; // Import trực tiếp axios, không dùng instance chung

// Ưu tiên đường dẫn nội bộ khi chạy trong Docker
const INTERNAL_API_URL = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://127.0.0.1:8000/api";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID || "",
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials.password) {
                    return null;
                }

                try {
                    const res = await axios.post(`${INTERNAL_API_URL}/auth/jwt/create`, credentials, {
                        headers: { "Content-Type": "application/json" }
                    });

                    const data = res.data;

                    // Trả về object user
                    return {
                        id: data.id.toString(),
                        name: data.name,
                        email: data.email,
                        role: data.role,
                        apiAccessToken: data.token,
                    };
                } catch (error: any) {
                    console.error("Login error:", error?.response?.data || error.message);

                    if (axios.isAxiosError(error)) {
                        throw new Error(error.response?.data?.message || "Đăng nhập thất bại");
                    }
                    throw new Error("Đã xảy ra lỗi không xác định");
                }
            },
        }),
    ],
    // ... (Giữ nguyên phần callbacks, jwt, session bên dưới)
    callbacks: {
        async signIn({ user, account }) {
            if (!user.email) return false;
            if (account?.provider === "credentials") return true;

            return true;
        },
        async jwt({ token, user, account }) {
            if (user && account) {
                token.role = (user as any).role;
                if (account.provider === "credentials") {
                    token.apiAccessToken = (user as any).apiAccessToken;
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role;
                (session.user as any).apiAccessToken = token.apiAccessToken;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/login",
    },
};