import axios from "axios";
import { getAccessToken, getStoredUser } from "@/utils/storage";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const url = String(config.url || "");
  // Never attach Authorization to login requests; a stale token can cause 401.
  if (url.includes("/auth/login")) return config;

  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  const user = getStoredUser();
  const canteenId = user?.canteenId?._id || user?.canteenId || null;
  const campusId = user?.campusId?._id || user?.campusId || null;

  if (canteenId) {
    config.headers = config.headers || {};
    config.headers["x-canteen-id"] = String(canteenId);
  }

  if (campusId) {
    config.headers = config.headers || {};
    config.headers["x-campus-id"] = String(campusId);
  }

  return config;
});

// Response Interceptor: Handle Global 401 Force Logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // TC4: Force logout if BE returns 401 (e.g., token invalid or revoked)
    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      import('@/store/useAuthStore').then(({ useAuthStore }) => {
        useAuthStore.getState().clearAuth();
      }).catch(() => {
        // Fallback clear
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = '/login';
      });
    }
    return Promise.reject(error);
  }
);
