import axios from "axios";
import { getAccessToken } from "@/utils/storage";

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
  return config;
});
