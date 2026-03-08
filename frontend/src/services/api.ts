import { getSession } from 'next-auth/react';

/**
 * Hàm fetch API chung, có khả năng xử lý nhiều phương thức và kiểu dữ liệu trả về.
 * @param endpoint - Đường dẫn API (ví dụ: '/auth/login')
 * @param options - Các tùy chọn cho hàm fetch (method, headers, body, ...)
 * @returns Promise chứa dữ liệu JSON trả về
 */
export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const baseUrl = 'http://127.0.0.1:8000/api';
      
    const url = `${baseUrl}${endpoint}`;

    // Get JWT token from NextAuth session
    const session = await getSession();
    const token = session?.user?.apiAccessToken;

    const defaultHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Add Authorization header if token exists
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers: defaultHeaders,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        
        // For validation errors (400), preserve the error object structure
        // Backend returns Map<String, String> for validation errors
        if (response.status === 400 && typeof errorData === 'object' && errorData !== null && !errorData.message) {
            // This is a validation error object, throw it as JSON string so it can be parsed
            throw new Error(JSON.stringify(errorData));
        }
        
        // For other errors, use the message or status text
        throw new Error(errorData.message || `Lỗi API: ${response.status}`);
    }

    // Nếu response không có body (ví dụ: status 204), trả về null
    return response.status === 204 ? (null as T) : (response.json() as Promise<T>);
}

