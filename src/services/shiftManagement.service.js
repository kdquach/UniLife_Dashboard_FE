import { api } from "@/services/axios.config";

export async function getManagerShifts(params = {}) {
  const response = await api.get("/shifts", { params });
  return response.data?.data || [];
}

export async function getManagerAssignments(params = {}) {
  const response = await api.get("/shifts/assignments", { params });
  return response.data?.data || [];
}

export async function assignShiftToStaff(payload) {
  const response = await api.post("/shifts/assignments", payload);
  return response.data?.data?.assignment;
}

export async function saveShiftDraft(payload) {
  const response = await api.post("/shifts/draft/save", payload);
  return response.data?.data || [];
}

export async function publishShiftDraft(payload = {}) {
  const response = await api.post("/shifts/draft/publish", payload);
  return response.data?.data || [];
}

export async function getShiftDraft(params = {}) {
  const response = await api.get("/shifts/draft", { params });
  const data = Array.isArray(response.data?.data) ? response.data.data : [];
  return data.map((item) => ({
    ...item,
    status: "draft",
  }));
}

export async function cancelShiftDraft(params = {}) {
  const response = await api.delete("/shifts/draft/cancel", { params });
  return response.data?.data || {};
}

export async function removeAssignment(assignmentId) {
  await api.delete(`/shifts/assignments/${assignmentId}`);
}

export async function getShiftStaffList(params = {}) {
  const response = await api.get("/shifts/staff", { params });
  return response.data?.data || [];
}

export async function getShiftChangeRequests(params = {}) {
  const response = await api.get("/shifts/change-request", { params });
  return response.data?.data || [];
}

export async function getMyShiftChangeRequests(params = {}) {
  const response = await api.get("/shifts/my-change-requests", { params });
  return response.data?.data || [];
}

export async function reviewShiftChangeRequest(requestId, status) {
  const response = await api.patch(`/shifts/change-request/${requestId}`, {
    status,
  });
  return response.data?.data?.request;
}

export async function createShiftChangeRequest(payload) {
  const response = await api.post("/shifts/change-request", payload);
  return response.data?.data?.request;
}
