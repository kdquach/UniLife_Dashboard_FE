import { create } from "zustand";
import dayjs from "dayjs";

export const useShiftRequestStore = create((set, get) => ({
  requests: [],

  createShiftChangeRequest: ({ shiftId, reason, fromShiftId, toShiftId }) => {
    const request = {
      id: `req-${Date.now()}`,
      shiftId: shiftId ?? fromShiftId ?? null,
      fromShiftId: fromShiftId ?? null,
      toShiftId: toShiftId ?? null,
      reason: reason?.trim() ?? "",
      status: "Pending",
      createdAt: dayjs().toISOString(),
    };

    set({ requests: [request, ...get().requests] });
    return request;
  },
}));
