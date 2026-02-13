import { api } from "@/services/axios.config";

export async function getMyNotifications(params = {}) {
  const response = await api.get("/notifications/my", { params });
  return response.data || {};
}

export async function getActiveSystemNotifications() {
  const response = await api.get("/notifications/system/active");
  return response.data?.data?.notifications || [];
}

export async function getUnreadNotificationCount() {
  const response = await api.get("/notifications/unread-count");
  return response.data?.data?.unreadCount || 0;
}

export async function getNotificationById(notificationId) {
  if (!notificationId) return null;
  const response = await api.get(`/notifications/${notificationId}`);
  return response.data?.data?.notification || null;
}

export async function markNotificationAsRead(notificationId) {
  const response = await api.patch(`/notifications/${notificationId}/read`);
  return response.data?.data?.notification;
}

export async function markAllNotificationsAsRead() {
  await api.patch("/notifications/read-all");
}

export async function deleteNotification(notificationId) {
  await api.delete(`/notifications/${notificationId}`);
}
