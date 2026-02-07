const ACCESS_TOKEN_KEY = "unilife_access_token";
const USER_KEY = "unilife_user";

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || "";
}

export function setAccessToken(token) {
  if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  // Also clear legacy keys to avoid accidentally using stale tokens
  localStorage.removeItem("token");
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY) || localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

export function clearStoredUser() {
  localStorage.removeItem(USER_KEY);
}
