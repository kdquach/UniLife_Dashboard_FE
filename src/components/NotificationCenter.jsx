import { useCallback, useEffect, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import NotificationDropdown from "@/components/NotificationDropdown";
import {
  deleteNotification,
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
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const limit = 10;

  const loadInitial = useCallback(async () => {
    try {
      const [result, systemNotifications, unread] = await Promise.all([
        getMyNotifications({ page: 1, limit: 20 }),
        getActiveSystemNotifications(),
        getUnreadNotificationCount(),
      ]);

      const myNotifications = (result?.data || []).map(normalizeUserNotification);

      const merged = [
        ...myNotifications,
        ...systemNotifications.map(normalizeSystemNotification),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setItems(merged);
      setUnreadCount(unread);
      setPage(1);
      setHasNextPage(Boolean(result?.pagination?.hasNextPage));
    } catch {
      setItems([]);
      setUnreadCount(0);
      setPage(1);
      setHasNextPage(false);
    }
  }, []);

  useEffect(() => {
    loadInitial();

    const timer = setInterval(() => {
      loadInitial();
    }, 20000);

    return () => clearInterval(timer);
  }, [loadInitial]);

  const handleMarkRead = async (item) => {
    if (String(item.id).startsWith("sys-") || item.isRead) return;
    await markNotificationAsRead(item.id);
    await loadInitial();
  };

  const handleDelete = async (item) => {
    if (String(item.id).startsWith("sys-")) return;
    await deleteNotification(item.id);
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

    if (notification.type === "order" && !notification.metadata?.orderId) {
      const full = await getNotificationById(notification.id);
      if (full?.metadata) {
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
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasNextPage) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const result = await getMyNotifications({ limit, page: nextPage });
      const mapped = (result?.data || []).map(normalizeUserNotification);
      setItems((prev) => [...prev, ...mapped]);
      setPage(nextPage);
      setHasNextPage(Boolean(result?.pagination?.hasNextPage));
    } finally {
      setLoadingMore(false);
    }
  };

  const handleViewAll = async () => {
    if (loadingAll) return;
    try {
      setLoadingAll(true);
      const result = await getMyNotifications({ limit: 200, page: 1 });
      const mapped = (result?.data || []).map(normalizeUserNotification);
      const systemNotifications = await getActiveSystemNotifications();

      setItems(
        [...mapped, ...systemNotifications.map(normalizeSystemNotification)].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        ),
      );
      setPage(1);
      setHasNextPage(false);
    } finally {
      setLoadingAll(false);
    }
  };

  return (
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
  );
}
