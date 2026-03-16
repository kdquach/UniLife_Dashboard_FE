import { api } from "@/services/axios.config";

export async function getNotifications(params = {}) {
  const response = await api.get("/notifications", { params });
  return {
    items: Array.isArray(response.data?.data) ? response.data.data : [],
    pagination: response.data?.pagination || null,
  };
}

export async function getNotificationFeed(params = {}) {
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

export async function getNotificationById(notificationId) {
  if (!notificationId) return null;
  const response = await api.get(`/notifications/${notificationId}`);
  return response.data?.data?.notification || null;
}

export async function sendNotification(payload) {
  const response = await api.post("/notifications", payload);
  return response.data?.data?.notification || null;
}

export async function createSystemNotification(payload) {
  const response = await api.post("/notifications/system", payload);
  return response.data?.data?.notification || null;
}

export async function updateSystemNotification(notificationId, payload) {
  if (!notificationId) return null;
  const response = await api.patch(`/notifications/system/${notificationId}`, payload);
  return response.data?.data?.notification || null;
}

export async function getSystemNotifications(params = {}) {
  const response = await api.get("/notifications/system", { params });
  return {
    items: Array.isArray(response.data?.data) ? response.data.data : [],
    pagination: response.data?.pagination || null,
    message: response.data?.message || "",
  };
}

export async function getSystemNotificationById(notificationId) {
  if (!notificationId) return null;
  const response = await api.get(`/notifications/system/${notificationId}`);
  return response.data?.data?.notification || null;
}

export async function deleteSystemNotification(notificationId) {
  if (!notificationId) return null;
  const response = await api.delete(`/notifications/system/${notificationId}`);
  return response.data || null;
}
