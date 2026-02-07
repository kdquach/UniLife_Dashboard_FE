import { api } from "@/services/axios.config";
import { setAccessToken, clearAccessToken } from "@/utils/storage";

const USER_KEY = "unilife_user";

/**
 * Login user
 * @param {Object} payload - { email, password }
 * @returns {Promise<Object>} - { token, user }
 */
export async function login(payload) {
  const { email, password } = payload;

  // Ensure stale tokens on this origin don't interfere with login.
  clearAccessToken();
  localStorage.removeItem("user");
  localStorage.removeItem(USER_KEY);

  const response = await api.post("/auth/login", { email, password });

  const { token, data } = response.data;

  // Lưu token vào localStorage
  if (token) {
    setAccessToken(token);
  }

  // Lưu thông tin user vào localStorage
  if (data?.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  return {
    token,
    user: data?.user,
  };
}

/**
 * Logout user
 * @returns {Promise<void>}
 */
export async function logout() {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    // Ignore error, still clear local data
    console.error("Logout API error:", error);
  } finally {
    clearAccessToken();
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
}

/**
 * Get current user from localStorage
 * @returns {Object|null}
 */
export function getCurrentUser() {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export function isAuthenticated() {
  return !!localStorage.getItem("unilife_access_token");
}

/**
 * Doi mat khau nguoi dung
 * @param {Object} payload - { currentPassword, newPassword, confirmPassword }
 * @returns {Promise<Object>} - { message }
 */
export async function changePassword(payload) {
  const { currentPassword, newPassword, confirmPassword } = payload;

  const response = await api.post("/auth/change-password", {
    currentPassword,
    newPassword,
    confirmPassword,
  });

  return {
    message: response.data.message,
  };
}

