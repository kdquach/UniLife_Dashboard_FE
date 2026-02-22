import { api } from "@/services/axios.config";

/**
 * GET /orders
 * Lấy danh sách đơn hàng với filters, pagination, sort.
 */
export async function getOrders(params = {}) {
  const res = await api.get("/orders", { params });
  return res.data;
}

/**
 * GET /orders/:id
 * Chi tiết 1 đơn hàng.
 */
export async function getOrderDetail(id) {
  const res = await api.get(`/orders/${id}`);
  return res.data;
}

/**
 * PATCH /orders/:id/status
 * Cập nhật trạng thái đơn hàng.
 */
export async function updateOrderStatus(id, status) {
  const res = await api.patch(`/orders/${id}/status`, { status });
  return res.data;
}

/**
 * POST /orders/scan-complete
 * Quét QR & hoàn thành đơn hàng (API chính).
 */
export async function scanCompleteOrder(qrToken) {
  const res = await api.post("/orders/scan-complete", { qrToken });
  return res.data;
}

/**
 * POST /orders/manual-complete
 * Nhập mã đơn thủ công & hoàn thành (fallback).
 */
export async function manualCompleteOrder(orderNumber) {
  const res = await api.post("/orders/manual-complete", { orderNumber });
  return res.data;
}

/**
 * GET /orders/qr/:code
 * Tra cứu đơn qua QR (preview, chưa hoàn thành).
 */
export async function getOrderByQR(code) {
  const res = await api.get(`/orders/qr/${encodeURIComponent(code)}`);
  return res.data;
}
