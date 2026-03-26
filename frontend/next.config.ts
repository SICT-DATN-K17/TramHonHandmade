import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",

    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },

    reactStrictMode: true,

    images: {
        unoptimized: true,
        remotePatterns: [
            // Ảnh upload qua Cloudinary (chat, media Django default_storage)
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                pathname: '/**',
            },
            {
                protocol: 'http',
                hostname: '127.0.0.1',
                port: '8000',
                pathname: '/uploads/**',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '8000',
                pathname: '/uploads/**',
            },
            {
                protocol: 'http',
                hostname: '127.0.0.1',
                port: '8000',
                pathname: '/chat/**',
            },
            {
                protocol: 'https',
                hostname: 'bizweb.dktcdn.net',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'nanghandmade.com',
                pathname: '/**',
            },
            {
                protocol: 'http',
                hostname: 'backend',
                port: '8000',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'encrypted-tbn0.gstatic.com',
                pathname: '/**',
            }
        ],
    },
};
export default nextConfig;