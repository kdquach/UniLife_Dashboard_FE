import dayjs from "dayjs";

export const DEMO_STAFF_ID = "staff-001";

const baseMonday = dayjs().startOf("week").add(1, "day");

// Mock Shift definitions (Shift collection)
export const mockShiftDefinitions = [
  {
    _id: "shift-def-morning",
    name: "Ca Sáng",
    startTime: "08:00",
    endTime: "12:00",
    dayOfWeek: [1, 2, 3, 4, 5, 6, 7],
    canteenId: "canteen-a",
    status: "active",
  },
  {
    _id: "shift-def-afternoon",
    name: "Ca Chiều",
    startTime: "13:30",
    endTime: "17:30",
    dayOfWeek: [1, 2, 3, 4, 5, 6, 7],
    canteenId: "canteen-a",
    status: "active",
  },
];

function parseHm(hm) {
  const [h, m] = String(hm).split(":");
  return { h: Number(h), m: Number(m) };
}

function toDateTimeISO(dateStr, hm) {
  const { h, m } = parseHm(hm);
  return dayjs(dateStr).hour(h).minute(m).second(0).millisecond(0).toISOString();
}

function canteenName(canteenId) {
  if (canteenId === "canteen-b") return "Canteen B";
  return "Canteen A";
}

function computeAssignmentStatus(startISO, endISO) {
  const now = dayjs();
  if (now.isAfter(dayjs(endISO))) return "completed";
  if (now.isAfter(dayjs(startISO)) && now.isBefore(dayjs(endISO))) return "checked_in";
  return "assigned";
}

function buildWeekAssignments({ staffId, weekStart }) {
  const assignments = [];

  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    const date = dayjs(weekStart).add(dayOffset, "day").format("YYYY-MM-DD");

    // Each day always has exactly 2 shifts (Morning + Afternoon)
    for (const def of mockShiftDefinitions) {
      const start = toDateTimeISO(date, def.startTime);
      const end = toDateTimeISO(date, def.endTime);
      const status = computeAssignmentStatus(start, end);

      assignments.push({
        _id: `assign-${staffId}-${date}-${def._id}`,
        shiftId: def._id,
        staffId,
        canteenId: def.canteenId,
        date,
        status,
        checkInTime: status === "checked_in" ? start : null,
        actualWorkHours: status === "completed" ? 4 : null,
        notes: null,
      });
    }
  }

  return assignments;
}

// Mock Staff_Shift assignments (Shift Assignment collection)
export const mockStaffShiftAssignments = buildWeekAssignments({
  staffId: DEMO_STAFF_ID,
  weekStart: baseMonday,
});

export function deriveCalendarShift(assignment) {
  const def = mockShiftDefinitions.find((d) => d._id === assignment.shiftId);
  if (!def) return null;

  const start = toDateTimeISO(assignment.date, def.startTime);
  const end = toDateTimeISO(assignment.date, def.endTime);

  return {
    id: assignment._id,
    staffId: assignment.staffId,
    title: def.name,
    start,
    end,
    location: canteenName(assignment.canteenId),
    status: assignment.status,
    date: assignment.date,
    shiftDefinition: def,
  };
}

export function getMockCalendarShiftsByStaffId(staffId) {
  const assignments = mockStaffShiftAssignments.filter((a) => a.staffId === staffId);
  return assignments.map(deriveCalendarShift).filter(Boolean);
}
