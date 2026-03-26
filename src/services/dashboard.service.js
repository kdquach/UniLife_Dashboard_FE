import { api } from "@/services/axios.config";

/**
 * GET /dashboard/order-metrics
 * KPI đơn hàng + timeSeries (line chart 3 datasets).
 */
export async function getOrderMetrics(params = {}) {
  const res = await api.get("/dashboard/order-metrics", { params });
  return res.data;
}

/**
 * GET /dashboard/growth-summary
 * Tăng trưởng đơn hàng, doanh thu, khách hàng + customer breakdown + overlay chart.
 */
export async function getGrowthSummary(params = {}) {
  const res = await api.get("/dashboard/growth-summary", { params });
  return res.data;
}

/**
 * GET /dashboard/revenue
 * Doanh thu chi tiết: summary, timeSeries, byPaymentMethod, byShift, topMenuItems, heatmap.
 */
export async function getRevenue(params = {}) {
  const res = await api.get("/dashboard/revenue", { params });
  return res.data;
}
