import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://127.0.0.1:8000/api";

export const getServerAxios = async () => {
    const session = await getServerSession(authOptions);

    return axios.create({
        baseURL: BASE_URL,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user?.apiAccessToken || ""}`,
        },
    });
};