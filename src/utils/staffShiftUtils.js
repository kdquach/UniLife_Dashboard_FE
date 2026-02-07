import dayjs from "dayjs";

export function isUpcomingShift(shift) {
  return dayjs(shift.start).isAfter(dayjs());
}

export function isShiftOngoing(shift) {
  const now = dayjs();
  return now.isAfter(dayjs(shift.start)) && now.isBefore(dayjs(shift.end));
}

export function getCurrentOrMostRecentShift(shifts) {
  if (!Array.isArray(shifts) || shifts.length === 0) return null;

  const sorted = [...shifts].sort((a, b) => dayjs(a.start).valueOf() - dayjs(b.start).valueOf());

  const ongoing = sorted.find((s) => isShiftOngoing(s));
  if (ongoing) return ongoing;

  const past = sorted.filter((s) => dayjs(s.end).isBefore(dayjs()));
  if (past.length) return past[past.length - 1];

  return sorted[0];
}
