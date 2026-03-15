import { api } from "@/services/axios.config";

export async function getManagerShifts(params = {}) {
  const response = await api.get("/shifts", { params });
  return response.data?.data || [];
}

export async function getManagerAssignments(params = {}) {
  try {
    const response = await api.get("/schedules/published", {
      params: {
        ...(params?.weekStart ? { weekStart: params.weekStart } : {}),
        ...(params?.canteenId ? { canteenId: params.canteenId } : {}),
      },
    });
    return response.data?.data?.assignments || [];
  } catch (error) {
    if (error?.response?.status === 404) {
      return [];
    }
    throw error;
  }
}

export async function getManagerDraftAssignments(params = {}) {
  const response = await api.get("/schedules/draft", {
    params: {
      ...(params?.weekStart ? { weekStart: params.weekStart } : {}),
      ...(params?.canteenId ? { canteenId: params.canteenId } : {}),
    },
  });

  return {
    schedule: response.data?.data?.schedule || null,
    assignments: response.data?.data?.assignments || [],
  };
}

export async function saveShiftDraft(payload) {
  const response = await api.post("/schedules", payload);
  return {
    schedule: response.data?.data?.schedule || null,
    savedAssignments: Number(response.data?.data?.savedAssignments || 0),
    ignoredAssignments: Number(response.data?.data?.ignoredAssignments || 0),
  };
}

export async function publishShiftDraft(payload = {}) {
  const scheduleId = payload?.scheduleId;
  if (!scheduleId) {
    throw new Error("Thiếu scheduleId để publish lịch");
  }

  const response = await api.post(`/schedules/${scheduleId}/publish`);
  return response.data?.data?.schedule || null;
}

export async function getShiftStaffList(params = {}) {
  const response = await api.get("/users/staff", {
    params: {
      page: 1,
      limit: 200,
      ...(params?.search ? { search: params.search } : {}),
    },
  });
  return response.data?.data || [];
}

export async function getShiftChangeRequests(params = {}) {
  const response = await api.get("/shift-change-requests", { params });
  return response.data?.data || [];
}

export async function getMyShiftChangeRequests(params = {}) {
  const response = await api.get("/shift-change-requests/my", { params });
  return response.data?.data || [];
}

export async function reviewShiftChangeRequest(requestId, status) {
  const response = await api.patch(`/shift-change-requests/${requestId}`, {
    status,
  });
  return response.data?.data?.request;
}

export async function createShiftChangeRequest(payload) {
  const response = await api.post("/shift-change-requests", {
    staffShiftId: payload?.staffShiftId,
    reason: payload?.reason,
  });
  return response.data?.data?.request;
}
