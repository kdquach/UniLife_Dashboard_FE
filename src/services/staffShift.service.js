import dayjs from "dayjs";
import { api } from "@/services/axios.config";

function resolveShiftLabel(name, startTime, endTime) {
  const start = String(startTime || "").trim();
  const end = String(endTime || "").trim();

  if (start === "06:00" && end === "12:00") return "Ca sáng";
  if (start === "12:00" && end === "18:00") return "Ca chiều";
  return name || "Ca làm việc";
}

function toDateTimeISO(dateValue, timeValue) {
  const datePart = dayjs(dateValue).format("YYYY-MM-DD");
  const timePart = typeof timeValue === "string" && timeValue ? timeValue : "00:00";
  return dayjs(`${datePart} ${timePart}`, "YYYY-MM-DD HH:mm").toISOString();
}

function normalizeAssignment(assignment) {
  const shift = assignment?.shiftId || {};
  const canteen = assignment?.canteenId || {};
  const staff = assignment?.staffId || {};

  return {
    id: assignment?._id,
    assignmentId: assignment?._id,
    shiftId: shift?._id || assignment?.shiftId || null,
    staffId: staff?._id || staff?.id || assignment?.staffId || null,
    title: resolveShiftLabel(shift?.name, shift?.startTime, shift?.endTime),
    start: toDateTimeISO(assignment?.date, shift?.startTime),
    end: toDateTimeISO(assignment?.date, shift?.endTime),
    location: canteen?.location || canteen?.name || "—",
    canteenId: canteen?._id || assignment?.canteenId || null,
    campusId: staff?.campusId || null,
    canteenName: canteen?.name || "—",
    status: assignment?.status || "assigned",
    checkInTime: assignment?.checkInTime || null,
    checkOutTime: assignment?.checkOutTime || null,
    actualWorkHours: assignment?.actualWorkHours ?? 0,
    shiftStartTime: shift?.startTime || "—",
    shiftEndTime: shift?.endTime || "—",
  };
}

export async function getMyStaffShifts(params = {}) {
  const response = await api.get("/shifts/my-assignments", { params });
  const assignments = Array.isArray(response?.data?.data) ? response.data.data : [];
  return assignments.map(normalizeAssignment);
}
