import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000/api";

export const axiosClient = axios.create({
    baseURL: BASE_URL,
    headers: { "Content-Type": "application/json" },
});

// Tạo instance riêng cho Auth để attach interceptors
export const axiosAuth = axios.create({
    baseURL: BASE_URL,
    // headers: { "Content-Type": "application/json" },
});