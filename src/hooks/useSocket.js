import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { getNotificationSocket } from "@/services/notification.socket";

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

    const socket = getNotificationSocket();
    socket.auth = { token };
    if (!socket.connected) {
      socket.connect();
    }
    socketRef.current = socket;

    const handleConnect = () => {
      setIsConnected(true);
      if (user.canteenId) {
        socket.emit("join:canteen", user.canteenId);
      }
    };

    const handleDisconnect = () => setIsConnected(false);

    const handleNotificationNew = (event) => {
      if (!event || event.type !== "order" || !callbackRef.current) {
        return;
      }

      callbackRef.current({
        _id: event.meta?.orderId || event.id,
        status: event.meta?.status,
        previousStatus: event.meta?.previousStatus,
        orderNumber: event.meta?.orderNumber,
      });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("notification:new", handleNotificationNew);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("notification:new", handleNotificationNew);
      if (user.canteenId) {
        socket.emit("leave:canteen", user.canteenId);
      }
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [user, token]);

  return { isConnected };
}
