import { getMockCalendarShiftsByStaffId } from "@/utils/staffMockData";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getStaffShifts(staffId) {
  await delay(250);
  if (!staffId) return getMockCalendarShiftsByStaffId("staff-001");
  return getMockCalendarShiftsByStaffId(staffId);
}
