import { io } from "socket.io-client";

let socket = null;

// Ưu tiên cấu hình endpoint websocket riêng.
// Nếu không khai báo thì fallback từ VITE_API_BASE_URL bằng cách bỏ "/api".
// Ví dụ:
// - VITE_SOCKET_URL=http://localhost:5000
// - VITE_API_BASE_URL=http://localhost:5000/api
const resolveSocketBaseUrl = () => {
  const socketUrl = import.meta.env.VITE_SOCKET_URL || "";
  if (socketUrl) {
    return socketUrl;
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL || "";
  if (apiBase) {
    return apiBase.replace(/\/api\/?$/, "");
  }

  // Fallback cuối cùng theo origin hiện tại của trang.
  // Chỉ phù hợp khi FE và BE cùng domain hoặc có reverse proxy.
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return "";
};

export const getNotificationSocket = () => {
  if (socket) return socket;

  const baseUrl = resolveSocketBaseUrl();

  socket = io(baseUrl, {
    // Giữ cả websocket và polling để tăng độ ổn định khi môi trường mạng/proxy hạn chế websocket.
    transports: ["websocket", "polling"],
    autoConnect: false,
    // FE hiện gửi JWT qua socket.auth.token; withCredentials phục vụ cookie nếu cần về sau.
    withCredentials: true,
    timeout: 5000,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  return socket;
};
