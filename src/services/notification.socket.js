import { io } from "socket.io-client";

let socket = null;

const resolveSocketBaseUrl = () => {
  const apiBase = import.meta.env.VITE_API_BASE_URL || "";
  if (apiBase) {
    return apiBase.replace(/\/api\/?$/, "");
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return "";
};

export const getNotificationSocket = () => {
  if (socket) return socket;

  const baseUrl = resolveSocketBaseUrl();

  socket = io(baseUrl, {
    transports: ["websocket", "polling"],
    autoConnect: false,
    withCredentials: true,
    timeout: 5000,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  return socket;
};
