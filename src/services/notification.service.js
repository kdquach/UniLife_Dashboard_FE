import { api } from "@/services/axios.config";

export async function getNotifications(params = {}) {
  const response = await api.get("/notifications", { params });
  return {
    items: Array.isArray(response.data?.data) ? response.data.data : [],
    pagination: response.data?.pagination || null,
  };
}

export async function getMyNotifications(params = {}) {
  const response = await api.get("/notifications/feed", { params });
  return {
    data: Array.isArray(response.data?.data) ? response.data.data : [],
    pagination: response.data?.pagination || null,
  };
}

export async function getUnreadCount() {
  const response = await api.get("/notifications/unread-count");
  return Number(response.data?.data?.unreadCount || 0);
}

export async function getUnreadNotificationCount() {
  return getUnreadCount();
}

export async function markNotificationRead(notificationId) {
  if (!notificationId) return null;
  const response = await api.patch(`/notifications/${notificationId}/read`);
  return response.data?.data?.notification || null;
}

export async function markNotificationAsRead(notificationId) {
  return markNotificationRead(notificationId);
}

export async function markAllNotificationsAsRead() {
  const response = await api.patch("/notifications/read-all");
  return response.data?.data || null;
}

export async function deleteNotification(notificationId) {
  if (!notificationId) return null;
  await api.delete(`/notifications/${notificationId}`);
  return true;
}

export async function getNotificationById(notificationId) {
  if (!notificationId) return null;
  const response = await api.get("/notifications", {
    params: { page: 1, limit: 50 },
  });
  const list = Array.isArray(response.data?.data) ? response.data.data : [];
  return list.find((item) => String(item.id || item._id) === String(notificationId)) || null;
}

export async function sendNotification(payload) {
  const response = await api.post("/notifications", payload);
  return response.data?.data?.notification || null;
}

export async function getSystemNotifications(params = {}) {
  const response = await api.get("/notifications/system", { params });
  return {
    items: Array.isArray(response.data?.data) ? response.data.data : [],
    pagination: response.data?.pagination || null,
  };
}

export async function getActiveSystemNotifications(params = {}) {
  const response = await api.get("/notifications/system/active", { params });
  const items = response.data?.data?.notifications;
  return Array.isArray(items) ? items : [];
}

export async function createSystemNotification(payload) {
  const response = await api.post("/notifications/system", payload);
  return response.data?.data?.notification || null;
}
