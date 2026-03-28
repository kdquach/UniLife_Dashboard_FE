import { useCallback, useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import { useNavigate } from "react-router-dom";
import { notification } from "antd";
import NotificationDropdown from "@/components/NotificationDropdown";
import { useAuthStore } from "@/store/useAuthStore";
import { getNotificationSocket } from "@/services/notification.socket";
import {
  getNotificationById,
  getNotificationFeed,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/services/notification.service";

dayjs.extend(relativeTime);
dayjs.locale("vi");

function normalizeUserNotification(item) {
  return {
    id: item._id,
    type: item.type,
    title: item.title,
    content: item.content,
    time: dayjs(item.createdAt).fromNow(),
    createdAt: item.createdAt,
    isRead: item.isRead,
    metadata: item.metadata || null,
  };
}

export default function NotificationCenter() {
  const DASHBOARD_NOTIFICATION_TYPES = [
    { value: "", label: "Tất cả loại" },
    { value: "order", label: "Đơn hàng" },
    { value: "promotion", label: "Khuyến mãi" },
    { value: "system", label: "Hệ thống" },
    { value: "feedback", label: "Phản hồi" },
    { value: "shift", label: "Ca làm" },
    { value: "salary", label: "Lương" },
  ];

  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [api, contextHolder] = notification.useNotification();
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [loadingAll, setLoadingAll] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const isFirstLoadRef = useRef(true);
  const knownNotificationIdsRef = useRef(new Set());

  const buildFilterParams = useCallback(() => {
    const params = { limit: 200 };
    if (selectedType) {
      params.type = selectedType;
    }
    if (selectedStatus === "read") {
      params.isRead = true;
    }
    if (selectedStatus === "unread") {
      params.isRead = false;
    }
    return params;
  }, [selectedType, selectedStatus]);

  const loadInitial = useCallback(async () => {
    try {
      const [result, unread] = await Promise.all([
        getNotificationFeed(buildFilterParams()),
        getUnreadNotificationCount(),
      ]);

      const merged = (result?.data || []).map(normalizeUserNotification);

      const currentKnownIds = knownNotificationIdsRef.current;
      const newIncoming = merged.filter(
        (item) =>
          !item.isRead &&
          !currentKnownIds.has(String(item.id)),
      );

      if (!isFirstLoadRef.current && newIncoming.length > 0) {
        newIncoming.slice(0, 3).forEach((item) => {
          api.info({
            key: `notif-${item.id}`,
            title: item.title || "Thông báo mới",
            description: item.content || "Bạn có một thông báo mới",
            placement: "bottomRight",
            duration: 4.5,
          });
        });
      }

      knownNotificationIdsRef.current = new Set(
        merged.map((item) => String(item.id)),
      );
      isFirstLoadRef.current = false;

      setItems(merged);
      setUnreadCount(unread);
    } catch {
      setItems([]);
      setUnreadCount(0);
    }
  }, [api, buildFilterParams]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (!user || !token) return;

    const socket = getNotificationSocket();
    socket.auth = { token };
    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = async () => {
      if (user.canteenId) {
        socket.emit("join:canteen", user.canteenId);
      }

      try {
        const unread = await getUnreadNotificationCount();
        setUnreadCount(unread);
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    };

    const handleNotificationNew = (event) => {
      if (!event?.title) return;
      if (event.type === "order") return;

      const createdAt = event.createdAt ? dayjs(event.createdAt) : dayjs();
      const nextItem = {
        id: event.id || `ws-${Date.now()}`,
        type: event.type || "system",
        title: event.title,
        content: event.content || "",
        time: createdAt.fromNow(),
        createdAt: createdAt.toISOString(),
        isRead: Boolean(event.isRead),
        metadata: event.meta || null,
      };

      const typeMatch = !selectedType || nextItem.type === selectedType;
      const statusMatch =
        selectedStatus === "all" ||
        (selectedStatus === "read" ? nextItem.isRead : !nextItem.isRead);

      if (!nextItem.isRead) {
        setUnreadCount((prev) => prev + 1);
      }

      if (!typeMatch || !statusMatch) {
        return;
      }

      setItems((prev) => {
        if (prev.some((item) => String(item.id) === String(nextItem.id))) {
          return prev;
        }
        return [nextItem, ...prev].slice(0, 200);
      });

      knownNotificationIdsRef.current.add(String(nextItem.id));

      api.info({
        key: `notif-${nextItem.id}`,
        title: nextItem.title || "Thông báo mới",
        description: nextItem.content || "Bạn có một thông báo mới",
        placement: "bottomRight",
        duration: 4.5,
      });
    };

    socket.on("connect", handleConnect);
    socket.on("notification:new", handleNotificationNew);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("notification:new", handleNotificationNew);
      if (user.canteenId) {
        socket.emit("leave:canteen", user.canteenId);
      }
    };
  }, [api, selectedStatus, selectedType, token, user]);

  const handleMarkRead = async (item) => {
    if (item.isRead) return;
    await markNotificationAsRead(item.id);
    await loadInitial();
  };
  const handleReadAll = async () => {
    await markAllNotificationsAsRead();
    await loadInitial();
  };

  const shouldFetchNotificationDetails = (notificationItem) => {
    if (!notificationItem?.id) return false;
    if (notificationItem?.metadata) return false;
    return !String(notificationItem.id).startsWith("sys-");
  };

  const resolveNotificationMetadata = async (notificationItem) => {
    if (!shouldFetchNotificationDetails(notificationItem)) {
      return notificationItem?.metadata || null;
    }

    const full = await getNotificationById(notificationItem.id);
    if (!full?.metadata) {
      return notificationItem?.metadata || null;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === notificationItem.id
          ? {
            ...item,
            metadata: full.metadata,
          }
          : item,
      ),
    );

    return full.metadata;
  };

  const closeAndNavigate = (to, options = undefined) => {
    setOpen(false);
    navigate(to, options);
  };

  const handleOpenNotification = async (notification) => {
    if (!notification) return;
    try {
      if (!notification.isRead) {
        await handleMarkRead(notification);
      }

      const resolvedMetadata = await resolveNotificationMetadata(notification);

      setExpandedId((prev) => (prev === notification.id ? null : notification.id));

      const refreshToken = Date.now();
      const kind = resolvedMetadata?.kind;

      if (kind === "schedule_published") {
        closeAndNavigate(`/staff/schedule?refresh=${refreshToken}`);
        return;
      }

      if (kind === "shift_change_request") {
        closeAndNavigate(`/manager/shift-requests?refresh=${refreshToken}`);
        return;
      }

      if (kind === "shift_change_reviewed") {
        closeAndNavigate(`/staff/schedule?refresh=${refreshToken}`);
        return;
      }

      if (notification.type === "order" && resolvedMetadata?.orderId) {
        closeAndNavigate("/orders", { state: { orderId: resolvedMetadata.orderId } });
        return;
      }

      if (notification.type === "order") {
        closeAndNavigate("/orders");
        return;
      }

      if (notification.type === "shift") {
        closeAndNavigate("/staff-shifts");
        return;
      }

      closeAndNavigate(`/notifications/${notification.id}`);
    } catch (error) {
      console.error("Failed to open notification", error);
    }
  };

  const handleViewAll = async () => {
    if (loadingAll) return;
    try {
      setLoadingAll(true);
      const result = await getNotificationFeed(buildFilterParams());
      const merged = (result?.data || []).map(normalizeUserNotification);

      setItems(merged);
    } finally {
      setLoadingAll(false);
    }
  };

  const handleFilterChange = ({ type, status }) => {
    if (type !== undefined) {
      setSelectedType(type);
    }
    if (status !== undefined) {
      setSelectedStatus(status);
    }
  };

  return (
    <>
      {contextHolder}
      <NotificationDropdown
        notifications={items}
        badge={unreadCount}
        onItemClick={handleOpenNotification}
        onMarkAllRead={handleReadAll}
        onLoadMore={undefined}
        hasMore={false}
        loadingMore={false}
        onViewAll={handleViewAll}
        open={open}
        onOpenChange={setOpen}
        expandedId={expandedId}
        loadingAll={loadingAll}
        selectedType={selectedType}
        selectedStatus={selectedStatus}
        onFilterChange={handleFilterChange}
        typeOptions={DASHBOARD_NOTIFICATION_TYPES}
      />
    </>
  );
}
