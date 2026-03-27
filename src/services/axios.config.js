import axios from "axios";
import { getAccessToken, getStoredUser } from "@/utils/storage";

const SESSION_EXPIRED_REASON = "session_expired";
const SESSION_EXPIRED_FLAG = "unilife_session_expired";

let isHandlingUnauthorized = false;

const isLoginRequest = (url) => String(url || "").includes("/auth/login");

const redirectToLoginWithReason = () => {
  if (typeof window === "undefined") return;

  const searchParams = new URLSearchParams(window.location.search);
  const currentReason = searchParams.get("reason");

  if (
    window.location.pathname === "/login" &&
    currentReason === SESSION_EXPIRED_REASON
  ) {
    return;
  }

  const target = `/login?reason=${SESSION_EXPIRED_REASON}`;
  window.location.replace(target);
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const url = String(config.url || "");
  // Never attach Authorization to login requests; a stale token can cause 401.
  if (isLoginRequest(url)) return config;

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
    const status = error?.response?.status;
    const requestUrl = error?.config?.url;

    if (
      status === 401 &&
      typeof window !== "undefined" &&
      !isLoginRequest(requestUrl) &&
      !isHandlingUnauthorized
    ) {
      isHandlingUnauthorized = true;
      sessionStorage.setItem(SESSION_EXPIRED_FLAG, "1");

      import("@/store/useAuthStore")
        .then(({ useAuthStore }) => {
          useAuthStore.getState().clearAuth();
        })
        .catch(() => {
          localStorage.removeItem("unilife_access_token");
          localStorage.removeItem("unilife_user");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        })
        .finally(() => {
          redirectToLoginWithReason();
        });
    }

    return Promise.reject(error);
  }
);
