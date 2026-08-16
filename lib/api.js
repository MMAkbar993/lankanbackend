import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const getCookie = (name) => {
    if (typeof document === "undefined") return null;

    const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${name}=`));

    return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
};

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use(
    (config) => {
        const token = getCookie("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export default api;