import { api } from "@/services/axios.config";

/**
 * GET /attendance/my-shifts?date=YYYY-MM-DD
 * Lấy danh sách ca hôm nay (hoặc ngày chỉ định) cùng trạng thái chấm công.
 */
export async function getMyShifts(date) {
  const params = {};
  if (date) params.date = date;
  const res = await api.get("/attendance/my-shifts", { params });
  return res.data;
}

/**
 * POST /attendance/checkin
 * Check-in vào 1 ca cụ thể.
 */
export async function checkIn(shiftId) {
  const res = await api.post("/attendance/checkin", { shift_id: shiftId });
  return res.data;
}

/**
 * POST /attendance/checkout
 * Check-out khỏi 1 ca cụ thể. Nếu về sớm, gửi kèm lý do.
 */
export async function checkOut(shiftId, earlyLeaveReason) {
  const body = { shift_id: shiftId };
  if (earlyLeaveReason) body.early_leave_reason = earlyLeaveReason;
  const res = await api.post("/attendance/checkout", body);
  return res.data;
}

/**
 * GET /attendance/history
 * Lịch sử chấm công với filters, pagination, và summary tổng hợp.
 */
export async function getHistory(params = {}) {
  const res = await api.get("/attendance/history", { params });
  return res.data;
}

/**
 * GET /attendance/:id
 * Chi tiết 1 bản ghi chấm công.
 */
export async function getAttendanceDetail(id) {
  const res = await api.get(`/attendance/${id}`);
  return res.data;
}
