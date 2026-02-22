import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Custom hook to manage Socket.IO connection for canteen real-time events.
 *
 * @param {Function} onOrderStatusChanged - callback when order status changes
 * @returns {{ isConnected: boolean }}
 */
export function useSocket(onOrderStatusChanged) {
  const { user, token } = useAuthStore();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const callbackRef = useRef(onOrderStatusChanged);

  // Keep callback ref up-to-date without re-triggering effect
  useEffect(() => {
    callbackRef.current = onOrderStatusChanged;
  }, [onOrderStatusChanged]);

  useEffect(() => {
    if (!user || !token) return;

    // Derive socket URL from API base URL (strip "/api" suffix)
    const apiBase =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
    const socketUrl =
      apiBase.replace(/\/api\/?$/, "") || "http://localhost:5000";

    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      // Register into canteen room
      socket.emit("register", {
        userId: user._id,
        canteenId: user.canteenId,
      });
      if (user.canteenId) {
        socket.emit("join:canteen", user.canteenId);
      }
    });

    socket.on("disconnect", () => setIsConnected(false));

    // Listen for canteen notifications
    socket.on("canteen:notification", (data) => {
      if (data.type === "order:statusChanged" && callbackRef.current) {
        callbackRef.current(data.order || data);
      }
    });

    return () => {
      if (user.canteenId) {
        socket.emit("leave:canteen", user.canteenId);
      }
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [user, token]);

  return { isConnected };
}
