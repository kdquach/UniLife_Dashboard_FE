import { useCallback, useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import { useNavigate } from "react-router-dom";
import { notification } from "antd";
import NotificationDropdown from "@/components/NotificationDropdown";
import {
  getActiveSystemNotifications,
  getNotificationById,
  getMyNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/services/notification.service";

dayjs.extend(relativeTime);
dayjs.locale("vi");

function normalizeSystemNotification(item) {
  return {
    id: `sys-${item._id}`,
    type: "system",
    title: item.title,
    content: item.content,
    time: dayjs(item.createdAt).fromNow(),
    createdAt: item.createdAt,
    isRead: true,
    metadata: item.metadata || null,
  };
}

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
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();
  const [open, setOpen] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const isFirstLoadRef = useRef(true);
  const knownNotificationIdsRef = useRef(new Set());
  const limit = 10;

  const loadInitial = useCallback(async () => {
    try {
      const [result, systemNotifications, unread] = await Promise.all([
        getMyNotifications({ limit: 20 }),
        getActiveSystemNotifications(),
        getUnreadNotificationCount(),
      ]);

      const myNotifications = (result?.data || []).map(normalizeUserNotification);

      const merged = [
        ...myNotifications,
        ...systemNotifications.map(normalizeSystemNotification),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const currentKnownIds = knownNotificationIdsRef.current;
      const newIncoming = merged.filter(
        (item) =>
          !String(item.id).startsWith("sys-") &&
          !item.isRead &&
          !currentKnownIds.has(String(item.id)),
      );

      if (!isFirstLoadRef.current && newIncoming.length > 0) {
        newIncoming.slice(0, 3).forEach((item) => {
          api.info({
            key: `notif-${item.id}`,
            message: item.title || "Thông báo mới",
            description: item.content || "Bạn có một thông báo mới",
            placement: "bottomRight",
            duration: 4.5,
          });
        });
      }

      knownNotificationIdsRef.current = new Set(
        merged
          .filter((item) => !String(item.id).startsWith("sys-"))
          .map((item) => String(item.id)),
      );
      isFirstLoadRef.current = false;

      setItems(merged);
      setUnreadCount(unread);
      setNextCursor(result?.pagination?.nextCursor || null);
      setHasNextPage(Boolean(result?.pagination?.hasNextPage));
    } catch {
      setItems([]);
      setUnreadCount(0);
      setNextCursor(null);
      setHasNextPage(false);
    }
  }, [api]);

  useEffect(() => {
    loadInitial();

    const timer = setInterval(() => {
      loadInitial();
    }, 8000);

    return () => clearInterval(timer);
  }, [loadInitial]);

  const handleMarkRead = async (item) => {
    if (String(item.id).startsWith("sys-") || item.isRead) return;
    await markNotificationAsRead(item.id);
    await loadInitial();
  };
  const handleReadAll = async () => {
    await markAllNotificationsAsRead();
    await loadInitial();
  };

  const handleOpenNotification = async (notification) => {
    if (!notification) return;

    if (!notification.isRead) {
      await handleMarkRead(notification);
    }

    let resolvedMetadata = notification.metadata || null;

    if (!resolvedMetadata && !String(notification.id).startsWith("sys-")) {
      const full = await getNotificationById(notification.id);
      if (full?.metadata) {
        resolvedMetadata = full.metadata;
        setItems((prev) =>
          prev.map((item) =>
            item.id === notification.id
              ? {
                ...item,
                metadata: full.metadata,
              }
              : item,
          ),
        );
      }
    }

    setExpandedId((prev) => (prev === notification.id ? null : notification.id));

    const refreshToken = Date.now();
    const kind = resolvedMetadata?.kind;

    if (kind === "schedule_published") {
      setOpen(false);
      navigate(`/staff/schedule?refresh=${refreshToken}`);
      return;
    }

    if (kind === "shift_change_request") {
      setOpen(false);
      navigate(`/manager/shift-requests?refresh=${refreshToken}`);
      return;
    }

    if (notification.type === "order" && resolvedMetadata?.orderId) {
      setOpen(false);
      navigate("/orders", { state: { orderId: resolvedMetadata.orderId } });
      return;
    }

    if (notification.type === "order") {
      setOpen(false);
      navigate("/orders");
      return;
    }

    if (notification.type === "shift") {
      setOpen(false);
      navigate("/staff-shifts");
      return;
    }

    if (["system", "promotion"].includes(notification.type)) {
      setOpen(false);
      navigate(`/notifications/${notification.id}`);
      return;
    }

    setOpen(false);
    navigate(`/notifications/${notification.id}`);
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasNextPage || !nextCursor) return;

    try {
      setLoadingMore(true);
      const result = await getMyNotifications({ limit, cursor: nextCursor });
      const mapped = (result?.data || []).map(normalizeUserNotification);
      setItems((prev) => [...prev, ...mapped]);
      setNextCursor(result?.pagination?.nextCursor || null);
      setHasNextPage(Boolean(result?.pagination?.hasNextPage));
    } finally {
      setLoadingMore(false);
    }
  };

  const handleViewAll = async () => {
    if (loadingAll) return;
    try {
      setLoadingAll(true);
      const [result, systemNotifications] = await Promise.all([
        getMyNotifications({ page: 1, limit: 200 }),
        getActiveSystemNotifications(),
      ]);

      const myNotifications = (result?.data || []).map(normalizeUserNotification);
      const merged = [
        ...myNotifications,
        ...systemNotifications.map(normalizeSystemNotification),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setItems(merged);
      setHasNextPage(false);
      setNextCursor(null);
    } finally {
      setLoadingAll(false);
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
        onLoadMore={handleLoadMore}
        hasMore={hasNextPage}
        loadingMore={loadingMore}
        onViewAll={handleViewAll}
        open={open}
        onOpenChange={setOpen}
        expandedId={expandedId}
        loadingAll={loadingAll}
      />
    </>
  );
}
