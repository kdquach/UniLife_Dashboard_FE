import { api } from "./axios.config";

/**
 * 1. Lấy danh sách người dùng hệ thống
 * GET /users/system
 */
export const getSystemUsers = async (params = {}) => {
  const response = await api.get("/users/system", { params });
  return response.data;
};

/**
 * 2. Tạo tài khoản hệ thống
 * POST /users/system
 */
export const createSystemUser = async (payload) => {
  const response = await api.post("/users/system", payload);
  return response.data;
};

/**
 * 3. Cập nhật thông tin cá nhân cơ bản
 * PATCH /users/system/:userId
 */
export const updateSystemUser = async (userId, payload) => {
  const response = await api.patch(`/users/system/${userId}`, payload);
  return response.data;
};

/**
 * 4. Vô hiệu hoá tài khoản
 * PATCH /users/system/:userId/disable
 */
export const disableSystemUser = async (userId, reason) => {
  const response = await api.patch(`/users/system/${userId}/disable`, { reason });
  return response.data;
};

/**
 * 5. Mở khoá tài khoản
 * PATCH /users/system/:userId/reenable
 */
export const reenableSystemUser = async (userId, reason) => {
  const response = await api.patch(`/users/system/${userId}/reenable`, { reason });
  return response.data;
};

/**
 * 6. Nâng / Thay đổi vai trò (Assign Role)
 * PATCH /users/system/:userId/role
 */
export const assignRoleSystemUser = async (userId, role) => {
  const response = await api.patch(`/users/system/${userId}/role`, { role });
  return response.data;
};

/**
 * 7. Hạ vai trò (Downgrade Role)
 * DELETE /users/system/:userId/role
 */
export const downgradeRoleSystemUser = async (userId, payload) => {
  const response = await api.delete(`/users/system/${userId}/role`, { data: payload });
  return response.data;
};

/**
 * 8. Cấp lại mật khẩu (Reissue Password)
 * PATCH /users/system/:userId/reissue-password
 */
export const reissuePasswordSystemUser = async (userId) => {
  const response = await api.patch(`/users/system/${userId}/reissue-password`);
  return response.data;
};

/**
 * 9. Xóa tài khoản chưa kích hoạt (Delete Pending User)
 * DELETE /users/system/:userId
 */
export const deletePendingSystemUser = async (userId) => {
  const response = await api.delete(`/users/system/${userId}`);
  return response.data;
};
